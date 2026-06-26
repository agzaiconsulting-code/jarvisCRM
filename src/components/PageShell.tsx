"use client";

import { ScreenHead, HUDPanel, EmptyState } from "@/components/hud";

export default function PageShell({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <ScreenHead title={title} sub={code} />
      {children ?? (
        <HUDPanel>
          <EmptyState
            title="Módulo pendiente"
            sub="Esta sección se construirá en una fase posterior."
          />
        </HUDPanel>
      )}
    </div>
  );
}
