import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftEmail } from "@/lib/ai/generate";
import type { Lead, Settings } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA no configurada (falta ANTHROPIC_API_KEY)" }, { status: 503 });
  }

  const body = await request.json();
  const goal = String(body.goal ?? "").trim();
  if (!goal) return NextResponse.json({ error: "Indica el objetivo del email" }, { status: 400 });

  let lead: Lead | null = null;
  if (body.leadId) {
    const { data } = await supabase.from("leads").select().eq("id", body.leadId).maybeSingle();
    lead = (data as Lead) ?? null;
  }

  const { data: settings } = await supabase
    .from("settings")
    .select()
    .eq("user_id", user.id)
    .maybeSingle();

  const draft = await draftEmail({
    goal,
    category: body.category ?? null,
    zone: body.zone ?? null,
    senderName: (settings as Settings | null)?.sender_name ?? null,
    lead,
  });
  if (!draft) return NextResponse.json({ error: "Jarvis no pudo generar el email" }, { status: 502 });

  return NextResponse.json(draft);
}
