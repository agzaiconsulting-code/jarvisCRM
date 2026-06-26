import type { SupabaseClient } from "@supabase/supabase-js";

/* Cliente mínimo de Gmail API (readonly) vía fetch — sin dependencia googleapis. */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export function gmailAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  refresh_token?: string;
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange falló: ${await res.text()}`);
  return res.json();
}

/** Devuelve un access token válido, refrescándolo si caducó. */
export async function getAccessToken(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: row } = await supabase.from("gmail_tokens").select().eq("user_id", userId).maybeSingle();
  if (!row?.refresh_token) return null;

  if (row.access_token && row.expires_at && new Date(row.expires_at).getTime() > Date.now() + 60000) {
    return row.access_token as string;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: row.refresh_token as string,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in: number };
  await supabase
    .from("gmail_tokens")
    .update({
      access_token: data.access_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId);
  return data.access_token;
}

export async function listMessageIds(accessToken: string, query: string, maxResults = 50): Promise<string[]> {
  const res = await fetch(`${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  return (data.messages ?? []).map((m) => m.id);
}

export interface GmailMessage {
  id: string;
  fromEmail: string | null;
  subject: string | null;
  snippet: string;
  bodyText: string;
  inReplyTo: string | null;
  references: string[];
  receivedAt: string | null;
}

function b64urlDecode(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

function extractText(part: GmailPart): string {
  if (part.mimeType === "text/plain" && part.body?.data) return b64urlDecode(part.body.data);
  for (const p of part.parts ?? []) {
    const t = extractText(p);
    if (t) return t;
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    return b64urlDecode(part.body.data).replace(/<[^>]+>/g, " ");
  }
  return "";
}

export async function getMessage(accessToken: string, id: string): Promise<GmailMessage | null> {
  const res = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    id: string;
    snippet?: string;
    internalDate?: string;
    payload?: GmailPart & { headers?: Array<{ name: string; value: string }> };
  };

  const headers = new Map(
    (data.payload?.headers ?? []).map((h) => [h.name.toLowerCase(), h.value] as [string, string])
  );
  const fromRaw = headers.get("from") ?? "";
  const fromEmail = fromRaw.match(/<([^>]+)>/)?.[1] ?? (fromRaw.includes("@") ? fromRaw.trim() : null);

  return {
    id: data.id,
    fromEmail: fromEmail?.toLowerCase() ?? null,
    subject: headers.get("subject") ?? null,
    snippet: data.snippet ?? "",
    bodyText: data.payload ? extractText(data.payload).slice(0, 8000) : "",
    inReplyTo: headers.get("in-reply-to") ?? null,
    references: (headers.get("references") ?? "").split(/\s+/).filter(Boolean),
    receivedAt: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : null,
  };
}
