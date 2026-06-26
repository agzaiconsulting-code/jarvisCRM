import { createAdminClient } from "@/lib/supabase/admin";

// GIF transparente 1x1
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

function pixelResponse(): Response {
  return new Response(new Uint8Array(PIXEL), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

/* Pixel de apertura (PRD §6.4). Endpoint público: el sendId (uuid) es la credencial. */
export async function GET(_request: Request, { params }: { params: Promise<{ sendId: string }> }) {
  const { sendId } = await params;
  try {
    const supabase = createAdminClient();
    const { data: send } = await supabase.from("email_sends").select().eq("id", sendId).maybeSingle();
    if (!send) return pixelResponse();

    await supabase.from("email_events").insert({ email_send_id: sendId, type: "opened" });

    if (send.lead_id) {
      const { data: lead } = await supabase.from("leads").select().eq("id", send.lead_id).maybeSingle();
      if (lead && (lead.status === "contacted" || lead.status === "new")) {
        await supabase
          .from("leads")
          .update({ status: "opened", updated_at: new Date().toISOString() })
          .eq("id", lead.id);
        await supabase.from("activity_log").insert({
          user_id: send.user_id,
          lead_id: lead.id,
          type: "opened",
          description: `${lead.name} abrió el email "${send.subject ?? ""}"`,
          metadata: { send_id: sendId },
        });
      }
    }
  } catch {
    // el pixel nunca debe fallar
  }
  return pixelResponse();
}
