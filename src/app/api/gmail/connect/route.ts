import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { gmailAuthUrl } from "@/lib/gmail";

/* Inicia el OAuth de Gmail (readonly). Ruta autenticada. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" }, { status: 500 });
  }

  const state = randomUUID();
  const res = NextResponse.redirect(gmailAuthUrl(state));
  res.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
