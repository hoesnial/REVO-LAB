"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Ring, Rivets, METAL } from "./ScenePrimitives";

export interface EngineMotion { angle: number; velocity: number }
export type MotionRef = RefObject<EngineMotion>;

function Gear({ radius, teeth, color = "#9c8a5f" }: { radius: number; teeth: number; color?: string }) {
  return <group>
    <Cylinder radius={radius * 0.84} length={0.13} color={color} rotation={[Math.PI / 2, 0, 0]} />
    <Ring radius={radius * 0.57} tube={0.035} color="#b6a370" />
    {Array.from({ length: teeth }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI * 2 / teeth]}>
      <Block position={[0, radius * 0.9, 0]} size={[radius * 0.27, radius * 0.24, 0.14]} color={color} />
    </group>)}
    <Cylinder radius={radius * 0.24} length={0.21} color={METAL} rotation={[Math.PI / 2, 0, 0]} />
  </group>;
}

export function Flywheel({ motion }: { motion: MotionRef }) {
  const wheel = useRef<THREE.Group>(null);
  const gear = useRef<THREE.Group>(null);
  const smallGear = useRef<THREE.Group>(null);
  useFrame(() => {
    if (wheel.current) wheel.current.rotation.z = -motion.current.angle;
    if (gear.current) gear.current.rotation.z = -motion.current.angle;
    if (smallGear.current) smallGear.current.rotation.z = motion.current.angle * 2;
  });
  return <group>
    <Block position={[-0.43, 0.2, 0.71]} size={[1.72, 0.2, 1.68]} color="#687462" />
    {[0.35, 1.3].map((z) => <group key={z}>
      <Block position={[-0.43, 0.38, z]} size={[0.65, 0.27, 0.25]} color="#445548" />
      <Block position={[-0.43, 0.73, z]} size={[0.2, 0.73, 0.2]} color="#4a5a4b" />
      <Cylinder position={[-0.43, 1.23, z]} radius={0.175} length={0.23} color="#ae9460" rotation={[Math.PI / 2, 0, 0]} />
    </group>)}
    <Cylinder position={[-0.43, 1.23, 0.63]} radius={0.066} length={1.8} color="#a9a58a" rotation={[Math.PI / 2, 0, 0]} />
    <group position={[-0.43, 1.23, 1.04]}>
      <group ref={wheel}>
        <Ring radius={1.02} tube={0.103} color="#35453e" />
        <Ring radius={1.035} tube={0.035} color="#b2a47a" position={[0, 0, 0.085]} />
        <Ring radius={0.915} tube={0.038} color="#475949" />
        {Array.from({ length: 8 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 4]}>
          <Block position={[0, 0.51, 0]} size={[0.075, 0.85, 0.11]} color="#4d6352" rotation={[0, 0, 0.09]} />
        </group>)}
        <Cylinder radius={0.23} length={0.21} color="#ac9866" rotation={[Math.PI / 2, 0, 0]} />
        <Cylinder radius={0.125} length={0.26} color="#46574a" rotation={[Math.PI / 2, 0, 0]} />
        <Rivets radius={0.175} count={6} z={0.125} />
        <Block position={[0, -0.24, -0.02]} size={[0.29, 0.39, 0.12]} color="#4d5e4f" rotation={[0, 0, 0.3]} />
        <Block position={[0.19, 0, 0.19]} size={[0.42, 0.09, 0.09]} color="#b6ac89" />
        <Cylinder position={[0.37, 0, 0.24]} radius={0.08} length={0.09} color="#8b7b58" rotation={[Math.PI / 2, 0, 0]} />
      </group>
    </group>
    <group position={[-0.43, 1.23, -0.18]} ref={gear}><Gear radius={0.41} teeth={14} /></group>
    <group position={[0.18, 1.23, -0.18]} ref={smallGear}><Gear radius={0.23} teeth={10} color="#71755b" /></group>
    <Cylinder position={[0.2, 1.23, -0.47]} radius={0.049} length={0.9} color="#b2a782" rotation={[Math.PI / 2, 0, 0]} />
    <Block position={[0.2, 0.74, -0.68]} size={[0.14, 0.96, 0.2]} color="#435546" />
  </group>;
}

export function PistonMechanism({ motion }: { motion: MotionRef }) {
  const slider = useRef<THREE.Group>(null);
  const connectingRod = useRef<THREE.Mesh>(null);
  const pistonRod = useRef<THREE.Mesh>(null);
  const start = useRef(new THREE.Vector3());
  const end = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));
  useFrame(() => {
    const angle = -motion.current.angle;
    const crankX = -0.43 + Math.cos(angle) * 0.37;
    const crankY = 1.23 + Math.sin(angle) * 0.37;
    const pistonX = crankX - Math.sqrt(1.5 ** 2 - (crankY - 1.23) ** 2);
    if (slider.current) slider.current.position.x = pistonX;
    if (connectingRod.current) {
      start.current.set(pistonX, 1.23, 1.31);
      end.current.set(crankX, crankY, 1.31);
      connectingRod.current.position.copy(start.current).add(end.current).multiplyScalar(0.5);
      direction.current.subVectors(end.current, start.current).normalize();
      connectingRod.current.quaternion.setFromUnitVectors(up.current, direction.current);
    }
    if (pistonRod.current) {
      const distance = pistonX + 2.6;
      pistonRod.current.position.x = -2.6 + distance / 2;
      pistonRod.current.scale.y = Math.max(0.05, distance);
    }
  });
  return <group>
    <Block position={[-2.12, 0.26, 1.25]} size={[1.55, 0.16, 0.82]} color="#65705b" />
    {[-2.55, -1.62].map((x) => <Block key={x} position={[x, 0.69, 1.24]} size={[0.15, 0.8, 0.55]} color="#465746" />)}
    <Block position={[-2.09, 1.05, 1.24]} size={[1.5, 0.1, 0.6]} color="#9d9879" />
    <Cylinder position={[-2.51, 1.23, 1.27]} radius={0.23} length={0.6} color="#557464" rotation={[0, 0, Math.PI / 2]} />
    {[-2.83, -2.22].map((x) => <Cylinder key={x} position={[x, 1.23, 1.27]} radius={0.27} length={0.07} color="#af955d" rotation={[0, 0, Math.PI / 2]} />)}
    {[-0.16, 0.16].map((y) => <Cylinder key={y} position={[-2.51, 1.23 + y, 1.45]} radius={0.021} length={0.71} color="#bdb28c" rotation={[0, 0, Math.PI / 2]} />)}
    <mesh ref={pistonRod} position={[-2, 1.23, 1.31]} rotation={[0, 0, -Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.045, 0.045, 1, 12]} /><meshStandardMaterial color="#d0c7a4" metalness={0.8} roughness={0.26} />
    </mesh>
    <group ref={slider} position={[-1.93, 1.23, 1.31]}>
      <Block size={[0.14, 0.17, 0.19]} color="#b7a775" />
      <Cylinder position={[0, 0, 0.12]} radius={0.06} length={0.08} color="#5c6954" rotation={[Math.PI / 2, 0, 0]} />
    </group>
    <mesh ref={connectingRod} castShadow>
      <cylinderGeometry args={[0.04, 0.055, 1.5, 10]} /><meshStandardMaterial color="#b7b191" metalness={0.7} roughness={0.34} />
    </mesh>
  </group>;
}
