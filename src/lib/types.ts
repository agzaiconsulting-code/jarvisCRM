export type LeadStatus =
  | "new"
  | "contacted"
  | "opened"
  | "replied"
  | "qualified"
  | "won"
  | "lost";

export type EnrichmentStatus = "pending" | "done" | "no_email" | "error";
export type ScrapeJobStatus = "pending" | "running" | "done" | "error";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type CampaignLeadStatus = "pending" | "in_progress" | "replied" | "completed" | "stopped";
export type EmailSendStatus = "queued" | "sent" | "delivered" | "bounced" | "failed";
export type EmailEventType = "delivered" | "opened" | "clicked" | "bounced" | "complained";
export type ReplyClassification =
  | "interested"
  | "not_interested"
  | "auto_reply"
  | "unsubscribe"
  | "question"
  | "other";

export interface Lead {
  id: string;
  user_id: string;
  scrape_job_id: string | null;
  place_id: string | null;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  lat: number | null;
  lng: number | null;
  has_website: boolean;
  email: string | null;
  email_source: "maps" | "website" | "manual" | null;
  enrichment_status: EnrichmentStatus;
  status: LeadStatus;
  ai_summary: string | null;
  notes: string | null;
  unsubscribed: boolean;
  bounced: boolean;
  created_at: string;
  updated_at: string;
}

export interface NormalizedLead {
  place_id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  lat: number | null;
  lng: number | null;
  email: string | null;
}

export interface ScrapeJob {
  id: string;
  user_id: string;
  category: string;
  zone: string;
  center_lat: number | null;
  center_lng: number | null;
  radius_meters: number | null;
  status: ScrapeJobStatus;
  apify_run_id: string | null;
  results_count: number;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: CampaignStatus;
  created_at: string;
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  delay_days: number;
  template_id: string | null;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  current_step: number;
  status: CampaignLeadStatus;
  next_step_due_at: string | null;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  lead_id: string | null;
  type: "scraped" | "enriched" | "email_sent" | "opened" | "replied" | "status_changed" | "note";
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Settings {
  user_id: string;
  sending_domain: string | null;
  daily_send_cap: number;
  sender_name: string | null;
  sender_email: string | null;
  company_legal_name: string | null;
  company_address: string | null;
  unsubscribe_base_url: string | null;
}
