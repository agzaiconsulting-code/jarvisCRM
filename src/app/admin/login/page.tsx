"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Btn, Field } from "@/components/hud";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("ACCESO DENEGADO · Verifica tus credenciales");
      setLoading(false);
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <main style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="hud-panel" style={{ width: "100%", maxWidth: 380, padding: 32 }}>
        <span className="hud-c tl" />
        <span className="hud-c tr" />
        <span className="hud-c bl" />
        <span className="hud-c br" />
        <div className="logo">JARVIS</div>
        <div className="logo-sub">Prospection System v1</div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Contraseña">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && (
            <p className="metric-note" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <Btn variant="gold" type="submit" disabled={loading}>
            {loading ? "Autenticando…" : "Iniciar sistema"}
          </Btn>
        </form>
      </div>
    </main>
  );
}
