# AGZAI — Landing Page

Landing corporativa de AGZAI.com. Next.js 16, Tailwind v4, Framer Motion.

## Requisitos

- Node.js 18+
- npm 9+

## Desarrollo local

```bash
npm install
npm run dev
# http://localhost:3000
```

## Build de producción

```bash
npm run build
npm run start
```

## Deploy en Vercel

1. Push el repo a GitHub/GitLab
2. En Vercel: "Add New Project" → importa el repo
3. Framework: Next.js (detectado automáticamente)
4. Sin variables de entorno necesarias actualmente
5. Deploy

## Estructura

```
src/
  app/
    layout.tsx        # Fuentes, metadata SEO, JSON-LD Schema.org
    page.tsx          # Ensamblaje de secciones
    globals.css       # Tailwind v4 @theme tokens (paleta + fuentes)
  components/
    ui/
      Logo.tsx        # SVG logo AGZAI con nodo de red
    sections/
      Nav.tsx         # Navegación fija con blur
      Hero.tsx        # Hero asimétrico con animaciones
      Services.tsx    # Grid bento de servicios
      Process.tsx     # Timeline de 4 pasos
      Cases.tsx       # Casos de éxito (Casa Cervantes, Padel Club)
      About.tsx       # Bio + stack técnico
      FAQ.tsx         # Acordeón animado
      CTAFinal.tsx    # Sección oscura de contacto
      Footer.tsx      # Pie de página
```

## Actualizar el copy

Todo el copy está inline en cada componente de sección. Edita directamente el archivo correspondiente en `src/components/sections/`.

## TODOs antes de publicar

Busca `// TODO: AGZAI` para encontrar todos los placeholders:

```bash
grep -r "TODO: AGZAI" src/
```

Pendientes:
- `CTAFinal.tsx` — URL real de Cal.com
- `CTAFinal.tsx` — Número de WhatsApp real
- `Footer.tsx` — Email de contacto real
- `About.tsx` — Foto de perfil real

## Fuentes

Cargadas con `next/font/google`:
- **Fraunces** — titulares (serif editorial)
- **Geist** — cuerpo (sans geométrica)
- **JetBrains Mono** — detalles técnicos y etiquetas

## Paleta

| Variable CSS | Hex | Uso |
|---|---|---|
| `--color-navy` | `#0A1F44` | Base corporativa |
| `--color-emerald` | `#10B981` | Acento primario, CTAs |
| `--color-cyan-accent` | `#22D3EE` | Hover, acento secundario |
| `--color-cream` | `#F7F5F0` | Fondo principal |
| `--color-beige` | `#EEE9DD` | Fondo de secciones alternativas |
