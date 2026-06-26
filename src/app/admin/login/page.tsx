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
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <main style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "var(--crm-bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <a
            href="/"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 600,
              fontSize: 40,
              letterSpacing: "0.14em",
              color: "var(--crm-navy)",
              lineHeight: 1,
              marginBottom: 8,
              display: "block",
              textDecoration: "none",
            }}
          >
            AGZAI
          </a>
          <p style={{
            fontFamily: "var(--font-space)",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--crm-muted)",
            textTransform: "uppercase",
            margin: 0,
          }}>
            CRM · Área privada
          </p>
        </div>

        {/* Card */}
        <div className="hud-panel" style={{ padding: "32px 28px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                required
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && (
              <p style={{
                fontFamily: "var(--font-hanken)",
                fontSize: 13,
                color: "var(--crm-danger)",
                margin: 0,
              }}>
                {error}
              </p>
            )}
            <Btn variant="gold" type="submit" disabled={loading}>
              {loading ? "Autenticando…" : "Acceder"}
            </Btn>
          </form>
        </div>

        {/* Back link */}
        <a
          href="/"
          style={{
            textAlign: "center",
            fontFamily: "var(--font-hanken)",
            fontSize: 13,
            color: "var(--crm-muted)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--crm-navy)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--crm-muted)")}
        >
          ← Volver a la web
        </a>
      </div>
    </main>
  );
}
