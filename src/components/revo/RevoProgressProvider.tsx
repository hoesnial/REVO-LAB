"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hasSavedProgress, readRevoProgress, writeRevoProgress, type RevoProgress, type StorageStatus } from "@/lib/revo/progress";

interface RevoProgressContextValue {
  hydrated: boolean;
  progress: RevoProgress | null;
  storageStatus: StorageStatus;
  save: (progress: RevoProgress | null) => void;
}

const RevoProgressContext = createContext<RevoProgressContextValue | null>(null);

export function RevoProgressProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<RevoProgress | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>("available");

  useEffect(() => {
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* Storage can be disabled by the browser. */ }
    const result = readRevoProgress(storage);
    setProgress(result.progress);
    setStorageStatus(result.status);
    setHydrated(true);
  }, []);

  const save = useCallback((next: RevoProgress | null) => {
    const useful = next && hasSavedProgress(next) ? next : null;
    setProgress(useful);
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* The live session still works without storage. */ }
    setStorageStatus(writeRevoProgress(storage, useful) ? "available" : "unavailable");
  }, []);

  const value = useMemo(() => ({ hydrated, progress, storageStatus, save }), [hydrated, progress, storageStatus, save]);
  return <RevoProgressContext.Provider value={value}>{children}</RevoProgressContext.Provider>;
}

export function useRevoProgress() {
  const context = useContext(RevoProgressContext);
  if (!context) throw new Error("useRevoProgress must be used inside RevoProgressProvider.");
  return context;
}
