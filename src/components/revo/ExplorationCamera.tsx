"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { OrbitControls as Orbit } from "three-stdlib";
import { OrthographicCamera, Vector3 } from "three";

/** Camera only: resize preserves orbit direction and relative overview zoom. */
export default function ExplorationCamera({ command, compactZoom = 1 }: { command: { kind: string; serial: number }; compactZoom?: number }) {
  const { camera, size, invalidate } = useThree();
  const controls = useRef<Orbit>(null);
  const seen = useRef(-1);
  const scale = useRef(.94);
  const initial = useRef(false);
  const lastFit = useRef(0);
  const lastZoom = useRef(0);
  useFrame(() => {
    if (!controls.current) return;
    const view = camera as OrthographicCamera;
    const target = controls.current.target;
    if (lastFit.current && Math.abs(view.zoom - lastZoom.current) > .01) scale.current = Math.max(.6, Math.min(1, view.zoom / lastFit.current));
    if (!initial.current || seen.current !== command.serial) {
      initial.current = true;
      seen.current = command.serial;
      if (command.kind === "reset") {
        target.set(0, 2, 0);
        view.position.copy(target).add(new Vector3(11, 9, 14));
        view.lookAt(target);
        controls.current.update();
        scale.current = .94;
      } else if (command.kind === "zoom-in") scale.current = Math.min(1, scale.current * 1.14);
      else if (command.kind === "zoom-out") scale.current = Math.max(.6, scale.current / 1.14);
    }
    // Conservative bounds contain both factories, chimney, floor and markers.
    const right = new Vector3(1, 0, 0).applyQuaternion(view.quaternion);
    const up = new Vector3(0, 1, 0).applyQuaternion(view.quaternion);
    const span = (v: Vector3) => Math.abs(v.x) * 6 + Math.abs(v.y) * 2.8 + Math.abs(v.z) * 3.65;
    const fit = Math.min(size.width / (2 * span(right)), size.height / (2 * span(up))) * .92;
    const cameraFit = fit * (size.width <= 360 ? compactZoom : 1);
    const wanted = cameraFit * scale.current;
    controls.current.minZoom = cameraFit * .6; controls.current.maxZoom = cameraFit;
    lastFit.current = cameraFit; lastZoom.current = wanted;
    if (Math.abs(view.zoom - wanted) > .01) {
      view.zoom = wanted;
      view.updateProjectionMatrix();
      invalidate();
    }
  });
  return <OrbitControls ref={controls} target={[0, 2, 0]} enablePan={false} enableZoom
    enableDamping={false} minPolarAngle={.65} maxPolarAngle={1.28} onChange={() => invalidate()} />;
}
