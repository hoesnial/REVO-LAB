import { Check } from "lucide-react";

export default function RevoStageBadge({ number, done }: { number: string; done: boolean }) {
  return <span className="revo-stage-number" aria-hidden="true">{done ? <Check size={13} /> : number}</span>;
}
