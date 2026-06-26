import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findEmailOnWebsite, withConcurrency } from "@/lib/enrich";
import type { Lead } from "@/lib/types";

const CONCURRENCY = 4;
const BATCH_SIZE = 25;

/* Enriquecimiento (PRD §6.2): para leads pendientes con web,
   rastrea home + contacto y extrae email. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const scrapeJobId = body.scrapeJobId as string | undefined;

  let query = supabase
    .from("leads")
    .select()
    .eq("user_id", user.id)
    .eq("enrichment_status", "pending")
    .limit(BATCH_SIZE);
  if (scrapeJobId) query = query.eq("scrape_job_id", scrapeJobId);

  const { data: leads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!leads?.length) return NextResponse.json({ processed: 0, found: 0, remaining: 0 });

  let found = 0;
  await withConcurrency(leads as Lead[], CONCURRENCY, async (lead) => {
    if (!lead.website) {
      await supabase
        .from("leads")
        .update({ has_website: false, enrichment_status: "no_email" })
        .eq("id", lead.id);
      return;
    }
    const email = await findEmailOnWebsite(lead.website);
    if (email) {
      found++;
      await supabase
        .from("leads")
        .update({ has_website: true, email, email_source: "website", enrichment_status: "done" })
        .eq("id", lead.id);
      await supabase.from("activity_log").insert({
        user_id: user.id,
        lead_id: lead.id,
        type: "enriched",
        description: `Email encontrado para ${lead.name}`,
        metadata: { email },
      });
    } else {
      await supabase
        .from("leads")
        .update({ has_website: true, enrichment_status: "no_email" })
        .eq("id", lead.id);
    }
  });

  let remainingQuery = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("enrichment_status", "pending");
  if (scrapeJobId) remainingQuery = remainingQuery.eq("scrape_job_id", scrapeJobId);
  const { count: remaining } = await remainingQuery;

  return NextResponse.json({ processed: leads.length, found, remaining: remaining ?? 0 });
}
