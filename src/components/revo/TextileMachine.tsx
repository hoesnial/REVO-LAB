"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Rod, Ring, WOOD } from "./ScenePrimitives";
import type { MotionRef } from "./SteamEngine";
import { transmissionMotion } from "@/lib/revo/mechanics";
import { LoomDrivenPulley } from "./PowerTransmission";

export function TextileMachine({ motion }: { motion: MotionRef }) {
  const shuttle = useRef<THREE.Group>(null);
  const heddle = useRef<THREE.Group>(null);
  const roller = useRef<THREE.Group>(null);
  const drive = useRef<THREE.Group>(null);
  const beater = useRef<THREE.Group>(null);
  const crankArm = useRef<THREE.Mesh>(null);
  const connectingRod = useRef<THREE.Mesh>(null);
  const rodStart = useRef(new THREE.Vector3());
  const rodEnd = useRef(new THREE.Vector3());
  const rodDirection = useRef(new THREE.Vector3());
  const rodUp = useRef(new THREE.Vector3(0, 1, 0));
  const axisX = useRef(new THREE.Vector3(1, 0, 0));
  useFrame(() => {
    const { loomAngle } = transmissionMotion(motion.current.angle, motion.current.velocity);
    const phase = loomAngle * 2;
    if (shuttle.current) shuttle.current.position.x = Math.sin(phase) * 0.55;
    if (heddle.current) heddle.current.position.y = 1.4 + Math.sin(phase) * 0.07;
    if (roller.current) roller.current.rotation.y = -loomAngle * 0.16;
    if (drive.current) drive.current.rotation.z = loomAngle;

    // A short crank-and-rocker linkage converts the loom shaft's rotation into
    // the beater's measured swing. The connecting rod keeps a fixed length.
    const crankRadius = 0.18;
    const crankY = 1.06 + Math.cos(loomAngle) * crankRadius;
    const crankZ = -0.48 + Math.sin(loomAngle) * crankRadius;
    const pivotY = 1.73;
    const pivotZ = 0.22;
    const rockerLength = 0.55;
    const linkLength = 0.8;
    const dy = crankY - pivotY;
    const dz = crankZ - pivotZ;
    const separation = Math.hypot(dy, dz);
    const along = (rockerLength * rockerLength - linkLength * linkLength + separation * separation) / (2 * separation);
    const height = Math.sqrt(Math.max(0, rockerLength * rockerLength - along * along));
    const unitY = dy / separation;
    const unitZ = dz / separation;
    const endY = pivotY + along * unitY - height * unitZ;
    const endZ = pivotZ + along * unitZ + height * unitY;
    if (beater.current) beater.current.rotation.x = Math.atan2(-(endZ - pivotZ), -(endY - pivotY));
    if (crankArm.current) {
      crankArm.current.position.set(1.135, crankY, crankZ);
      crankArm.current.quaternion.setFromUnitVectors(rodUp.current, axisX.current);
    }
    if (connectingRod.current) {
      rodStart.current.set(0.92, crankY, crankZ);
      rodEnd.current.set(0.92, endY, endZ);
      connectingRod.current.position.copy(rodStart.current).add(rodEnd.current).multiplyScalar(0.5);
      rodDirection.current.subVectors(rodEnd.current, rodStart.current).normalize();
      connectingRod.current.quaternion.setFromUnitVectors(rodUp.current, rodDirection.current);
      connectingRod.current.scale.y = rodStart.current.distanceTo(rodEnd.current);
    }
  });
  return <group position={[2.55, 0.09, 0.05]}>
    <Block position={[0, 0.08, 0]} size={[2.9, 0.13, 2.1]} color="#867f63" metalness={0} />
    {[-1.04, 1.04].map((x) => <group key={x}>
      {[-0.7, 0.72].map((z) => <group key={z}>
        <Block position={[x, 1, z]} size={[0.14, 1.9, 0.16]} color={WOOD} metalness={0} />
        <Block position={[x, 0.26, z]} size={[0.21, 0.12, 0.23]} color="#333f35" />
        <Block position={[x, 1.66, z]} size={[0.2, 0.11, 0.2]} color="#333f35" />
      </group>)}
      <Block position={[x, 1.95, 0]} size={[0.18, 0.19, 1.75]} color="#a08053" metalness={0} />
      <Block position={[x, 0.48, 0]} size={[0.15, 0.14, 1.62]} color={WOOD} metalness={0} />
      <Block position={[x, 1.14, 0]} size={[0.1, 0.1, 1.6]} color="#ad9161" metalness={0} />
      <Rod start={[x, 0.5, 0.62]} end={[x, 1.9, -0.67]} radius={0.05} color="#9f8055" />
    </group>)}
    {[-0.73, 0.73].map((z) => <Block key={z} position={[0, 1.95, z]} size={[2.3, 0.19, 0.16]} color="#a08053" metalness={0} />)}
    <Block position={[0, 0.48, -0.73]} size={[2.17, 0.15, 0.14]} color={WOOD} metalness={0} />
    <Cylinder position={[0, 1.33, -0.8]} radius={0.15} length={2.22} color="#c6b992" rotation={[0, 0, Math.PI / 2]} metalness={0} />
    <group position={[0, 1.02, 0.83]} rotation={[0, 0, Math.PI / 2]}>
      <group ref={roller}>
        <Cylinder radius={0.19} length={2.24} color="#ded9ba" metalness={0} />
        {[-1.12, 1.12].map((y) => <Cylinder key={y} position={[0, y, 0]} radius={0.25} length={0.075} color="#967247" />)}
      </group>
    </group>
    <mesh position={[0, 1.19, 0.2]} rotation={[-Math.PI / 2 + 0.18, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[1.94, 1.3]} /><meshStandardMaterial color="#e8e2c8" roughness={1} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.73, 1.02]} rotation={[0.05, 0, 0]} castShadow>
      <planeGeometry args={[1.94, 0.61]} /><meshStandardMaterial color="#dfd7b8" roughness={1} side={THREE.DoubleSide} />
    </mesh>
    {Array.from({ length: 33 }, (_, i) => {
      const x = -0.94 + i * 0.059;
      return <group key={i}>
        <Rod start={[x, 1.34, -0.83]} end={[x, 1.38, -0.08]} radius={0.0055} color={i % 5 === 0 ? "#a6a181" : "#e6dec0"} />
        <Rod start={[x, 1.38, -0.08]} end={[x, 1.17, 0.71]} radius={0.003} color="#c4bea0" />
      </group>;
    })}
    <group ref={heddle} position={[0, 1.4, -0.14]}>
      <Block position={[0, 0.2, 0]} size={[2.07, 0.075, 0.075]} color="#a88a5b" metalness={0} />
      <Block position={[0, -0.15, 0]} size={[2.07, 0.055, 0.07]} color="#a88a5b" metalness={0} />
      {Array.from({ length: 26 }, (_, i) => <Rod key={i} start={[-0.94 + i * 0.075, -0.15, 0]} end={[-0.94 + i * 0.075, 0.2, 0]} radius={0.006} color="#8b8d78" />)}
    </group>
    <group ref={shuttle} position={[0, 1.27, 0.41]}>
      <Block size={[0.39, 0.07, 0.13]} color="#785838" metalness={0} />
      <Cylinder position={[0, 0.055, 0]} radius={0.036} length={0.22} rotation={[0, 0, Math.PI / 2]} color="#e4dec0" metalness={0} />
    </group>
    <group position={[1.35, 1.06, -0.48]} rotation={[0, Math.PI / 2, 0]}>
      <group ref={drive}>
        <Ring radius={0.38} tube={0.035} color="#374b3d" />
        <Cylinder radius={0.078} length={0.18} color="#b09c6b" rotation={[Math.PI / 2, 0, 0]} />
        <LoomDrivenPulley />
        <mesh position={[0, 0.18, 0]}><sphereGeometry args={[0.062, 12, 10]} /><meshStandardMaterial color="#c2a263" metalness={0.68} roughness={0.37} /></mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => <Block key={i} position={[Math.cos(i * Math.PI / 3) * 0.18, Math.sin(i * Math.PI / 3) * 0.18, 0]} size={[0.37, 0.039, 0.045]} rotation={[0, 0, i * Math.PI / 3]} color="#536c54" />)}
      </group>
    </group>
    <mesh ref={crankArm} castShadow>
      <cylinderGeometry args={[0.035, 0.035, 0.43, 10]} />
      <meshStandardMaterial color="#b89c64" metalness={0.68} roughness={0.37} />
    </mesh>
    <group ref={beater} position={[0, 1.73, 0.22]}>
      <Block position={[0, -0.55, 0]} size={[2.18, 0.09, 0.09]} color="#97784e" metalness={0} />
      {[-0.93, 0.93].map(x => <Block key={x} position={[x, -0.28, 0]} size={[0.075, 0.58, 0.08]} color="#786749" metalness={0} />)}
      {Array.from({ length: 23 }, (_, i) => <Rod key={i} start={[-1.02 + i * 0.093, -0.59, -0.04]} end={[-1.02 + i * 0.093, -0.59, 0.11]} radius={0.007} color="#8e987d" />)}
    </group>
    <mesh ref={connectingRod} castShadow>
      <cylinderGeometry args={[0.035, 0.035, 1, 10]} />
      <meshStandardMaterial color="#a89568" metalness={0.65} roughness={0.38} />
    </mesh>
    <Block position={[0, 0.3, 0.93]} size={[1.16, 0.055, 0.2]} color="#69553c" metalness={0} rotation={[0.1, 0, 0]} />
  </group>;
}
