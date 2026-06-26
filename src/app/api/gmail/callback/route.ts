import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/gmail";

/* Callback del OAuth de Gmail: guarda el refresh token (PRD §6.5). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gmail_oauth_state")?.value;

  const redirect = (status: string) => NextResponse.redirect(new URL(`/settings?gmail=${status}`, url.origin));

  if (!code || !state || !expectedState || state !== expectedState) return redirect("error");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) return redirect("no_refresh_token");
    await supabase.from("gmail_tokens").upsert(
      {
        user_id: user.id,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      },
      { onConflict: "user_id" }
    );
    return redirect("connected");
  } catch {
    return redirect("error");
  }
}
