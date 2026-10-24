"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Pipe, Ring, Rod } from "./ScenePrimitives";
import { coalPose, fillingProgress, type FillingState, type ResourceKind } from "@/lib/revo/resourceFilling";
import type { SceneVector } from "./scene-types";

export const RESOURCE_POINTS: Record<ResourceKind, SceneVector> = { coal: [-4.2, 0.58, 1.5], water: [-4.65, 1.1, 2.65] };
export interface ResourceSceneProps {
  filling: FillingState;
  enabled: boolean;
  selected: ResourceKind | null;
  onSelect: (kind: ResourceKind | null) => void;
  onFill: (kind: ResourceKind) => void;
}
export type ResourceMarkers = RefObject<Record<ResourceKind, HTMLButtonElement | null>>;
export function ResourceProjector({ elements }: { elements: ResourceMarkers }) {
  const point = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    for (const kind of ["coal", "water"] as const) {
      const element = elements.current[kind];
      if (!element) continue;
      point.current.set(...RESOURCE_POINTS[kind]).project(camera);
      const x = THREE.MathUtils.clamp((point.current.x + 1) * size.width / 2, 24, size.width - 24);
      const y = THREE.MathUtils.clamp((1 - point.current.y) * size.height / 2, 70, size.height - 80);
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      element.style.visibility = "visible";
    }
  });
  return null;
}

const FEED_POINTS: SceneVector[] = [[-4.31, 0.46, 2.65], [-3.55, 0.46, 2.65], [-3.55, 0.46, 1], [-3.8, 0.7, 0.15], [-3.5, 1.1, 0.15]];
export function WaterSupply({ resources, reducedMotion }: { resources?: ResourceSceneProps; reducedMotion: boolean }) {
  const pump = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Group>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(FEED_POINTS.map(point => new THREE.Vector3(...point))), []);
  useFrame(() => {
    const filling = resources?.filling;
    const active = filling?.kind === "water";
    const progress = filling ? fillingProgress(filling) : 0;
    if (pump.current) pump.current.position.y = active && !reducedMotion ? Math.sin(progress * Math.PI * 10) * 0.07 : 0;
    if (stream.current) {
      stream.current.visible = active;
      stream.current.children.forEach((drop, i) => drop.position.copy(curve.getPointAt(reducedMotion ? i / 7 : (progress * 2 + i / 7) % 1)));
    }
  });
  return <group>
    <group position={[-4.65, 0.1, 2.65]} onClick={event => { if (resources?.enabled && event.delta <= 4) { event.stopPropagation(); resources.onSelect("water"); } }}>
      <Cylinder position={[0, 0.1, 0]} radius={0.43} length={0.17} color="#676e58" />
      <Cylinder position={[0, 0.51, 0]} radius={0.35} length={0.72} color="#617d72" />
      {[0.25, 0.8].map(y => <Ring key={y} position={[0, y, 0]} radius={0.353} tube={0.022} color="#b6a173" rotation={[Math.PI / 2, 0, 0]} />)}
      <Cylinder position={[0, 0.88, 0]} radius={0.32} length={0.014} color="#8bc0cb" metalness={0.1} />
      <Ring position={[0, 0.89, 0]} radius={0.35} tube={0.026} color="#aab6a0" rotation={[Math.PI / 2, 0, 0]} />
      <Cylinder position={[0.37, 0.53, 0]} radius={0.085} length={0.45} color="#baa373" />
      <group ref={pump}><Rod start={[0.37, 0.67, 0]} end={[0.37, 0.99, 0]} radius={0.025} color="#c4c5a9" /><Block position={[0.37, 0.99, 0]} size={[0.42, 0.055, 0.07]} color="#4b5345" /></group>
      <Block position={[0, 0.54, 0.352]} size={[0.28, 0.13, 0.025]} color="#cad2b9" />
    </group>
    <Pipe points={FEED_POINTS} radius={0.045} color="#709f9c" />
    <Cylinder position={[-3.8, 0.72, 0.15]} radius={0.075} length={0.18} color="#b9a479" />
    <group ref={stream} visible={false}>{Array.from({ length: 7 }, (_, i) => <mesh key={i}><sphereGeometry args={[0.065, 8, 6]} /><meshStandardMaterial color="#99d9e9" emissive="#5cabbf" emissiveIntensity={0.45} /></mesh>)}</group>
  </group>;
}

export function CoalFeeding({ filling, reducedMotion }: { filling: FillingState; reducedMotion: boolean }) {
  const shovel = useRef<THREE.Group>(null);
  const coals = useRef<THREE.Group>(null);
  useFrame(() => {
    const active = filling.kind === "coal";
    const pose = coalPose(fillingProgress(filling));
    if (shovel.current) {
      shovel.current.visible = active;
      shovel.current.position.set(...(reducedMotion ? [-2.85, 0.42, 1.7] as SceneVector : pose.position));
      shovel.current.rotation.x = reducedMotion ? 0 : pose.ember * -0.45;
    }
    if (coals.current) coals.current.visible = pose.coalVisible;
  });
  return <group ref={shovel} visible={false}>
    <Block size={[0.37, 0.035, 0.4]} color="#8a9080" />
    {[-0.18, 0.18].map(x => <Block key={x} position={[x, 0.04, 0]} size={[0.025, 0.075, 0.4]} color="#70776a" />)}
    <Rod start={[0, 0.02, 0.18]} end={[-0.2, 0.18, 0.75]} radius={0.028} color="#a18555" />
    <Ring position={[-0.2, 0.18, 0.75]} radius={0.09} tube={0.02} color="#8f744e" />
    <group ref={coals}>{Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[-0.1 + i % 3 * 0.1, 0.09, -0.09 + Math.floor(i / 3) * 0.14]} rotation={[i, i * 2, 0]}><dodecahedronGeometry args={[0.078, 0]} /><meshStandardMaterial color={i % 2 ? "#353a33" : "#252d29"} roughness={1} /></mesh>)}</group>
  </group>;
}

export function ResourceContext({ resources }: { resources: ResourceSceneProps }) {
  const kind = resources.selected;
  if (!kind) return null;
  const filling = resources.filling;
  return <section className="revo-resource-context" aria-label={kind === "coal" ? "Pengisian batu bara" : "Pengisian air"}>
    <button className="revo-resource-close" aria-label="Tutup pengisian" onClick={() => resources.onSelect(null)}>×</button>
    <strong>{kind === "coal" ? "BATU BARA · SUMBER PANAS" : "POMPA AIR PENGISI"}</strong>
    <p>{kind === "coal" ? "Batu bara digunakan sebagai bahan bakar untuk memanaskan air dan menghasilkan uap." : "Air dipanaskan dalam ketel untuk menghasilkan uap yang digunakan menggerakkan mesin. Pompa memasok air melalui pipa dan katup satu arah."}</p>
    <button className="revo-fill-action" disabled={!resources.enabled || filling.kind !== null} onClick={() => resources.onFill(kind)}>{filling.kind ? "Pengisian berlangsung…" : kind === "coal" ? "Masukkan Batu Bara" : "Isi Air"}</button>
    <small>Pengisian diblokir saat tekanan tinggi. Mekanisme disederhanakan untuk pembelajaran.</small>
  </section>;
}

export function FillingProgress({ filling }: { filling: FillingState }) {
  if (!filling.kind) return null;
  const progress = Math.round(fillingProgress(filling) * 100);
  return <div className="revo-filling-status" role="progressbar" aria-label={filling.kind === "coal" ? "Pengisian bahan bakar" : "Pengisian air"} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
    <span>{filling.kind === "coal" ? "Sekop → ruang bakar" : "Tangki → pompa → ketel"}<b>{progress}%</b></span><i><span style={{ width: `${progress}%` }} /></i>
  </div>;
}
