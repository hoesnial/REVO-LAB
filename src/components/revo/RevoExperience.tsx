"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getRevoScreen } from "@/lib/revo/routes";

const RevoLab = dynamic(() => import("./RevoLab"));

export default function RevoExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const screen = getRevoScreen(pathname);
  const active = screen === "gameplay";
  const [hasEntered, setHasEntered] = useState(active);

  useEffect(() => {
    if (active) setHasEntered(true);
  }, [active]);

  return <div className="revo-experience" data-revo-screen={screen}>
    {!active && children}
    {/* Retain one lab instance across menu navigation. Its clock, audio and
        WebGL scene pause while hidden, without losing the player's progress. */}
    {(active || hasEntered) && <div className="revo-session" hidden={!active} inert={!active}>
      <RevoLab active={active} />
    </div>}
  </div>;
}
