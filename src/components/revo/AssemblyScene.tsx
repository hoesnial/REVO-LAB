"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ASSEMBLY_PARTS, ASSEMBLY_SOCKETS, assemblyComplete, socketAtPoint, type AssemblyAction, type AssemblyState } from "@/lib/revo/assembly";
import type { ComponentId, SceneVector } from "./scene-types";
import { Block, Pipe, Ring } from "./ScenePrimitives";
import { TRANSMISSION } from "@/lib/revo/mechanics";

export interface AssemblySceneProps {
  state: AssemblyState;
  enabled: boolean;
  onAction: (action: AssemblyAction) => void;
}
type AssemblyMotion = {
  from: THREE.Vector3;
  target: THREE.Vector3;
  elapsed: number;
  duration: number;
  startScale: number;
  targetScale: number;
  active: boolean;
};
export const PART_ANCHORS: Record<ComponentId, SceneVector> = {
  boiler: [-2.85, 0, -0.3], pipe: [-2.3, 1.1, 0], piston: [-2.5, 0, 1.74], flywheel: [-0.43, 0, 0.71], textile: [2.55, 0.09, 0.05],
};
export function trayPosition(id: ComponentId): SceneVector {
  return [-4 + ASSEMBLY_PARTS.findIndex(part => part.id === id) * 2, 0.16, 4.2];
}
export type AssemblyMarkers = RefObject<Record<string, HTMLElement | null>>;

export function AssemblyProjector({ elements, state }: { elements: AssemblyMarkers; state: AssemblyState }) {
  const point = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    for (const part of ASSEMBLY_PARTS) {
      for (const kind of ["socket", "tray"] as const) {
        const element = elements.current[`${kind}-${part.id}`];
        if (!element) continue;
        const position = kind === "socket" ? ASSEMBLY_SOCKETS[part.id] : trayPosition(part.id);
        point.current.set(...position);
        // Tray labels double as a reliable projected anchor for pointer testing.
        if (kind === "tray") point.current.y += 0.65;
        point.current.project(camera);
        element.style.transform = `translate3d(${(point.current.x + 1) * size.width / 2}px, ${(1 - point.current.y) * size.height / 2}px, 0) translate(-50%, -50%)`;
        element.style.visibility = kind === "tray" && state.placed.includes(part.id) ? "hidden" : "visible";
      }
    }
  });
  return null;
}

type DragSession = { pointer: number; target: Element; x: number; z: number; moved: boolean; clientX: number; clientY: number };

/** Each original model is mounted once. The outer group provides isolated
 * assembly transforms; the model's authored coordinates and motion are intact. */
export function AssemblyPiece({ id, assembly, onDragging, onCandidate, reducedMotion, children }: {
  id: ComponentId; assembly: AssemblySceneProps; onDragging: (dragging: boolean) => void; onCandidate: (id: ComponentId | null) => void; reducedMotion: boolean; children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const drag = useRef<DragSession | null>(null);
  const motion = useRef<AssemblyMotion>({ from: new THREE.Vector3(), target: new THREE.Vector3(), elapsed: 0, duration: 0.28, startScale: 0.36, targetScale: 1, active: false });
  const previousInstalled = useRef(assembly.state.placed.includes(id));
  const [installFlash, setInstallFlash] = useState(false);
  const { gl } = useThree();
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.16));
  const intersection = useRef(new THREE.Vector3());
  const installed = assembly.state.placed.includes(id);
  const selected = assembly.state.selected === id;
  const complete = assemblyComplete(assembly.state);
  const anchor = PART_ANCHORS[id];
  const origin = installed ? anchor : trayPosition(id);
  const [initialOrigin] = useState<SceneVector>(() => installed ? [...anchor] : [...trayPosition(id)]);
  const [initialScale] = useState(() => installed ? 1 : 0.36);

  const animateTo = useCallback((target: SceneVector, duration: number, targetScale: number) => {
    if (!group.current) return;
    motion.current.from.copy(group.current.position);
    motion.current.target.set(...target);
    motion.current.elapsed = 0;
    motion.current.duration = duration;
    motion.current.startScale = group.current.scale.x;
    motion.current.targetScale = targetScale;
    motion.current.active = duration > 0 && !reducedMotion;
    if (!motion.current.active) {
      group.current.position.copy(motion.current.target);
      group.current.scale.setScalar(targetScale);
    }
  }, [reducedMotion]);

  useEffect(() => {
    const changed = previousInstalled.current !== installed;
    if (installed && changed) {
      animateTo(anchor, 0.3, 1);
      setInstallFlash(true);
    } else if (!installed && changed) {
      motion.current.active = false;
      if (group.current) { group.current.position.set(...trayPosition(id)); group.current.scale.setScalar(0.36); }
      setInstallFlash(false);
    } else if (reducedMotion && motion.current.active) {
      animateTo(installed ? anchor : trayPosition(id), 0, installed ? 1 : 0.36);
    }
    previousInstalled.current = installed;
  }, [animateTo, installed, reducedMotion, id, anchor]);

  useEffect(() => {
    if (!installFlash) return;
    const timer = window.setTimeout(() => setInstallFlash(false), 520);
    return () => window.clearTimeout(timer);
  }, [installFlash]);

  useFrame((_, delta) => {
    if (!motion.current.active || !group.current || drag.current) return;
    const current = motion.current;
    current.elapsed = Math.min(current.duration, current.elapsed + Math.min(delta, 0.05));
    const progress = current.duration === 0 ? 1 : current.elapsed / current.duration;
    const eased = progress * progress * (3 - 2 * progress);
    group.current.position.lerpVectors(current.from, current.target, eased);
    group.current.scale.setScalar(THREE.MathUtils.lerp(current.startScale, current.targetScale, eased));
    if (progress >= 1) current.active = false;
  });

  function release() {
    const session = drag.current;
    drag.current = null;
    if (session) {
      if (session.target.hasPointerCapture(session.pointer)) session.target.releasePointerCapture(session.pointer);
      onDragging(false); onCandidate(null);
    }
    gl.domElement.style.cursor = "auto";
  }
  // Cancel rather than commit a drag interrupted by pause, dialog, stage change,
  // lost capture or menu navigation. No render/frame callback awards progress.
  useEffect(() => {
    if (assembly.enabled || !drag.current) return;
    const session = drag.current;
    drag.current = null;
    if (session.target.hasPointerCapture(session.pointer)) session.target.releasePointerCapture(session.pointer);
    if (group.current) group.current.position.set(...trayPosition(id));
    onDragging(false); onCandidate(null); gl.domElement.style.cursor = "auto";
  }, [assembly.enabled, gl, id, onDragging, onCandidate]);
  useEffect(() => () => {
    const session = drag.current;
    if (session?.target.hasPointerCapture(session.pointer)) session.target.releasePointerCapture(session.pointer);
    gl.domElement.style.cursor = "auto";
  }, [gl]);
  useEffect(() => {
    group.current?.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        if (!material.userData.assemblyEmissive) {
          material.userData.assemblyEmissive = material.emissive.clone();
          material.userData.assemblyIntensity = material.emissiveIntensity;
        }
        if (selected || complete || installFlash) { material.emissive.set(complete ? "#e0c849" : "#d5b649"); material.emissiveIntensity = complete ? 0.1 : installFlash ? 0.2 : 0.13; }
        else { material.emissive.copy(material.userData.assemblyEmissive); material.emissiveIntensity = material.userData.assemblyIntensity; }
      }
    });
  }, [selected, complete, installFlash]);
  return <group ref={group} position={initialOrigin} scale={initialScale}
    onPointerDown={(event) => {
      if (!assembly.enabled || installed || event.button !== 0) return;
      event.stopPropagation();
      const captureTarget = event.target as Element;
      captureTarget.setPointerCapture(event.pointerId);
      drag.current = { pointer: event.pointerId, target: captureTarget, x: origin[0], z: origin[2], moved: false, clientX: event.clientX, clientY: event.clientY };
      // Disable controls synchronously, before their native pointer handler runs.
      onDragging(true);
      assembly.onAction({ type: "select", id });
      gl.domElement.style.cursor = "grabbing";
    }}
    onPointerMove={(event) => {
      const session = drag.current;
      if (!session || session.pointer !== event.pointerId || !assembly.enabled) return;
      event.stopPropagation();
      if (Math.hypot(event.clientX - session.clientX, event.clientY - session.clientY) < 4 && !session.moved) return;
      session.moved = true;
      if (!event.ray.intersectPlane(plane.current, intersection.current)) return;
      session.x = THREE.MathUtils.clamp(intersection.current.x, -5.1, 5.1);
      session.z = THREE.MathUtils.clamp(intersection.current.z, -2, 4.8);
      group.current?.position.set(session.x, 0.28, session.z);
      onCandidate(socketAtPoint(session.x, session.z));
    }}
    onPointerUp={(event) => {
      const session = drag.current;
      if (!session || session.pointer !== event.pointerId) return;
      event.stopPropagation();
      if (session.moved) {
        const socket = socketAtPoint(session.x, session.z);
        if (assembly.enabled) assembly.onAction({ type: "place", id, socket });
        if (!assembly.enabled || socket !== id) animateTo(trayPosition(id), 0.2, 0.36);
      } else group.current?.position.set(...origin);
      release();
    }}
    onPointerCancel={() => { animateTo(trayPosition(id), 0.2, 0.36); release(); }}
    onLostPointerCapture={() => { if (drag.current) { animateTo(trayPosition(id), 0.2, 0.36); release(); } }}
    onClick={event => event.stopPropagation()}>
    <group position={[-anchor[0], -anchor[1], -anchor[2]]}>{children}</group>
    {!installed && <mesh position={[0, 1.2, 0]}><boxGeometry args={[3.1, 3.3, 3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
  </group>;
}

export function AssemblySockets({ assembly, candidate }: { assembly: AssemblySceneProps; candidate: ComponentId | null }) {
  const ghost = assembly.state.selected;
  return <group>{ghost && !assembly.state.placed.includes(ghost) && <AssemblyGhost id={ghost} />}{ASSEMBLY_PARTS.map(part => {
    const installed = assembly.state.placed.includes(part.id);
    const highlighted = candidate === part.id || assembly.state.socket === part.id;
    const valid = assembly.state.selected === part.id;
    return <group key={part.id} position={ASSEMBLY_SOCKETS[part.id]} onClick={event => { event.stopPropagation(); if (assembly.enabled && !installed) assembly.onAction({ type: "socket", id: part.id }); }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.44, 0.54, 40]} /><meshBasicMaterial color={installed ? "#56774b" : highlighted ? valid ? "#ffe234" : "#bd6f46" : "#eee8bd"} side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
      {!installed && <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.85, 0.9, 0.85]} /><meshBasicMaterial color={highlighted && !valid ? "#bd6f46" : "#e6d269"} wireframe transparent opacity={highlighted || valid ? 0.65 : 0.16} depthWrite={false} /></mesh>}
    </group>;
  })}</group>;
}

// A lightweight silhouette previews the authored position without cloning the
// full model, its animated refs, or its materials.
function AssemblyGhost({ id }: { id: ComponentId }) {
  const material = <meshBasicMaterial color="#ae962d" wireframe transparent opacity={0.3} depthWrite={false} />;
  const anchor = PART_ANCHORS[id];
  return <group position={anchor}>
    {id === "boiler" ? <mesh position={[0, 1.32, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.73, 0.73, 1.86, 12]} />{material}</mesh>
      : id === "flywheel" ? <mesh position={[0, 1.23, 0.33]}><torusGeometry args={[1.02, 0.1, 6, 24]} />{material}</mesh>
      : id === "piston" ? <mesh position={[0, 1.1, 0]}><boxGeometry args={[2.2, 0.45, 0.6]} />{material}</mesh>
      : id === "textile" ? <mesh position={[0, 1, 0]}><boxGeometry args={[2.4, 2, 1.75]} />{material}</mesh>
      : <group><mesh position={[-0.55, 1.1, -0.55]}><cylinderGeometry args={[0.09, 0.09, 1.1, 6]} />{material}</mesh><mesh position={[0.25, 1.55, -0.55]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.09, 0.09, 1.6, 6]} />{material}</mesh></group>}
  </group>;
}

export function AssemblyConnections({ state, animate }: { state: AssemblyState; animate: boolean }) {
  const particles = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const points = [
    new THREE.Vector3(-2.85, 2.3, -0.55),
    new THREE.Vector3(-1.25, 2.65, -0.55),
    new THREE.Vector3(-3.15, 1.6, 1.74),
    new THREE.Vector3(-0.43, 1.23, 1.74),
    new THREE.Vector3(TRANSMISSION.flywheelPulley.x, TRANSMISSION.flywheelPulley.y, TRANSMISSION.flywheelPulley.z),
    new THREE.Vector3(TRANSMISSION.counterPulley.x, TRANSMISSION.counterPulley.y, TRANSMISSION.counterPulley.z),
    new THREE.Vector3(TRANSMISSION.bevel.x, TRANSMISSION.bevel.y, TRANSMISSION.bevel.z),
    new THREE.Vector3(TRANSMISSION.linePulley.x, TRANSMISSION.linePulley.y, TRANSMISSION.linePulley.z),
    new THREE.Vector3(TRANSMISSION.loomPulley.x, TRANSMISSION.loomPulley.y, TRANSMISSION.loomPulley.z),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const complete = assemblyComplete(state);
  useFrame((_, delta) => {
    if (animate) phase.current = (phase.current + Math.min(delta, 0.05) * 0.09) % 1;
    particles.current?.children.forEach((mesh, i) => mesh.position.copy(curve.getPointAt((phase.current + i / 9) % 1)));
  });
  return <group>
    <Block position={[0, 0.06, 4.2]} size={[10.5, 0.16, 1.9]} color="#b4ad8a" metalness={0} />
    {ASSEMBLY_PARTS.map(part => <Ring key={part.id} position={trayPosition(part.id)} rotation={[-Math.PI / 2, 0, 0]} radius={0.7} tube={0.018} color={state.selected === part.id ? "#c7a21d" : "#807f5d"} />)}
    {complete && <>
      <Pipe points={points.map(point => point.toArray() as SceneVector)} radius={0.025} color="#d7b531" />
      <group ref={particles}>{Array.from({ length: 9 }, (_, i) => <mesh key={i}><sphereGeometry args={[0.075, 8, 6]} /><meshBasicMaterial color="#ffe234" /></mesh>)}</group>
    </>}
  </group>;
}
