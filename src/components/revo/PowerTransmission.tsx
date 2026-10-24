"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Ring, Rod } from "./ScenePrimitives";
import type { MotionRef } from "./SteamEngine";
import { TRANSMISSION, transmissionMotion } from "@/lib/revo/mechanics";

type Plane = "xy" | "yz";
type Point2 = readonly [number, number];
const FLYWHEEL_CENTER: Point2 = [TRANSMISSION.flywheelPulley.x, TRANSMISSION.flywheelPulley.y];
const COUNTER_CENTER: Point2 = [TRANSMISSION.counterPulley.x, TRANSMISSION.counterPulley.y];
const LINE_CENTER: Point2 = [TRANSMISSION.linePulley.y, TRANSMISSION.linePulley.z];
const LOOM_CENTER: Point2 = [TRANSMISSION.loomPulley.y, TRANSMISSION.loomPulley.z];

function beltPath(a: Point2, radiusA: number, b: Point2, radiusB: number) {
  const centerA = new THREE.Vector2(...a);
  const centerB = new THREE.Vector2(...b);
  const direction = centerB.clone().sub(centerA);
  const distance = direction.length();
  if (distance <= Math.abs(radiusA - radiusB)) throw new Error("Transmission pulleys need external tangent clearance");
  direction.normalize();
  const perpendicular = new THREE.Vector2(-direction.y, direction.x);
  const sine = (radiusA - radiusB) / distance;
  const cosine = Math.sqrt(1 - sine * sine);
  const normalTop = direction.clone().multiplyScalar(sine).addScaledVector(perpendicular, cosine);
  const normalBottom = direction.clone().multiplyScalar(sine).addScaledVector(perpendicular, -cosine);
  const topA = centerA.clone().addScaledVector(normalTop, radiusA);
  const topB = centerB.clone().addScaledVector(normalTop, radiusB);
  const bottomB = centerB.clone().addScaledVector(normalBottom, radiusB);
  const bottomA = centerA.clone().addScaledVector(normalBottom, radiusA);
  const points: THREE.Vector2[] = [];
  const push = (point: THREE.Vector2) => {
    if (!points.length || points[points.length - 1].distanceToSquared(point) > 1e-8) points.push(point.clone());
  };
  push(topA); push(topB);
  const addClockwiseArc = (center: THREE.Vector2, radius: number, start: number, end: number) => {
    while (end >= start) end -= Math.PI * 2;
    for (let step = 1; step <= 28; step += 1) {
      const angle = start + (end - start) * step / 28;
      push(center.clone().add(new THREE.Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(radius)));
    }
  };
  addClockwiseArc(centerB, radiusB, Math.atan2(normalTop.y, normalTop.x), Math.atan2(normalBottom.y, normalBottom.x));
  push(bottomB); push(bottomA);
  addClockwiseArc(centerA, radiusA, Math.atan2(normalBottom.y, normalBottom.x), Math.atan2(normalTop.y, normalTop.x));
  return points;
}

function makeBeltGeometry(a: Point2, radiusA: number, b: Point2, radiusB: number, plane: Plane, planeOffset: number, width: number) {
  const path = beltPath(a, radiusA, b, radiusB);
  const position: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  let distance = 0;
  for (let index = 0; index < path.length; index += 1) {
    const point = path[index];
    if (index > 0) distance += path[index - 1].distanceTo(point);
  }
  const loopLength = distance + path[path.length - 1].distanceTo(path[0]);
  const repeats = Math.max(1, Math.round(loopLength / TRANSMISSION.textureRepeat));
  distance = 0;
  for (let index = 0; index < path.length; index += 1) {
    const point = path[index];
    if (index > 0) distance += path[index - 1].distanceTo(point);
    for (const side of [-1, 1]) {
      const offset = side * width / 2;
      if (plane === "xy") position.push(point.x, point.y, planeOffset + offset);
      else position.push(planeOffset + offset, point.x, point.y);
      uv.push(distance / loopLength * repeats, side === -1 ? 0 : 1);
    }
  }
  for (let index = 0; index < path.length; index += 1) {
    const next = (index + 1) % path.length;
    const first = index * 2;
    const second = next * 2;
    indices.push(first, second, first + 1, second, second + 1, first + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.loopLength = loopLength;
  geometry.userData.textureRepeats = repeats;
  return geometry;
}

function makeBeltTexture() {
  const width = 32;
  const height = 8;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const seam = x % 8 === 0 && y > 0 && y < height - 1;
      const edge = y === 0 || y === height - 1;
      const variation = (x % 4) * 2;
      const index = (y * width + x) * 4;
      data[index] = seam ? 171 : edge ? 116 : 76 + variation;
      data[index + 1] = seam ? 143 : edge ? 87 : 54 + variation;
      data[index + 2] = seam ? 97 : edge ? 56 : 37 + variation;
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function BeltLoop({ plane, centerA, radiusA, centerB, radiusB, planeOffset, stage, motion, active }: {
  plane: Plane; centerA: Point2; radiusA: number; centerB: Point2; radiusB: number;
  planeOffset: number; stage: "primary" | "secondary"; motion: MotionRef; active: boolean;
}) {
  const texture = useMemo(() => makeBeltTexture(), []);
  const geometry = useMemo(() => makeBeltGeometry(centerA, radiusA, centerB, radiusB, plane, planeOffset, TRANSMISSION.beltWidth), [centerA, radiusA, centerB, radiusB, plane, planeOffset]);
  useEffect(() => () => { texture.dispose(); geometry.dispose(); }, [texture, geometry]);
  useFrame((_, delta) => {
    if (!active) return;
    const rates = transmissionMotion(motion.current.angle, motion.current.velocity);
    const linearSpeed = stage === "primary"
      ? motion.current.velocity * TRANSMISSION.flywheelPulley.radius
      : rates.lineVelocity * TRANSMISSION.linePulley.radius;
    const distance = geometry.userData.loopLength as number;
    const repeats = geometry.userData.textureRepeats as number;
    texture.offset.x = ((texture.offset.x - linearSpeed * Math.min(delta, 0.05) / distance * repeats) % 1 + 1) % 1;
  });
  return <mesh geometry={geometry} castShadow receiveShadow>
    <meshStandardMaterial map={texture} color="#96734f" roughness={0.92} metalness={0.02} side={THREE.DoubleSide} />
  </mesh>;
}

function Sheave({ radius, axis = "z", width = 0.17, color = "#5a5140", spoked = false }: {
  radius: number; axis?: "x" | "z"; width?: number; color?: string; spoked?: boolean;
}) {
  const cylinderRotation: [number, number, number] = axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, -Math.PI / 2];
  const ringRotation: [number, number, number] = axis === "z" ? [0, 0, 0] : [0, Math.PI / 2, 0];
  const length: [number, number, number] = axis === "z" ? [0, 0, width * 0.43] : [width * 0.43, 0, 0];
  return <group>
    {spoked ? <>
      <Cylinder radius={radius * 0.15} length={width} color="#92774e" rotation={cylinderRotation} />
      {Array.from({ length: 8 }, (_, index) => <Block key={index} position={[0, radius * 0.47, 0]} size={[0.075, radius * 0.76, width * 0.62]} color="#69705c" rotation={[0, 0, index * Math.PI / 4]} />)}
    </> : <Cylinder radius={radius * 0.91} length={width * 0.64} color={color} rotation={cylinderRotation} />}
    <Ring radius={radius} tube={0.045} color="#987e4e" rotation={ringRotation} />
    <Ring position={length} radius={radius * 0.96} tube={0.028} color="#b1a06f" rotation={ringRotation} />
    <Ring position={[-length[0], -length[1], -length[2]]} radius={radius * 0.96} tube={0.028} color="#b1a06f" rotation={ringRotation} />
  </group>;
}

function BevelGear({ axis }: { axis: "x" | "z" }) {
  const coneRotation: [number, number, number] = axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, -Math.PI / 2];
  const ringRotation: [number, number, number] = axis === "z" ? [0, 0, 0] : [0, Math.PI / 2, 0];
  return <group>
    <mesh rotation={coneRotation} castShadow>
      <cylinderGeometry args={[0.08, 0.26, 0.28, 12]} />
      <meshStandardMaterial color="#9d8657" metalness={0.68} roughness={0.38} />
    </mesh>
    <Ring radius={0.23} tube={0.035} color="#c0a368" rotation={ringRotation} />
    {Array.from({ length: 10 }, (_, index) => {
      const angle = index * Math.PI / 5;
      const r = 0.225;
      const position: [number, number, number] = axis === "z"
        ? [Math.cos(angle) * r, Math.sin(angle) * r, 0]
        : [0, Math.cos(angle) * r, Math.sin(angle) * r];
      const rotation: [number, number, number] = axis === "z" ? [0, 0, angle] : [angle, 0, 0];
      return <Block key={index} position={position} size={axis === "z" ? [0.1, 0.12, 0.1] : [0.1, 0.1, 0.12]} color="#806d4e" rotation={rotation} />;
    })}
  </group>;
}

export default function PowerTransmission({ motion, active }: { motion: MotionRef; active: boolean }) {
  const countershaft = useRef<THREE.Group>(null);
  const lineShaft = useRef<THREE.Group>(null);
  useFrame(() => {
    const rates = transmissionMotion(motion.current.angle, motion.current.velocity);
    if (countershaft.current) countershaft.current.rotation.z = rates.counterAngle;
    if (lineShaft.current) lineShaft.current.rotation.x = rates.lineAngle;
  });

  const counter = TRANSMISSION.counterPulley;
  const counterCenterZ = (TRANSMISSION.countershaft.rearZ + TRANSMISSION.countershaft.frontZ) / 2;
  const line = TRANSMISSION.linePulley;
  const loom = TRANSMISSION.loomPulley;
  return <group>
    {/* A transverse overhead countershaft is carried from the existing mill frame. */}
    <Block position={[counter.x, 3.52, -0.06]} size={[0.15, 0.1, 3.52]} color="#505b52" />
    {[-1.23, 0.75].map((z) => <group key={z}>
      <Rod start={[counter.x, 3.46, z]} end={[counter.x, 2.96, z]} radius={0.032} color="#505b52" />
      <Ring position={[counter.x, counter.y, z]} radius={0.14} tube={0.035} color="#8d805f" rotation={[0, 0, 0]} />
      <Block position={[counter.x, counter.y + 0.08, z]} size={[0.21, 0.08, 0.14]} color="#505b52" />
    </group>)}
    <group ref={countershaft} position={[counter.x, counter.y, counterCenterZ]}>
      <Cylinder radius={0.06} length={TRANSMISSION.countershaft.frontZ - TRANSMISSION.countershaft.rearZ} color="#7d806e" rotation={[Math.PI / 2, 0, 0]} />
      <group position={[0, 0, counter.z - counterCenterZ]}><Sheave radius={counter.radius} axis="z" /></group>
      <group position={[0, 0, TRANSMISSION.bevel.z - counterCenterZ]}><BevelGear axis="z" /></group>
    </group>
    {/* Existing east-west factory line shaft is animated in place and meets the
        countershaft at an exposed, low-speed right-angle bevel pair. */}
    <group ref={lineShaft} position={[TRANSMISSION.bevel.x, TRANSMISSION.bevel.y, TRANSMISSION.bevel.z]}>
      <Cylinder radius={0.055} length={7.2} color="#777969" rotation={[0, 0, Math.PI / 2]} />
      <group position={[line.x - TRANSMISSION.bevel.x, 0, 0]}><Sheave radius={line.radius} axis="x" /></group>
      <BevelGear axis="x" />
    </group>
    <BeltLoop plane="xy"
      centerA={FLYWHEEL_CENTER} radiusA={TRANSMISSION.flywheelPulley.radius}
      centerB={COUNTER_CENTER} radiusB={counter.radius}
      planeOffset={TRANSMISSION.flywheelPulley.z} stage="primary" motion={motion} active={active} />
    <BeltLoop plane="yz"
      centerA={LINE_CENTER} radiusA={line.radius}
      centerB={LOOM_CENTER} radiusB={loom.radius}
      planeOffset={line.x} stage="secondary" motion={motion} active={active} />
  </group>;
}

export function FlywheelPulley({ motion }: { motion: MotionRef }) {
  const pulley = useRef<THREE.Group>(null);
  useFrame(() => { if (pulley.current) pulley.current.rotation.z = -motion.current.angle; });
  return <group ref={pulley} position={[TRANSMISSION.flywheelPulley.x, TRANSMISSION.flywheelPulley.y, TRANSMISSION.flywheelPulley.z]}>
    <Sheave radius={TRANSMISSION.flywheelPulley.radius} spoked />
  </group>;
}

export function LoomDrivenPulley() {
  return <Sheave radius={TRANSMISSION.loomPulley.radius} axis="z" color="#4d5e4f" />;
}
