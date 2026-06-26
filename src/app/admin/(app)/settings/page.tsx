"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HUDPanel, ScreenHead, Btn, Field, Chip, BootLoader } from "@/components/hud";
import type { Settings } from "@/lib/types";

const EMPTY: Omit<Settings, "user_id"> = {
  sending_domain: null,
  daily_send_cap: 50,
  sender_name: null,
  sender_email: null,
  company_legal_name: null,
  company_address: null,
  unsubscribe_base_url: null,
};

export default function SettingsPage() {
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailMsg, setGmailMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data }, { data: gmail }] = await Promise.all([
        supabase.from("settings").select().eq("user_id", user.id).maybeSingle(),
        supabase.from("gmail_tokens").select("user_id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (data) setForm({ ...EMPTY, ...(data as Settings) });
      setGmailConnected(!!gmail);
      setLoaded(true);
    })();
    const status = new URLSearchParams(window.location.search).get("gmail");
    if (status === "connected") setGmailMsg("Gmail conectado correctamente");
    else if (status === "no_refresh_token")
      setGmailMsg("Google no devolvió refresh token: revoca el acceso en tu cuenta y vuelve a conectar");
    else if (status === "error") setGmailMsg("Error conectando Gmail");
  }, []);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("settings")
      .upsert({ user_id: userId, ...form, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    setDirty(false);
  }

  const legalOk = !!(form.sender_email && form.company_legal_name && form.company_address);

  if (!loaded) {
    return (
      <div>
        <ScreenHead title="Ajustes" sub="CONFIGURACIÓN DE ENVÍO Y CUMPLIMIENTO" />
        <HUDPanel>
          <BootLoader label="Cargando configuración" />
        </HUDPanel>
      </div>
    );
  }

  return (
    <div>
      <ScreenHead
        title="Ajustes"
        sub="CONFIGURACIÓN DE ENVÍO Y CUMPLIMIENTO"
        right={
          <Btn variant="gold" sm onClick={save} disabled={saving || !dirty}>
            {saving ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado"}
          </Btn>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <HUDPanel title="Remitente" delay={0}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Nombre del remitente" hint="Aparece en el campo De: de los emails">
              <input type="text" value={form.sender_name ?? ""} onChange={(e) => set("sender_name", e.target.value || null)} />
            </Field>
            <Field label="Email del remitente" hint="Debe pertenecer al dominio verificado en Resend">
              <input type="email" value={form.sender_email ?? ""} onChange={(e) => set("sender_email", e.target.value || null)} />
            </Field>
            <Field label="Dominio de envío" hint="Dominio verificado en Resend (ej. agzai.com)">
              <input type="text" value={form.sending_domain ?? ""} onChange={(e) => set("sending_domain", e.target.value || null)} />
            </Field>
            <Field label="Límite diario de envíos" hint="Cap de emails/día entre todas las campañas">
              <input
                type="number"
                min={1}
                max={500}
                value={form.daily_send_cap}
                onChange={(e) => set("daily_send_cap", parseInt(e.target.value) || 50)}
              />
            </Field>
          </div>
        </HUDPanel>

        <HUDPanel title="Pie legal (RGPD / LSSI)" gold delay={80} right={legalOk ? <Chip color="ok">Completo</Chip> : <Chip color="danger">Incompleto</Chip>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Razón social" hint="Obligatorio en el pie de cada email">
              <input
                type="text"
                value={form.company_legal_name ?? ""}
                onChange={(e) => set("company_legal_name", e.target.value || null)}
              />
            </Field>
            <Field label="Dirección postal" hint="Obligatoria en el pie de cada email">
              <input
                type="text"
                value={form.company_address ?? ""}
                onChange={(e) => set("company_address", e.target.value || null)}
              />
            </Field>
            <Field label="URL base de bajas" hint="Opcional; por defecto APP_BASE_URL/unsubscribe">
              <input
                type="text"
                value={form.unsubscribe_base_url ?? ""}
                onChange={(e) => set("unsubscribe_base_url", e.target.value || null)}
              />
            </Field>
            <p style={{ fontSize: 11.5, color: "var(--dim)", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-mono)" }}>
              Todos los envíos incluyen automáticamente el pie con razón social, dirección y enlace de baja en un clic.
              Sin estos datos no se puede lanzar ninguna campaña.
            </p>
          </div>
        </HUDPanel>

        <HUDPanel
          title="Gmail (respuestas)"
          delay={160}
          right={gmailConnected ? <Chip color="ok">Conectado</Chip> : <Chip color="dim">Sin conectar</Chip>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.7, margin: 0 }}>
              Acceso de solo lectura para detectar respuestas a tus campañas: se emparejan con su lead, se clasifican
              con IA y detienen la secuencia automáticamente. Sincronización cada 15 minutos.
            </p>
            {gmailMsg ? <Chip color={gmailMsg.includes("correctamente") ? "ok" : "danger"}>{gmailMsg}</Chip> : null}
            <div>
              <a href="/api/gmail/connect">
                <Btn variant={gmailConnected ? "ghost" : "blue"} sm>
                  {gmailConnected ? "Reconectar Gmail" : "Conectar Gmail"}
                </Btn>
              </a>
            </div>
          </div>
        </HUDPanel>
      </div>
    </div>
  );
}
