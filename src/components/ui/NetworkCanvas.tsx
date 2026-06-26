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
    const COLORS = { navy: "10,28,102", em: "57,211,156", cy: "59,207,224" };
    type Node = { x: number; y: number; vx: number; vy: number; r: number; c: string; accent: boolean };
    let nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999 };
    let raf: number;

    const build = () => {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.min(90, Math.round((w * h) / 16000 * (density / 64))));
      nodes = [];
      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const c = t > 0.86 ? COLORS.em : t > 0.74 ? COLORS.cy : COLORS.navy;
        const accent = c !== COLORS.navy;
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
          r: accent ? 2.6 + Math.random() * 1.6 : 1.4 + Math.random() * 1.2,
          c, accent,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const LINK = 150;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          const dxm = a.x - mouse.x, dym = a.y - mouse.y;
          const dm = Math.hypot(dxm, dym);
          if (dm < 130 && dm > 0.1) {
            a.x += (dxm / dm) * (1 - dm / 130) * 1.6;
            a.y += (dym / dm) * (1 - dm / 130) * 1.6;
          }
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(${COLORS.navy},${(1 - dist / LINK) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        if (n.accent) { ctx.shadowColor = `rgba(${n.c},.9)`; ctx.shadowBlur = 12; ctx.fillStyle = `rgba(${n.c},1)`; }
        else { ctx.shadowBlur = 0; ctx.fillStyle = `rgba(${n.c},.55)`; }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    build(); draw();

    const onResize = () => build();
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
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
