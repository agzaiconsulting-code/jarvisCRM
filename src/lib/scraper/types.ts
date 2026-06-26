import type { NormalizedLead } from "@/lib/types";

export interface ScraperSearchParams {
  category: string;
  zone: string;
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  maxResults: number;
}

/* Abstracción del proveedor de scraping (PRD §2.1):
   nada fuera de esta capa debe conocer Apify. */
export interface ScraperProvider {
  /** Lanza una búsqueda asíncrona y devuelve el id del run externo. */
  startSearch(params: ScraperSearchParams): Promise<{ runId: string }>;
  /** Consulta el estado de un run lanzado con startSearch. */
  getRunStatus(runId: string): Promise<"running" | "succeeded" | "failed">;
  /** Recupera y normaliza los resultados de un run terminado. */
  getResults(runId: string): Promise<NormalizedLead[]>;
}
