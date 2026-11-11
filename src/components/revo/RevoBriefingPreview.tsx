"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Box, Image as ImageIcon, Minus, Plus, RotateCcw } from "lucide-react";
import { Component, useState, type ReactNode } from "react";
import RevoEraPreview from "./RevoEraPreview";

export type BriefingEra = "industry-1" | "industry-2";
export type CameraAction = "left" | "right" | "zoom-in" | "zoom-out" | "reset";
export type PreviewCameraCommand = { action: CameraAction; id: number };

const PreviewCanvas = dynamic(() => import("./RevoBriefingCanvas"), { ssr: false });
const actions = [
  { action: "left", label: "Putar kamera ke kiri", Icon: ArrowLeft },
  { action: "right", label: "Putar kamera ke kanan", Icon: ArrowRight },
  { action: "zoom-in", label: "Perbesar kamera", Icon: Plus },
  { action: "zoom-out", label: "Perkecil kamera", Icon: Minus },
  { action: "reset", label: "Reset kamera", Icon: RotateCcw },
] as const;

class PreviewBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function RevoBriefingPreview({ era, theme, caption }: { era: BriefingEra; theme: string; caption: string }) {
  const [mode, setMode] = useState<"still" | "loading" | "live" | "unavailable">("still");
  const [command, setCommand] = useState<PreviewCameraCommand>({ action: "reset", id: 0 });
  const active = mode === "live" || mode === "loading";

  function togglePreview() {
    if (active) { setMode("still"); return; }
    try {
      const context = document.createElement("canvas").getContext("webgl2");
      if (!context) { setMode("unavailable"); return; }
      context.getExtension("WEBGL_lose_context")?.loseContext();
      setCommand({ action: "reset", id: 0 });
      setMode("loading");
    } catch { setMode("unavailable"); }
  }

  return <figure className="revo-briefing-preview" aria-label={`Diorama ${theme}`}>
    <p className="revo-briefing-preview-title">{theme}</p>
    <div className="revo-briefing-preview-art" id="revo-briefing-camera-view">
      {mode !== "live" && <RevoEraPreview era={era} sizes="(max-width: 760px) 92vw, 55vw" />}
      {active && <div className="revo-briefing-canvas" aria-hidden="true">
        <PreviewBoundary onFailure={() => setMode("unavailable")}>
          <PreviewCanvas era={era} command={command} onReady={() => setMode("live")} onFailure={() => setMode("unavailable")} />
        </PreviewBoundary>
      </div>}
    </div>
    <div className="revo-briefing-camera" role="group" aria-label="Kontrol kamera pratinjau">
      <button type="button" className="revo-briefing-camera-button"
        aria-label={active ? "Tutup pratinjau 3D" : mode === "unavailable" ? "Coba lagi pratinjau 3D" : "Aktifkan pratinjau 3D"}
        aria-controls="revo-briefing-camera-view" title={active ? "Tutup pratinjau 3D" : "Aktifkan pratinjau 3D"}
        onClick={togglePreview}>
        {active ? <ImageIcon size={18} aria-hidden="true" /> : <Box size={18} aria-hidden="true" />}
        {mode !== "live" && <span>{active ? "Batal memuat 3D" : mode === "unavailable" ? "Coba lagi pratinjau 3D" : "Aktifkan pratinjau 3D"}</span>}
      </button>
      {mode === "live" && actions.map(({ action, label, Icon }) =>
        <button type="button" key={action} className="revo-briefing-camera-button" aria-label={label} title={label}
          aria-controls="revo-briefing-camera-view" onClick={() => setCommand(old => ({ action, id: old.id + 1 }))}><Icon size={18} aria-hidden="true" /></button>)}
    </div>
    <p className="revo-briefing-camera-note" role="status">
      {mode === "unavailable" ? "Pratinjau 3D tidak tersedia. Gambar diorama tetap dapat dilihat."
        : mode === "loading" ? "Memuat diorama 3D…"
        : mode === "live" ? "Geser untuk memutar, cubit untuk zoom, atau gunakan tombol kamera."
        : "Pratinjau hanya menggerakkan kamera."}
    </p>
    <figcaption>{caption}</figcaption>
  </figure>;
}
