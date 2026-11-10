import { Check, Circle, CircleDot, X } from "lucide-react";

export type RevoAnswerState = "selected" | "correct" | "incorrect";

export default function RevoAnswerFace({ index, text, state, descriptionId }: {
  index: number; text: string; state?: RevoAnswerState; descriptionId?: string;
}) {
  const Icon = state === "correct" ? Check : state === "incorrect" ? X : state === "selected" ? CircleDot : Circle;
  return <>
    <span className="revo-answer-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
    <span className="revo-answer-copy">{text}<span className="revo-answer-state" id={descriptionId}>
      {state === "correct" ? "Jawabanmu · benar" : state === "incorrect" ? "Jawabanmu · belum tepat" : state === "selected" ? "Dipilih · belum diperiksa" : ""}
    </span></span>
    <span className="revo-answer-marker" aria-hidden="true"><Icon size={20} /></span>
  </>;
}
