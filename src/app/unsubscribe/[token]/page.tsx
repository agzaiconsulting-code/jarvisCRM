import { createAdminClient } from "@/lib/supabase/admin";

/* Baja en un clic (PRD §6.4 y §9): página pública, idempotente.
   El token uuid es la credencial; añade a suppression_list y detiene secuencias. */

async function processUnsubscribe(token: string): Promise<"ok" | "invalid"> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return "invalid";
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("unsubscribe_tokens")
    .select("user_id, lead_id")
    .eq("token", token)
    .maybeSingle();
  if (!row?.lead_id) return "invalid";

  const { data: lead } = await supabase.from("leads").select().eq("id", row.lead_id).maybeSingle();
  if (!lead) return "invalid";

  if (!lead.unsubscribed) {
    await supabase
      .from("leads")
      .update({ unsubscribed: true, updated_at: new Date().toISOString() })
      .eq("id", lead.id);
    if (lead.email) {
      await supabase
        .from("suppression_list")
        .upsert(
          { user_id: row.user_id, email: lead.email.toLowerCase(), reason: "unsubscribe" },
          { onConflict: "user_id,email", ignoreDuplicates: true }
        );
    }
    await supabase.from("campaign_leads").update({ status: "stopped" }).eq("lead_id", lead.id);
    await supabase.from("activity_log").insert({
      user_id: row.user_id,
      lead_id: lead.id,
      type: "note",
      description: `${lead.name} se dio de baja de los envíos`,
      metadata: { reason: "unsubscribe" },
    });
  }
  return "ok";
}

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await processUnsubscribe(token);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg, #050810)",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          textAlign: "center",
          border: "1px solid rgba(56,189,248,0.25)",
          background: "rgba(13,25,48,0.55)",
          padding: "40px 32px",
          borderRadius: 4,
        }}
      >
        {result === "ok" ? (
          <>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>Baja confirmada</h1>
            <p style={{ color: "#7e93b8", fontSize: 14, lineHeight: 1.7 }}>
              No volverás a recibir emails nuestros. Tu dirección ha sido añadida a la lista de exclusión de forma
              permanente.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>Enlace no válido</h1>
            <p style={{ color: "#7e93b8", fontSize: 14, lineHeight: 1.7 }}>
              El enlace de baja no es válido o ha expirado.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
