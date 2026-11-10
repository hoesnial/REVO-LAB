import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Cog } from "lucide-react";
import { REVO_ROUTES } from "@/lib/revo/routes";

export default function RevoScreenHeader({ step, back, actions, gameplay = false, title }: {
  step: string; back?: { href: string; label: string }; actions?: ReactNode; gameplay?: boolean; title?: ReactNode;
}) {
  return <header className={gameplay ? "revo-flow-header revo-game-header" : "revo-flow-header"}>
    <Link href={REVO_ROUTES.menu} className="revo-menu-brand" aria-label="REVO — Menu utama"><span><Cog size={23} strokeWidth={2.2} /></span><strong>REVO<sup>®</sup></strong></Link>
    {title ? <div className="revo-hud-title"><span className="revo-flow-step">{step}</span>{title}</div> : <span className="revo-flow-step">{step}</span>}
    {(back || actions) && <nav aria-label="Navigasi layar REVO">{back && <Link className="revo-flow-back" href={back.href} aria-label={back.label} title={back.label}><ArrowLeft size={15} aria-hidden="true" /><span>{back.label}</span></Link>}{actions}</nav>}
  </header>;
}
