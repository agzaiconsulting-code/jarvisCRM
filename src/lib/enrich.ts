import * as cheerio from "cheerio";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CONTACT_PATHS = ["/", "/contacto", "/contact", "/aviso-legal", "/contacta", "/contactanos"];
const FETCH_TIMEOUT_MS = 8000;
const BLOCKED_EXT = /\.(png|jpg|jpeg|gif|webp|svg|css|js)$/i;

async function fetchWithTimeout(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JarvisCRM/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function isPathAllowed(origin: string, path: string): Promise<boolean> {
  const robots = await fetchWithTimeout(`${origin}/robots.txt`);
  if (!robots) return true;
  let applies = false;
  for (const raw of robots.split("\n")) {
    const line = raw.trim().toLowerCase();
    if (line.startsWith("user-agent:")) {
      applies = line.slice("user-agent:".length).trim() === "*";
    } else if (applies && line.startsWith("disallow:")) {
      const rule = line.slice("disallow:".length).trim();
      if (rule && path.startsWith(rule)) return false;
    }
  }
  return true;
}

function extractEmails(html: string): string[] {
  const $ = cheerio.load(html);
  const found = new Set<string>();
  $('a[href^="mailto:"]').each((_, el) => {
    const m = ($(el).attr("href") ?? "").replace(/^mailto:/i, "").split("?")[0].trim();
    if (m) found.add(m.toLowerCase());
  });
  const text = $("body").text();
  for (const m of text.match(EMAIL_RE) ?? []) {
    if (!BLOCKED_EXT.test(m)) found.add(m.toLowerCase());
  }
  return [...found];
}

/** Rastrea la web del negocio (home + páginas de contacto) y devuelve el mejor email.
    Prioriza emails del propio dominio del negocio (PRD §6.2). */
export async function findEmailOnWebsite(website: string): Promise<string | null> {
  let origin: string;
  let domain: string;
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    origin = url.origin;
    domain = url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  const all = new Set<string>();
  for (const path of CONTACT_PATHS) {
    if (!(await isPathAllowed(origin, path))) continue;
    const html = await fetchWithTimeout(`${origin}${path === "/" ? "" : path}`);
    if (!html) continue;
    for (const e of extractEmails(html)) all.add(e);
    const sameDomain = [...all].find((e) => e.endsWith(`@${domain}`) || e.split("@")[1]?.endsWith(`.${domain}`));
    if (sameDomain) return sameDomain;
  }

  if (all.size === 0) return null;
  const sameDomain = [...all].find((e) => e.endsWith(`@${domain}`));
  return sameDomain ?? [...all][0];
}

/** Ejecuta tareas con concurrencia limitada. */
export async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
