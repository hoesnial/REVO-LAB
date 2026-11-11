import { Focus, Minus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { ElectricPartId } from "@/lib/revo/industry-2/content";

export default function ElectricCameraControls({ focus, onFocus, onReset, onZoom }: {
  onZoom?: (kind: "zoom-in" | "zoom-out") => void; focus: ElectricPartId | null; onFocus: (value: ElectricPartId | null) => void; onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  return <div className="electric-camera-controls">
    {onZoom && <><button className="electric-secondary" aria-label="Perkecil tampilan" onClick={() => onZoom("zoom-out")}><Minus size={17} /></button><button className="electric-secondary" aria-label="Perbesar tampilan" onClick={() => onZoom("zoom-in")}><Plus size={17} /></button></>}
    {!onZoom && <button className="electric-secondary" aria-label="Pilih sudut pandang" title="Pilih sudut pandang" aria-expanded={open} onClick={() => setOpen(value=>!value)}><Focus size={17} aria-hidden="true" /></button>}
    {open && <label className="electric-camera-popover"><span>Sudut pandang</span><select autoFocus aria-label="Sudut pandang" value={focus ?? "overview"}
      onKeyDown={event=>{if(event.key === "Escape"){setOpen(false);event.currentTarget.closest(".electric-camera-controls")?.querySelector<HTMLButtonElement>("button")?.focus();}}}
      onChange={event => onFocus(event.target.value === "overview" ? null : event.target.value as ElectricPartId)}>
      <option value="overview">Seluruh pabrik</option><option value="motor">Motor listrik</option>
      <option value="shaft">Poros dan transmisi</option><option value="conveyor">Konveyor</option><option value="stations">Stasiun kerja</option>
    </select></label>}
    <button className="electric-secondary electric-camera-reset" aria-label="Atur ulang kamera" title="Atur ulang kamera" onClick={onReset}><RotateCcw size={17} aria-hidden="true" /></button>
  </div>;
}
