import type { Metadata } from "next";
import { Cormorant_Garamond, Hanken_Grotesk, Space_Grotesk } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AGZAI · Webs, Agentes IA y Apps para Pymes",
  description:
    "Automatizaciones, bots, webs y CRMs a medida, desarrollados con IA para entregarte más, en menos tiempo y mejor.",
  keywords: [
    "consultor IA",
    "agente WhatsApp",
    "web a medida",
    "automatización",
    "CRM a medida",
    "pymes España",
  ],
  authors: [{ name: "Adrián Gómez De Juan" }],
  openGraph: {
    title: "AGZAI · Construyo tu producto con IA",
    description:
      "Automatizaciones, bots, webs y CRMs a medida desarrollados con IA.",
    url: "https://agzai.com",
    siteName: "AGZAI",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGZAI · Construyo tu producto con IA",
    description:
      "Automatizaciones, bots, webs y CRMs a medida desarrollados con IA.",
  },
  robots: { index: true, follow: true },
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "AGZAI",
  provider: { "@type": "Person", name: "Adrián Gómez De Juan" },
  description:
    "Consultor freelance de IA especializado en automatizaciones, bots, webs y CRMs a medida.",
  url: "https://agzai.com",
  areaServed: ["ES", "LATAM", "EU"],
  serviceType: ["Automatizaciones", "Bots IA", "Landing Pages", "Webs de reservas", "CRMs a medida"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${hanken.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
