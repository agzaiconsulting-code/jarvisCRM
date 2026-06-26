import { Rajdhani, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./crm.css";

const rajdhani = Rajdhani({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crm-display",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-crm-mono",
});

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-crm-body",
});

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`crm-root ${rajdhani.variable} ${plexMono.variable} ${plexSans.variable}`}
      style={{ position: "fixed", inset: 0 }}
    >
      <div className="stage" />
      {children}
    </div>
  );
}
