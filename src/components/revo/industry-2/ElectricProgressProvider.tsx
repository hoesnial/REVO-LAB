"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { electricReducer, initialElectricProgress, readElectricProgress, saveElectricProgress, type ElectricAction, type ElectricProgress, type ElectricStorageStatus } from "@/lib/revo/industry-2/progress";

const ElectricContext = createContext<{ progress: ElectricProgress | null; status: ElectricStorageStatus; dispatch: (action: ElectricAction) => void } | null>(null);

export function ElectricProgressProvider({ children }: { children: ReactNode }) {
  const current = useRef<ElectricProgress | null>(null);
  const [progress, setProgress] = useState<ElectricProgress | null>(null);
  const [status, setStatus] = useState<ElectricStorageStatus>("available");

  useEffect(() => {
    let restored: ReturnType<typeof readElectricProgress>;
    try {
      const storage = window.localStorage;
      restored = readElectricProgress(storage);
      if (restored.migrate) {
        try { saveElectricProgress(storage, restored.progress); }
        catch { restored.status = "unavailable"; }
      }
    }
    catch { restored = { progress: initialElectricProgress(), status: "unavailable" }; }
    current.current = restored.progress;
    setProgress(restored.progress);
    setStatus(restored.status);
  }, []);

  const dispatch = useCallback((action: ElectricAction) => {
    if (!current.current) return;
    const next = electricReducer(current.current, action);
    if (next === current.current) return;
    current.current = next;
    setProgress(next);
    // Write before navigating; storage failure does not interrupt the current session.
    try {
      saveElectricProgress(window.localStorage, next);
      setStatus("available");
    } catch { setStatus("unavailable"); }
  }, []);

  return <ElectricContext.Provider value={{ progress, status, dispatch }}>{children}</ElectricContext.Provider>;
}

export function useElectricProgress() {
  const context = useContext(ElectricContext);
  if (!context) throw new Error("Industry 2.0 requires ElectricProgressProvider.");
  return context;
}
