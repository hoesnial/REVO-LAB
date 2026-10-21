export type ComponentId = "boiler" | "flywheel" | "piston" | "pipe" | "textile";

export type SceneVector = [number, number, number];

export interface FactorySceneProps {
  speed: number;
  heat: number;
  pressure: number;
  running: boolean;
  safety: "safe" | "warning" | "danger";
  selected: ComponentId | null;
  onSelect: (id: ComponentId) => void;
  cameraCommand: { kind: "reset" | "zoom-in" | "zoom-out" | "focus"; serial: number };
  reducedMotion: boolean;
}

export const COMPONENT_POSITIONS: Record<ComponentId, SceneVector> = {
  boiler: [-2.8, 1.2, 0],
  flywheel: [-0.45, 1.2, 1.2],
  piston: [-1.1, 1.2, -0.1],
  pipe: [-2.25, 2.3, -0.65],
  textile: [2.75, 1, 0.1],
};
