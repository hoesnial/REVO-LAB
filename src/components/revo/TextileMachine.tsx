"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Rod, Ring, WOOD } from "./ScenePrimitives";
import type { MotionRef } from "./SteamEngine";

export function TextileMachine({ motion }: { motion: MotionRef }) {
  const shuttle = useRef<THREE.Group>(null);
  const heddle = useRef<THREE.Group>(null);
  const roller = useRef<THREE.Group>(null);
  const drive = useRef<THREE.Group>(null);
  useFrame(() => {
    const phase = motion.current.angle * 2;
    if (shuttle.current) shuttle.current.position.x = Math.sin(phase) * 0.55;
    if (heddle.current) heddle.current.position.y = 1.4 + Math.sin(phase) * 0.07;
    if (roller.current) roller.current.rotation.y = -motion.current.angle * 0.16;
    if (drive.current) drive.current.rotation.z = motion.current.angle;
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
    <group position={[-1.24, 1.06, -0.48]} rotation={[0, Math.PI / 2, 0]}>
      <group ref={drive}>
        <Ring radius={0.38} tube={0.035} color="#374b3d" />
        <Cylinder radius={0.078} length={0.18} color="#b09c6b" rotation={[Math.PI / 2, 0, 0]} />
        {[0, 1, 2, 3, 4, 5].map((i) => <Block key={i} position={[Math.cos(i * Math.PI / 3) * 0.18, Math.sin(i * Math.PI / 3) * 0.18, 0]} size={[0.37, 0.039, 0.045]} rotation={[0, 0, i * Math.PI / 3]} color="#536c54" />)}
      </group>
    </group>
    <Rod start={[-1.24, 1.06, -0.82]} end={[-1.24, 2.73, -1.75]} radius={0.016} color="#725f43" />
    <Rod start={[-1.24, 1.06, -0.16]} end={[-1.24, 2.73, -1.4]} radius={0.016} color="#725f43" />
    <Block position={[0, 0.3, 0.93]} size={[1.16, 0.055, 0.2]} color="#69553c" metalness={0} rotation={[0.1, 0, 0]} />
  </group>;
}
