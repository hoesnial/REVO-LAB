"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Block, Cylinder, Ring, Rivets, Pipe, COPPER, METAL } from "./ScenePrimitives";
import type { FactorySceneProps } from "./scene-types";
import { BOILER, GAUGE } from "@/lib/revo/mechanics";
import { coalPose, fillingProgress, type FillingState } from "@/lib/revo/resourceFilling";

export function Boiler({ heat, pressure, water, safety, filling, reducedMotion = false }: Pick<FactorySceneProps, "heat" | "pressure" | "water" | "safety"> & { filling?: FillingState; reducedMotion?: boolean }) {
  const needle = useRef<THREE.Group>(null);
  const door = useRef<THREE.Group>(null);
  const fire = useRef<THREE.MeshStandardMaterial>(null);
  const embers = useRef<THREE.Group>(null);
  useFrame(() => {
    if (needle.current) needle.current.rotation.z = 2.1 - pressure / 100 * 4.2;
    const pose = coalPose(filling?.kind === "coal" ? fillingProgress(filling) : 0);
    if (door.current) door.current.rotation.y = reducedMotion ? filling?.kind === "coal" ? -1.35 : 0 : -pose.door * 1.35;
    if (fire.current) fire.current.emissiveIntensity = heat / 65 + pose.ember * 2;
    if (embers.current) {
      embers.current.visible = pose.ember > 0 && !reducedMotion;
      embers.current.children.forEach((spark, i) => {
        spark.position.set((i - 2) * 0.07, pose.ember * (0.08 + i * 0.035), 0.04 + i * 0.025);
        spark.scale.setScalar(0.6 + pose.ember * 0.5);
      });
    }
  });
  return <group position={[-2.85, 0, -0.3]}>
    <Block position={[0, 0.33, 0]} size={[1.8, 0.48, 2.1]} color="#6d6856" metalness={0.25} />
    <Block position={[0, 0.56, 0]} size={[1.61, 0.18, 1.95]} color="#323b37" />
    {[-0.57, 0.57].map((z) => <Block key={z} position={[0, 0.73, z]} size={[1.45, 0.25, 0.21]} color="#343d36" />)}
    <Cylinder position={[0, BOILER.axisY, 0]} radius={BOILER.radius} length={1.86} color="#5b7662" rotation={[Math.PI / 2, 0, 0]} />
    <mesh position={[0, 1.32, 0.91]} scale={[0.732, 0.732, 0.23]} castShadow>
      <sphereGeometry args={[1, 32, 18]} /><meshStandardMaterial color="#ac8051" metalness={0.75} roughness={0.4} />
    </mesh>
    {[-0.78, -0.38, 0.38, 0.8].map((z) => <group key={z} position={[0, 1.32, z]}>
      <Ring radius={0.733} tube={0.035} color="#ad9661" />
      <Rivets radius={0.75} count={14} color="#beae86" />
    </group>)}
    <group position={[0, 1.32, 1.113]}>
      <Cylinder radius={0.51} length={0.055} color="#6d7759" rotation={[Math.PI / 2, 0, 0]} />
      <Ring radius={0.51} tube={0.022} color="#d7ba7d" />
      <Rivets radius={0.44} count={10} color="#ccb880" z={0.037} />
      <Block position={[0, 0, 0.055]} size={[0.36, 0.16, 0.028]} color="#3b4940" />
      <Block position={[0, 0.012, 0.073]} size={[0.24, 0.017, 0.004]} color="#b6b58d" />
      <Block position={[0, -0.034, 0.073]} size={[0.17, 0.011, 0.004]} color="#b6b58d" />
    </group>
    <Block position={[0, 0.42, 1.36]} size={[0.85, 0.43, 0.6]} color="#31352c" />
    <Block position={[0, 0.41, 1.6]} size={[0.61, 0.24, 0.018]} color="#612c15" />
    <mesh position={[0, 0.41, 1.613]}>
      <planeGeometry args={[0.52, 0.19]} />
      <meshStandardMaterial ref={fire} color="#a2471d" emissive="#ff8a26" emissiveIntensity={heat / 65} roughness={1} />
    </mesh>
    <group ref={door} position={[-0.34, 0.41, 1.68]}>
      {[0.055, 0.625].map(x => <Block key={x} position={[x, 0, 0]} size={[0.07, 0.32, 0.055]} color="#38362d" />)}
      {[-0.145, 0.145].map(y => <Block key={y} position={[0.34, y, 0]} size={[0.68, 0.035, 0.055]} color="#38362d" />)}
      {Array.from({ length: 7 }, (_, i) => <Block key={i} position={[0.07 + i * 0.09, 0, 0]} size={[0.023, 0.27, 0.025]} color="#38362d" />)}
      <Block position={[0.55, 0, 0.06]} size={[0.055, 0.12, 0.05]} color="#b99d6b" />
    </group>
    <group ref={embers} position={[0, 0.41, 1.65]} visible={false}>{Array.from({ length: 5 }, (_, i) => <mesh key={i}><sphereGeometry args={[0.022, 5, 4]} /><meshStandardMaterial color="#ffbf52" emissive="#e36a22" emissiveIntensity={1.2} /></mesh>)}</group>
    <Cylinder position={[0, 2.02, -0.25]} radius={0.2} length={0.25} color={COPPER} />
    <Cylinder position={[0, 2.17, -0.25]} radius={0.25} length={0.06} color="#997346" />
    <Pipe points={[[GAUGE.x, 1.98, 0.5], [GAUGE.x, 2.19, 0.5], [GAUGE.x, GAUGE.y, GAUGE.z - 0.08]]} radius={0.035} color="#ad9661" />
    <Cylinder position={[GAUGE.x, 2.02, 0.5]} radius={0.075} length={0.08} color="#bc9b60" />
    <group position={[GAUGE.x, GAUGE.y, GAUGE.z]}>
      <Cylinder radius={GAUGE.radius} length={0.075} color="#bc9b60" rotation={[Math.PI / 2, 0, 0]} />
      <Cylinder position={[0, 0, 0.046]} radius={0.175} length={0.02} color="#ebe4c5" rotation={[Math.PI / 2, 0, 0]} metalness={0} />
      {Array.from({ length: 9 }, (_, i) => {
        const angle = -2.1 + i * 0.525;
        return <Block key={i} position={[Math.sin(angle) * 0.141, Math.cos(angle) * 0.141, 0.062]} size={[0.009, 0.027, 0.006]} rotation={[0, 0, -angle]} color={i > 6 ? "#ad4f36" : "#505445"} />;
      })}
      <group ref={needle} position={[0, 0, 0.073]}><Block position={[0, 0.055, 0]} size={[0.014, 0.14, 0.012]} color="#703e29" /></group>
      <Cylinder position={[0, 0, 0.079]} radius={0.023} length={0.012} color={METAL} rotation={[Math.PI / 2, 0, 0]} />
    </group>
    <Pipe points={[[0.67, 1.05, 0.15], [0.92, 1.05, 0.15], [0.92, 1.48, 0.15], [0.67, 1.48, 0.15]]} radius={0.023} color="#c7b889" />
    <mesh position={[0.92, 1.26, 0.15]}><cylinderGeometry args={[0.05, 0.05, 0.36, 12]} /><meshStandardMaterial color="#e3eee0" transparent opacity={0.25} depthWrite={false} metalness={0.1} roughness={0.2} /></mesh>
    <Cylinder position={[0.92, 1.09 + 0.17 * water / 100, 0.15]} radius={0.037} length={Math.max(0.002, 0.34 * water / 100)} color="#72b5ca" metalness={0.1} />
    <mesh position={[-0.5, 1.93, 0.29]}>
      <sphereGeometry args={[0.056, 12, 10]} />
      <meshStandardMaterial color={safety === "danger" ? "#e65030" : safety === "warning" ? "#f0a93f" : "#8cb482"} emissive={safety === "danger" ? "#e65030" : "#8cb482"} emissiveIntensity={0.3} />
    </mesh>
  </group>;
}

export function SteamPipes() {
  return <group>
    <Pipe points={[[-2.85, 2.16, -0.55], [-2.85, 2.56, -0.55], [-2.57, 2.68, -0.55], [-1.45, 2.68, -0.55], [-1.25, 2.47, -0.55], [-1.25, 1.6, -0.55], [-1.65, 1.6, 1.2], [-3.15, 1.6, 1.74], [-3.15, 1.48, 1.74]]} radius={0.083} />
    {[[-2.53, 2.68, -0.55], [-1.77, 2.68, -0.55]].map((point, i) => <Cylinder key={i} position={point as [number, number, number]} radius={0.13} length={0.055} color="#d1a366" rotation={[0, 0, Math.PI / 2]} />)}
    <Cylinder position={[-1.95, 2.8, -0.55]} radius={0.028} length={0.2} color="#ada375" />
    <Ring position={[-1.95, 2.91, -0.55]} radius={0.18} tube={0.025} color="#854c39" rotation={[Math.PI / 2, 0, 0]} />
    <Block position={[-1.95, 2.91, -0.55]} size={[0.35, 0.022, 0.027]} color="#854c39" />
    <Block position={[-1.95, 2.91, -0.55]} size={[0.027, 0.022, 0.35]} color="#854c39" />
    <Pipe points={[[-3.44, 1.5, -1.04], [-3.79, 1.5, -1.04], [-4.04, 1.22, -1.44]]} radius={0.2} color="#666354" />
    <Pipe points={[[-2.58, 0.46, -1.17], [-1.3, 0.46, -1.17], [-1.02, 0.44, -0.8], [-1.02, 0.28, 0.55]]} radius={0.045} color="#9a774c" />
  </group>;
}
