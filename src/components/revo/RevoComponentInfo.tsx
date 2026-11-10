import type { ReactNode } from "react";

/** Shared information hierarchy; content and progression remain owned by each era. */
export default function RevoComponentInfo({ number, subtitle, name, description, relationship, actions, heading: Heading = "h2" }: {
  heading?: "h2" | "h3"; number: string; subtitle: string; name: string; description: string; relationship: string; actions?: ReactNode;
}) {
  return <>
    <div className="revo-component-info-number" aria-hidden="true">{number}</div>
    <div className="revo-component-identification"><span className="revo-kicker">{subtitle}</span><Heading>{name}</Heading></div>
    <p className="revo-component-description">{description}</p>
    <div className="revo-component-role"><span>PERAN DALAM MESIN</span><p>{relationship}</p></div>
    {actions && <div className="revo-component-actions">{actions}</div>}
  </>;
}
