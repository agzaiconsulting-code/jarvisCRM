"use client";

import { useEffect, useRef } from "react";

export default function NetworkCanvas({ density = 64 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const NAVY = "10,28,102";
    const EM   = "57,211,156";
    const CY   = "59,207,224";

    type Node = { x: number; y: number; vx: number; vy: number; r: number; c: string; accent: boolean };
    let nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999 };
    let raf: number;

    const build = () => {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(30, Math.min(110, Math.round((w * h) / 13000 * (density / 64))));
      nodes = [];
      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const c = t > 0.82 ? EM : t > 0.68 ? CY : NAVY;
        const accent = c !== NAVY;
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
          r: accent ? 3.2 + Math.random() * 2.2 : 1.8 + Math.random() * 1.4,
          c, accent,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (!reduce) {
        const REPULSE_R = 210;
        const REPULSE_F = 5.8;
        for (const a of nodes) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          const dxm = a.x - mouse.x, dym = a.y - mouse.y;
          const dm = Math.hypot(dxm, dym);
          if (dm < REPULSE_R && dm > 0.5) {
            const force = (1 - dm / REPULSE_R) * REPULSE_F;
            a.x += (dxm / dm) * force;
            a.y += (dym / dm) * force;
          }
        }
      }

      // node–node connections
      const LINK = 165;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(${NAVY},${(1 - dist / LINK) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      // cursor halo + attraction lines
      if (mouse.x > -100 && !reduce) {
        // radial glow at cursor
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
        grad.addColorStop(0, `rgba(${EM},0.14)`);
        grad.addColorStop(1, `rgba(${EM},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2); ctx.fill();

        // lines to 5 nearest nodes
        const near = nodes
          .map(n => ({ n, d: Math.hypot(n.x - mouse.x, n.y - mouse.y) }))
          .filter(({ d }) => d < 300)
          .sort((a, b) => a.d - b.d)
          .slice(0, 5);
        for (const { n, d } of near) {
          ctx.strokeStyle = `rgba(${EM},${(1 - d / 300) * 0.32})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      }

      // draw nodes
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        if (n.accent) {
          ctx.shadowColor = `rgba(${n.c},.85)`; ctx.shadowBlur = 14;
          ctx.fillStyle = `rgba(${n.c},1)`;
        } else {
          ctx.shadowBlur = 0; ctx.fillStyle = `rgba(${n.c},.48)`;
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    build(); draw();

    const onResize  = () => build();
    const onMove    = (e: MouseEvent)  => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave   = () => { mouse.x = -9999; mouse.y = -9999; };
    const onTouch   = (e: TouchEvent)  => { if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; } };
    const onTouchEnd = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener("resize",     onResize);
    window.addEventListener("mousemove",  onMove,     { passive: true });
    window.addEventListener("mouseout",   onLeave,    { passive: true });
    window.addEventListener("touchmove",  onTouch,    { passive: true });
    window.addEventListener("touchend",   onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",    onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout",  onLeave);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend",  onTouchEnd);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
