import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* Redirección con tracking de clics (PRD §6.4). */
export async function GET(request: Request, { params }: { params: Promise<{ sendId: string }> }) {
  const { sendId } = await params;
  const url = new URL(request.url).searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }
  try {
    const supabase = createAdminClient();
    const { data: send } = await supabase.from("email_sends").select("id").eq("id", sendId).maybeSingle();
    if (send) {
      await supabase.from("email_events").insert({
        email_send_id: sendId,
        type: "clicked",
        metadata: { url },
      });
    }
  } catch {
    // la redirección nunca debe fallar por el tracking
  }
  return NextResponse.redirect(url, 302);
}
