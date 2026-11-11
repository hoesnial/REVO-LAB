import RevoExperience from "@/components/revo/RevoExperience";
import "./industry-1/revo.css";
import "./menu.css";
import "./journey.css";
import "./industry-1/hud.css";
import "./industry-1/assembly.css";
import "./industry-1/filling.css";
import "./industry-1/completion.css";
import "./readability.css";
import "./ui-refinements.css";
import "./cross-era.css";
import "./design-system.css";
import "./briefing.css";
import "./exploration.css";

export default function RevoLayout({ children }: { children: React.ReactNode }) {
  return <RevoExperience>{children}</RevoExperience>;
}
