import RevoExperience from "@/components/revo/RevoExperience";
import "./industry-1/revo.css";
import "./menu.css";
import "./journey.css";
import "./industry-1/hud.css";

export default function RevoLayout({ children }: { children: React.ReactNode }) {
  return <RevoExperience>{children}</RevoExperience>;
}
