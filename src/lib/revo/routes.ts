import type { ElectricStage } from "./industry-2/progress";

// The URL is the screen's source of truth; session state lives in the layout.
export const REVO_ROUTES = {
  menu: "/revo-lab",
  eraSelect: "/revo-lab/eras",
  briefing: "/revo-lab/industry-1/briefing",
  simulator: "/revo-lab/industry-1",
  electricBriefing: "/revo-lab/industry-2/briefing",
  electricExplore: "/revo-lab/industry-2",
  electricAssembly: "/revo-lab/industry-2/assembly",
  electricExperiment: "/revo-lab/industry-2/experiment",
} as const;

export function electricResumeRoute(stage: ElectricStage) {
  if (stage === "experiment") return REVO_ROUTES.electricExperiment;
  if (stage === "assembly") return REVO_ROUTES.electricAssembly;
  return stage === "explore" ? REVO_ROUTES.electricExplore : REVO_ROUTES.electricBriefing;
}

// The indicators are shared; each era still owns prerequisites and evidence.
export const LEARNING_STAGES = [
  { id: "explore", number: "01", label: "Eksplorasi" },
  { id: "assembly", number: "02", label: "Perakitan" },
  { id: "experiment", number: "03", label: "Eksperimen" },
  { id: "reflection", number: "04", label: "Refleksi" },
] as const;

export type RevoScreen = "main-menu" | "era-select" | "level-briefing" | "gameplay" | "electric-briefing" | "electric-explore" | "electric-assembly" | "electric-experiment";

export function getRevoScreen(pathname: string): RevoScreen | undefined {
  switch (pathname) {
    case REVO_ROUTES.menu: return "main-menu";
    case REVO_ROUTES.eraSelect: return "era-select";
    case REVO_ROUTES.briefing: return "level-briefing";
    case REVO_ROUTES.simulator: return "gameplay";
    case REVO_ROUTES.electricBriefing: return "electric-briefing";
    case REVO_ROUTES.electricExplore: return "electric-explore";
    case REVO_ROUTES.electricAssembly: return "electric-assembly";
    case REVO_ROUTES.electricExperiment: return "electric-experiment";
  }
}
