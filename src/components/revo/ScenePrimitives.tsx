"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { SceneVector } from "./scene-types";

export const METAL = "#3d4846";
export const COPPER = "#b97342";
export const WOOD = "#8d6542";

export function Block({ position = [0, 0, 0], size, color = METAL, rotation = [0, 0, 0], metalness = 0.25, roughness = 0.62 }: {
  position?: SceneVector; size: SceneVector; color?: string; rotation?: SceneVector; metalness?: number; roughness?: number;
}) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
  </mesh>;
}

export function Cylinder({ position = [0, 0, 0], radius, length, color = METAL, rotation = [0, 0, 0], radialSegments = 32, metalness = 0.55 }: {
  position?: SceneVector; radius: number; length: number; color?: string; rotation?: SceneVector; radialSegments?: number; metalness?: number;
}) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[radius, radius, length, radialSegments]} />
    <meshStandardMaterial color={color} metalness={metalness} roughness={0.38} />
  </mesh>;
}

export function Ring({ position = [0, 0, 0], radius, tube, color = COPPER, rotation = [0, 0, 0] }: {
  position?: SceneVector; radius: number; tube: number; color?: string; rotation?: SceneVector;
}) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <torusGeometry args={[radius, tube, 10, 48]} />
    <meshStandardMaterial color={color} metalness={0.65} roughness={0.38} />
  </mesh>;
}

export function Pipe({ points, radius = 0.075, color = COPPER }: { points: SceneVector[]; radius?: number; color?: string }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.08), [points]);
  return <mesh castShadow receiveShadow>
    <tubeGeometry args={[curve, 48, radius, 10, false]} />
    <meshStandardMaterial color={color} metalness={0.7} roughness={0.33} />
  </mesh>;
}

export function Rod({ start, end, radius = 0.045, color = METAL }: { start: SceneVector; end: SceneVector; radius?: number; color?: string }) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={quaternion} castShadow>
    <cylinderGeometry args={[radius, radius, direction.length(), 10]} />
    <meshStandardMaterial color={color} metalness={0.6} roughness={0.38} />
  </mesh>;
}

export function Rivets({ radius, count = 12, z = 0, color = "#cbaa74" }: { radius: number; count?: number; z?: number; color?: string }) {
  return <group>{Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return <mesh key={i} position={[Math.sin(angle) * radius, Math.cos(angle) * radius, z]}>
      <sphereGeometry args={[0.028, 6, 6]} />
      <meshStandardMaterial color={color} metalness={0.65} roughness={0.4} />
    </mesh>;
  })}</group>;
}

export function Crate({ position, scale = 1 }: { position: SceneVector; scale?: number }) {
  return <group position={position} scale={scale}>
    <Block position={[0, 0.3, 0]} size={[0.7, 0.6, 0.65]} color="#937352" metalness={0} />
    {[-0.24, 0.24].map((x) => <Block key={x} position={[x, 0.3, 0.338]} size={[0.07, 0.57, 0.025]} color="#bea07a" metalness={0} />)}
    {[0.07, 0.53].map((y) => <Block key={y} position={[0, y, 0.35]} size={[0.72, 0.07, 0.025]} color="#bea07a" metalness={0} />)}
    <Block position={[0, 0.31, 0.35]} size={[0.055, 0.61, 0.03]} color="#b3946c" rotation={[0, 0, -0.72]} metalness={0} />
    {[-0.23, 0, 0.23].map((x) => <Block key={x} position={[x, 0.611, 0]} size={[0.012, 0.008, 0.64]} color="#6e533c" metalness={0} />)}
  </group>;
}
