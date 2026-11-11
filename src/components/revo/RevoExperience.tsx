"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { getRevoScreen } from "@/lib/revo/routes";
import { RevoProgressProvider } from "./RevoProgressProvider";
import { ElectricProgressProvider } from "./industry-2/ElectricProgressProvider";

const RevoLab = dynamic(() => import("./RevoLab"));

const InterfaceMotionContext = createContext<{ reduced: boolean; setReduced: (reduced: boolean) => void }>({ reduced: false, setReduced: () => {} });

export function useRevoInterfaceMotion() {
  return useContext(InterfaceMotionContext);
}

export default function RevoExperience({ children }: { children: React.ReactNode }) {
  return <RevoProgressProvider><ElectricProgressProvider><ExperienceSession>{children}</ExperienceSession></ElectricProgressProvider></RevoProgressProvider>;
}

function ExperienceSession({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const screen = getRevoScreen(pathname);
  const active = screen === "gameplay";
  const [hasEntered, setHasEntered] = useState(active);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (active) setHasEntered(true);
  }, [active]);

  useEffect(() => {
    const root = document.querySelector(".revo-experience");
    if (!root) return;
    const focusCurrentScreen = () => {
      const main = [...root.querySelectorAll<HTMLElement>("main:not([aria-busy='true'])")]
        .find(element => element.getClientRects().length > 0);
      const target = main?.querySelector<HTMLElement>("h1") ?? main;
      if (!target || !target.getClientRects().length) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      observer.disconnect();
    };
    const observer = new MutationObserver(focusCurrentScreen);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy", "hidden"] });
    focusCurrentScreen();
    return () => observer.disconnect();
  }, [pathname]);

  return <InterfaceMotionContext.Provider value={{ reduced, setReduced }}>
    <div className="revo-experience" data-revo-screen={screen} data-reduce-interface-motion={reduced || undefined}>
      {!active && children}
      {/* Retain one lab instance across menu navigation. Its clock, audio and
          WebGL scene pause while hidden, without losing the player's progress. */}
      {(active || hasEntered) && <div className="revo-session" hidden={!active} inert={!active}>
        <RevoLab active={active} />
      </div>}
    </div>
  </InterfaceMotionContext.Provider>;
}
