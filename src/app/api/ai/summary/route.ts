import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeLead } from "@/lib/ai/generate";
import type { Lead } from "@/lib/types";

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
  const leadId = String(body.leadId ?? "");
  if (!leadId) return NextResponse.json({ error: "leadId requerido" }, { status: 400 });

  const { data: leadData } = await supabase.from("leads").select().eq("id", leadId).maybeSingle();
  const lead = (leadData as Lead) ?? null;
  if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

  const [{ data: activity }, { data: replies }] = await Promise.all([
    supabase
      .from("activity_log")
      .select("type, description, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("replies")
      .select("ai_classification, snippet")
      .eq("lead_id", leadId)
      .order("received_at", { ascending: false })
      .limit(5),
  ]);

  const summary = await summarizeLead({
    lead,
    activity: activity ?? [],
    replies: replies ?? [],
  });
  if (!summary) return NextResponse.json({ error: "Jarvis no pudo generar el análisis" }, { status: 502 });

  await supabase
    .from("leads")
    .update({ ai_summary: summary, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  return NextResponse.json({ summary });
}
