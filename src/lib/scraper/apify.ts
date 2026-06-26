import { ApifyClient } from "apify-client";
import type { NormalizedLead } from "@/lib/types";
import type { ScraperProvider, ScraperSearchParams } from "./types";

const DEFAULT_ACTOR = "compass/crawler-google-places";

interface ApifyPlaceItem {
  placeId?: string;
  title?: string;
  categoryName?: string;
  address?: string;
  phone?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  location?: { lat?: number; lng?: number };
  emails?: string[];
}

export class ApifyProvider implements ScraperProvider {
  private client: ApifyClient;
  private actorId: string;

  constructor() {
    this.client = new ApifyClient({ token: process.env.APIFY_TOKEN });
    this.actorId = process.env.APIFY_GMAPS_ACTOR_ID || DEFAULT_ACTOR;
  }

  async startSearch(params: ScraperSearchParams): Promise<{ runId: string }> {
    const input: Record<string, unknown> = {
      searchStringsArray: [`${params.category} ${params.zone}`],
      maxCrawledPlacesPerSearch: params.maxResults,
      language: "es",
      scrapeContacts: false,
      scrapePlaceDetailPage: false,
      maxImages: 0,
      maxReviews: 0,
    };
    if (params.centerLat != null && params.centerLng != null && params.radiusMeters) {
      input.customGeolocation = {
        type: "Point",
        coordinates: [params.centerLng, params.centerLat],
        radiusKm: Math.max(1, Math.round(params.radiusMeters / 1000)),
      };
    }
    const run = await this.client.actor(this.actorId).start(input);
    return { runId: run.id };
  }

  async getRunStatus(runId: string): Promise<"running" | "succeeded" | "failed"> {
    const run = await this.client.run(runId).get();
    if (!run) return "failed";
    if (run.status === "SUCCEEDED") return "succeeded";
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) return "failed";
    return "running";
  }

  async getResults(runId: string): Promise<NormalizedLead[]> {
    const run = await this.client.run(runId).get();
    if (!run?.defaultDatasetId) return [];
    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
    return (items as ApifyPlaceItem[])
      .filter((it) => it.placeId && it.title)
      .map((it) => ({
        place_id: it.placeId!,
        name: it.title!,
        category: it.categoryName ?? null,
        address: it.address ?? null,
        phone: it.phone ?? null,
        website: it.website ?? null,
        rating: it.totalScore ?? null,
        reviews_count: it.reviewsCount ?? null,
        lat: it.location?.lat ?? null,
        lng: it.location?.lng ?? null,
        email: it.emails?.[0] ?? null,
      }));
  }
}

export function getScraperProvider(): ScraperProvider {
  return new ApifyProvider();
}
