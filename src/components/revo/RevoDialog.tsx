"use client";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { X } from "lucide-react";

export default function RevoDialog({ title, children, onClose, wide = false, active = true }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean; active?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, [active]);
  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]")]
      .filter(element => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  }
  return <dialog ref={ref} hidden={!active} className={`revo-dialog ${wide ? "revo-dialog-wide" : ""}`} aria-label={title} onKeyDown={containFocus} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}><button className="revo-dialog-close" onClick={onClose} aria-label="Tutup dialog"><X size={20} /></button>{children}</dialog>;
}
