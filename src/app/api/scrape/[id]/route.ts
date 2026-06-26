import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getScraperProvider } from "@/lib/scraper/apify";

/* Poll del estado de un scrape job: cuando el run externo termina,
   ingesta los resultados con deduplicación por place_id. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: job } = await supabase.from("scrape_jobs").select().eq("id", id).single();
  if (!job) return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });

  if (job.status === "done" || job.status === "error") {
    return NextResponse.json({ status: job.status, resultsCount: job.results_count, error: job.error_message });
  }
  if (!job.apify_run_id) {
    return NextResponse.json({ status: job.status, resultsCount: 0 });
  }

  const provider = getScraperProvider();
  const runStatus = await provider.getRunStatus(job.apify_run_id);

  if (runStatus === "running") {
    return NextResponse.json({ status: "running", resultsCount: 0 });
  }

  if (runStatus === "failed") {
    await supabase
      .from("scrape_jobs")
      .update({ status: "error", error_message: "El run del scraper falló", finished_at: new Date().toISOString() })
      .eq("id", job.id);
    return NextResponse.json({ status: "error", error: "El run del scraper falló" });
  }

  // succeeded → ingesta con dedupe
  const results = await provider.getResults(job.apify_run_id);
  let inserted = 0;
  if (results.length > 0) {
    const rows = results.map((r) => ({
      ...r,
      user_id: user.id,
      scrape_job_id: job.id,
      has_website: r.website != null,
      email_source: r.email ? "maps" : null,
      enrichment_status: r.email ? "done" : "pending",
    }));
    const { data: upserted, error } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "user_id,place_id", ignoreDuplicates: true })
      .select("id");
    if (error) {
      await supabase
        .from("scrape_jobs")
        .update({ status: "error", error_message: error.message, finished_at: new Date().toISOString() })
        .eq("id", job.id);
      return NextResponse.json({ status: "error", error: error.message });
    }
    inserted = upserted?.length ?? 0;
  }

  await supabase
    .from("scrape_jobs")
    .update({ status: "done", results_count: inserted, finished_at: new Date().toISOString() })
    .eq("id", job.id);

  await supabase.from("activity_log").insert({
    user_id: user.id,
    type: "scraped",
    description: `Escaneo completado · ${inserted} nuevos · ${job.category} / ${job.zone}`,
    metadata: { scrape_job_id: job.id, total_found: results.length, inserted },
  });

  return NextResponse.json({ status: "done", resultsCount: inserted, totalFound: results.length });
}
