"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Block, Cylinder, Crate, Rod, METAL, WOOD } from "./ScenePrimitives";

function ArchWindow({ x }: { x: number }) {
  const arch = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.9, 0);
    shape.lineTo(-0.9, 1.05);
    shape.absarc(0, 1.05, 0.9, Math.PI, 0, true);
    shape.lineTo(0.9, 0);
    shape.closePath();
    return shape;
  }, []);
  return <group position={[x, 0.72, -2.8]}>
    <mesh position={[0, 0, -0.13]}>
      <shapeGeometry args={[arch]} />
      <meshStandardMaterial color="#d6dcce" roughness={0.8} metalness={0.05} />
    </mesh>
    <Block position={[-0.87, 0.54, 0]} size={[0.09, 1.13, 0.18]} color="#595c50" />
    <Block position={[0.87, 0.54, 0]} size={[0.09, 1.13, 0.18]} color="#595c50" />
    <Block position={[0, 0.95, 0]} size={[0.06, 1.87, 0.09]} color="#666a5b" />
    {[0.5, 1.06].map((y) => <Block key={y} position={[0, y, 0]} size={[1.72, 0.055, 0.09]} color="#666a5b" />)}
    <Block position={[0, -0.04, 0.05]} size={[2.1, 0.12, 0.38]} color="#b8a88e" metalness={0} />
    {Array.from({ length: 13 }, (_, i) => {
      const angle = Math.PI * i / 12;
      return <Block key={i} position={[Math.cos(angle) * 0.97, 1.05 + Math.sin(angle) * 0.97, 0]} size={[0.24, 0.18, 0.3]} rotation={[0, 0, angle + Math.PI / 2]} color={i % 2 ? "#ac7860" : "#be8f70"} metalness={0} />;
    })}
  </group>;
}

function BrickWall() {
  const bricks = useMemo(() => {
    const result: { x: number; y: number; color: string }[] = [];
    for (let row = 0; row < 14; row++) {
      for (let col = 0; col < 22; col++) {
        const x = -4.96 + col * 0.465 + (row % 2) * 0.232;
        const y = 0.11 + row * 0.198;
        if (x > 5 || y > 2.64) continue;
        const inWindow = [-2.5, 2.4].some((center) => {
          const dx = Math.abs(x - center);
          return y > 0.64 && dx < 1.09 && (y < 1.8 || Math.hypot(dx, y - 1.8) < 1.08);
        });
        if (!inWindow) result.push({ x, y, color: ["#9f7761", "#b08a6f", "#a77e64", "#b79578"][(row * 7 + col * 3) % 4] });
      }
    }
    return result;
  }, []);
  return <group>
    {bricks.map((brick, i) => <Block key={i} position={[brick.x, brick.y, -2.87]} size={[0.445, 0.18, 0.28]} color={brick.color} metalness={0} />)}
    <ArchWindow x={-2.5} /><ArchWindow x={2.4} />
    <Block position={[0, 2.76, -2.87]} size={[10.6, 0.13, 0.43]} color="#bdab91" metalness={0} />
    <Block position={[0, 0.1, -2.67]} size={[10.6, 0.2, 0.14]} color="#baaa91" metalness={0} />
  </group>;
}

export function FactoryEnvironment({ onCoalSelect }: { onCoalSelect?: () => void }) {
  return <group>
    <Block position={[0, -0.2, 0]} size={[10.9, 0.4, 6.7]} color="#91816a" metalness={0} />
    <Block position={[0, -0.02, 0]} size={[11, 0.1, 6.8]} color="#b9ad92" metalness={0} />
    {Array.from({ length: 11 }, (_, x) => Array.from({ length: 7 }, (_, z) => <Block key={`${x}-${z}`} position={[-5 + x, 0.045, -3 + z]} size={[0.973, 0.075, 0.971]} color={["#c6bda5", "#c3bba3", "#c9c0a8", "#bfb79f"][(x * 3 + z) % 4]} metalness={0} />))}
    <BrickWall />
    {[-4.7, 4.7].map((x) => <group key={x}>
      <Block position={[x, 1.9, -2.4]} size={[0.17, 3.7, 0.2]} color={METAL} />
      <Block position={[x, 0.16, -2.4]} size={[0.42, 0.16, 0.44]} color={METAL} />
      <Block position={[x, 3.67, -1.1]} size={[0.15, 0.22, 2.95]} color={METAL} />
      <Rod start={[x, 2.8, -2.4]} end={[x, 3.64, -1.5]} radius={0.045} />
    </group>)}
    <Block position={[0, 3.65, -2.39]} size={[9.6, 0.22, 0.18]} color={METAL} />
    <Block position={[0, 3.79, -2.39]} size={[9.7, 0.055, 0.31]} color="#50564e" />
    {[-1.8, 4.3].map((x) => <group key={x}>
      <Rod start={[x, 3.66, -2.4]} end={[x, 2.83, -1.6]} radius={0.025} />
      <Cylinder position={[x, 2.82, -1.6]} radius={0.13} length={0.16} rotation={[0, 0, Math.PI / 2]} />
    </group>)}
    <group position={[-4.1, 0, -1.75]}>
      <Block position={[0, 0.28, 0]} size={[1.04, 0.5, 0.95]} color="#8e6c55" metalness={0} />
      {Array.from({ length: 18 }, (_, i) => <group key={i}>
        <Block position={[0, 0.6 + i * 0.195, 0]} size={[0.74, 0.18, 0.7]} color={i % 3 ? "#a77758" : "#98694c"} metalness={0} />
        <Block position={[i % 2 ? -0.17 : 0.18, 0.6 + i * 0.195, 0.351]} size={[0.013, 0.18, 0.007]} color="#c0a07a" metalness={0} />
      </group>)}
      <Block position={[0, 4.05, 0]} size={[0.9, 0.19, 0.86]} color="#c1a17b" metalness={0} />
      <Block position={[0, 4.155, 0]} size={[0.54, 0.018, 0.51]} color="#3f3c35" metalness={0} />
    </group>
    <Crate position={[4.45, 0.08, 1.75]} scale={0.95} />
    <Crate position={[4.2, 0.08, -1.95]} scale={0.85} />
    <Crate position={[4.15, 0.6, -1.95]} scale={0.72} />
    <group position={[-4.2, 0.15, 1.5]} onClick={event => { if (onCoalSelect && event.delta <= 4) { event.stopPropagation(); onCoalSelect(); } }}>
      <Block position={[0, 0.09, 0]} size={[1.05, 0.18, 0.88]} color={WOOD} metalness={0} />
      {[-0.51, 0.51].map((x) => <Block key={x} position={[x, 0.26, 0]} size={[0.08, 0.34, 0.93]} color={WOOD} metalness={0} />)}
      {Array.from({ length: 15 }, (_, i) => <mesh key={i} position={[-0.32 + (i % 4) * 0.22, 0.24 + Math.floor(i / 8) * 0.11, -0.27 + Math.floor(i / 4) * 0.18]} rotation={[i * 0.7, i * 1.8, i * 0.3]} castShadow>
        <dodecahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color={i % 2 ? "#30332f" : "#44463c"} roughness={1} />
      </mesh>)}
    </group>
    <group position={[2.8, 0.1, 2.42]}>
      <Block position={[0, 0.12, 0]} size={[1.65, 0.12, 0.65]} color="#8f7351" metalness={0} />
      {[0, 1, 2].map((i) => <Cylinder key={i} position={[-0.45 + i * 0.45, 0.31, 0]} radius={0.19} length={0.62} color="#dfd9bb" rotation={[Math.PI / 2, 0, 0]} metalness={0} />)}
    </group>
    {[-0.44, 0.44].map((z) => <Block key={z} position={[-0.25, 0.105, 2.54 + z]} size={[5.3, 0.045, 0.06]} color="#7c7965" />)}
    {Array.from({ length: 10 }, (_, i) => <Block key={i} position={[-2.65 + i * 0.53, 0.086, 2.54]} size={[0.14, 0.025, 1.15]} color="#a89a7c" metalness={0} />)}
  </group>;
}
