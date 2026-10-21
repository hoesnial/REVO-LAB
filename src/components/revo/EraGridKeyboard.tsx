"use client";

import type { KeyboardEvent, ReactNode } from "react";

export default function EraGridKeyboard({ children }: { children: ReactNode }) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget || event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const grid = event.currentTarget;
    grid.scrollTo({ top: event.key === "Home" ? 0 : grid.scrollHeight, behavior: "instant" });
  }

  return <section className="revo-era-grid revo-flow-entrance" aria-label="Empat era revolusi industri" tabIndex={0} onKeyDown={handleKeyDown}>
    {children}
  </section>;
}
