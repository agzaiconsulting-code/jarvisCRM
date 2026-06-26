"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { HUDPanel, ScreenHead, Field, Btn, Chip, EmptyState, BootLoader } from "@/components/hud";

const OTHER = "__other__";

const ScanMap = dynamic(() => import("@/components/ScanMap"), {
  ssr: false,
  loading: () => <BootLoader label="Cargando mapa" />,
});

// Navalcarnero por defecto (PRD §2.2)
const DEFAULT_CENTER = { lat: 40.2873, lng: -4.0119 };

type Phase = "idle" | "scanning" | "enriching" | "done" | "error";

export default function ScanPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySel, setCategorySel] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const category = categorySel === OTHER ? customCategory.trim() : categorySel;
  const [zone, setZone] = useState("Navalcarnero");
  const [radiusKm, setRadiusKm] = useState(2.5);
  const [maxResults, setMaxResults] = useState(100);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [resultsCount, setResultsCount] = useState(0);
  const [emailsFound, setEmailsFound] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    createClient()
      .from("categories")
      .select("name")
      .order("sort_order")
      .then(({ data }) => setCategories(((data as { name: string }[]) ?? []).map((c) => c.name)));
  }, []);

  async function geocodeZone() {
    if (!zone.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(zone)}`
      );
      const data = await res.json();
      if (data[0]) setCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
    } catch {
      // sin geocoding seguimos con el centro actual
    }
  }

  async function runEnrichment(scrapeJobId: string) {
    setPhase("enriching");
    let totalFound = 0;
    // bucle por lotes hasta agotar pendientes
    for (let guard = 0; guard < 30; guard++) {
      setStatusMsg(`Enriqueciendo leads (web + email)… ${totalFound} emails encontrados`);
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapeJobId }),
      });
      if (!res.ok) break;
      const data = await res.json();
      totalFound += data.found;
      setEmailsFound(totalFound);
      if (data.remaining === 0) break;
    }
    setPhase("done");
  }

  async function startScan() {
    setPhase("scanning");
    setResultsCount(0);
    setEmailsFound(0);
    setStatusMsg("Lanzando escaneo en el proveedor…");

    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        zone,
        maxResults,
        centerLat: center.lat,
        centerLng: center.lng,
        radiusMeters: Math.round(radiusKm * 1000),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatusMsg(data.error ?? "Error lanzando el escaneo");
      setPhase("error");
      return;
    }
    const { jobId } = await res.json();
    setStatusMsg("Escaneando Google Maps… (puede tardar unos minutos)");

    pollRef.current = setInterval(async () => {
      const poll = await fetch(`/api/scrape/${jobId}`);
      if (!poll.ok) return;
      const data = await poll.json();
      if (data.status === "done") {
        if (pollRef.current) clearInterval(pollRef.current);
        setResultsCount(data.resultsCount);
        setStatusMsg(`Escaneo completado · ${data.resultsCount} leads nuevos`);
        await runEnrichment(jobId);
      } else if (data.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatusMsg(data.error ?? "Error en el escaneo");
        setPhase("error");
      }
    }, 5000);
  }

  const busy = phase === "scanning" || phase === "enriching";

  return (
    <div>
      <ScreenHead title="Buscar leads" sub="MÓDULO DE ESCANEO · FUENTE: GOOGLE MAPS (APIFY)" />

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
        <HUDPanel title="Parámetros de escaneo" delay={0}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Categoría">
              <select
                className="hud-select"
                style={{ width: "100%" }}
                value={categorySel}
                onChange={(e) => setCategorySel(e.target.value)}
                disabled={busy}
              >
                <option value="">— Selecciona categoría —</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={OTHER}>Otra…</option>
              </select>
            </Field>
            {categorySel === OTHER ? (
              <Field label="Categoría personalizada" hint="ej. talleres mecánicos, peluquerías…">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  disabled={busy}
                />
              </Field>
            ) : null}
            <Field label="Zona" hint="Pulsa fuera del campo para centrar el mapa">
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                onBlur={geocodeZone}
                disabled={busy}
              />
            </Field>
            <Field label={`Radio de búsqueda · ${radiusKm.toFixed(1)} km`}>
              <input
                type="range"
                className="hud-range"
                min="0.5"
                max="10"
                step="0.5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                disabled={busy}
              />
            </Field>
            <Field label="Máx. resultados">
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
                disabled={busy}
              />
            </Field>
            <hr className="hr-fade" />
            <Btn variant="gold" onClick={startScan} disabled={busy || !category.trim() || !zone.trim()}>
              {busy ? "Escaneando…" : "Iniciar escaneo"}
            </Btn>
            {phase === "done" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Chip color="ok">
                  {resultsCount} leads nuevos · {emailsFound} emails
                </Chip>
                <a href="/leads">
                  <Btn variant="blue" sm>
                    Ver en pipeline →
                  </Btn>
                </a>
              </div>
            )}
            {phase === "error" && <Chip color="danger">{statusMsg}</Chip>}
          </div>
        </HUDPanel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HUDPanel
            title={busy ? "Escaneando sector…" : "Zona objetivo"}
            delay={80}
            className={busy ? "scanline-wrap" : ""}
            right={
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--dim)" }}>
                {center.lat.toFixed(4)}° · {center.lng.toFixed(4)}° — clic en el mapa para mover el centro
              </span>
            }
          >
            <ScanMap center={center} radiusMeters={radiusKm * 1000} onSelect={(lat, lng) => setCenter({ lat, lng })} />
          </HUDPanel>

          {busy && (
            <HUDPanel delay={0}>
              <BootLoader label={statusMsg || "Procesando"} />
            </HUDPanel>
          )}

          {phase === "idle" && (
            <HUDPanel delay={160}>
              <EmptyState
                title="Sistema en espera"
                sub="Define categoría, zona y radio. Jarvis rastreará Google Maps, deduplicará por place_id y buscará emails en las webs."
              />
            </HUDPanel>
          )}

          {phase === "done" && (
            <HUDPanel delay={0}>
              <EmptyState
                title="Escaneo completado"
                sub={`${resultsCount} leads nuevos incorporados al pipeline · ${emailsFound} emails encontrados en webs.`}
              />
            </HUDPanel>
          )}
        </div>
      </div>
    </div>
  );
}
