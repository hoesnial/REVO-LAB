import { Check } from "lucide-react";
import type { ReactNode } from "react";

export default function RevoExplorationComplete({ total, action }: { total: number; action: ReactNode }) {
  const label = `Eksplorasi selesai · ${total}/${total} komponen`;

  return <section className="revo-explore-completion" aria-label={label}>
    <div className="revo-explore-completion-status">
      <span className="revo-explore-completion-icon" aria-hidden="true"><Check size={20} /></span>
      <p role="status" aria-live="polite"><strong>Eksplorasi selesai</strong><span> · {total}/{total} komponen</span></p>
    </div>
    {action}
  </section>;
}
