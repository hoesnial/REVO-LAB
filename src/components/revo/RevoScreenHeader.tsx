import Link from "next/link";
import { ArrowLeft, Cog } from "lucide-react";
import { REVO_ROUTES } from "@/lib/revo/routes";

export default function RevoScreenHeader({ step, back }: { step: string; back?: { href: string; label: string } }) {
  return <header className="revo-flow-header">
    <Link href={REVO_ROUTES.menu} className="revo-menu-brand" aria-label="REVO — Menu utama"><span><Cog size={23} strokeWidth={2.2} /></span><strong>REVO<sup>®</sup></strong></Link>
    <span className="revo-flow-step">{step}</span>
    {back && <nav aria-label="Navigasi pilih era"><Link className="revo-flow-back" href={back.href}><ArrowLeft size={15} />{back.label}</Link></nav>}
  </header>;
}
