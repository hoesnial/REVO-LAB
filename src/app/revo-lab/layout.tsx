import RevoExperience from "@/components/revo/RevoExperience";
import "./industry-1/revo.css";
import "./menu.css";
import "./journey.css";
import "./industry-1/hud.css";
import "./industry-1/assembly.css";
import "./industry-1/filling.css";
import "./industry-1/completion.css";

export default function RevoLayout({ children }: { children: React.ReactNode }) {
  return <RevoExperience>{children}</RevoExperience>;
}
