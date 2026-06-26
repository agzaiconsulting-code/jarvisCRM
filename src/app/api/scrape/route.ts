import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getScraperProvider } from "@/lib/scraper/apify";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const category = String(body.category ?? "").trim();
  const zone = String(body.zone ?? "").trim();
  const maxResults = Math.min(Math.max(Number(body.maxResults) || 100, 1), 500);
  const centerLat = body.centerLat != null ? Number(body.centerLat) : undefined;
  const centerLng = body.centerLng != null ? Number(body.centerLng) : undefined;
  const radiusMeters = body.radiusMeters != null ? Number(body.radiusMeters) : undefined;

  if (!category || !zone) {
    return NextResponse.json({ error: "Categoría y zona son obligatorias" }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from("scrape_jobs")
    .insert({
      user_id: user.id,
      category,
      zone,
      center_lat: centerLat ?? null,
      center_lng: centerLng ?? null,
      radius_meters: radiusMeters ?? null,
      status: "pending",
    })
    .select()
    .single();
  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });

  try {
    const provider = getScraperProvider();
    const { runId } = await provider.startSearch({
      category,
      zone,
      centerLat,
      centerLng,
      radiusMeters,
      maxResults,
    });
    await supabase
      .from("scrape_jobs")
      .update({ status: "running", apify_run_id: runId })
      .eq("id", job.id);
    return NextResponse.json({ jobId: job.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error lanzando el scraper";
    await supabase
      .from("scrape_jobs")
      .update({ status: "error", error_message: message })
      .eq("id", job.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
