// The URL is the screen's source of truth; session state lives in the layout.
export const REVO_ROUTES = {
  menu: "/revo-lab",
  eraSelect: "/revo-lab/eras",
  briefing: "/revo-lab/industry-1/briefing",
  simulator: "/revo-lab/industry-1",
} as const;

export type RevoScreen = "main-menu" | "era-select" | "level-briefing" | "gameplay";

export function getRevoScreen(pathname: string): RevoScreen | undefined {
  switch (pathname) {
    case REVO_ROUTES.menu: return "main-menu";
    case REVO_ROUTES.eraSelect: return "era-select";
    case REVO_ROUTES.briefing: return "level-briefing";
    case REVO_ROUTES.simulator: return "gameplay";
  }
}
