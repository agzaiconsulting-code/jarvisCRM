"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/hud";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/scan", label: "Buscar leads", icon: "scan" },
  { href: "/admin/leads", label: "Leads", icon: "leads" },
  { href: "/admin/campaigns", label: "Campañas", icon: "campaigns" },
  { href: "/admin/settings", label: "Ajustes", icon: "settings" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="logo">AGZAI</div>
      <div className="logo-sub">CRM · Prospección</div>
      <nav className="nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="reactor-status">
          <span className="reactor-dot" />
          <span className="reactor-label">SYSTEM ONLINE</span>
        </div>
        <button
          onClick={handleLogout}
          className="reactor-status"
          style={{ marginTop: 12, background: "none", border: 0, cursor: "pointer", width: "100%" }}
        >
          ⏻ <span className="reactor-label">CERRAR SESIÓN</span>
        </button>
      </div>
    </aside>
  );
}
