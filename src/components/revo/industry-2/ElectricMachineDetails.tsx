import type { ThreeEvent } from "@react-three/fiber";
import type { ElectricPartId } from "@/lib/revo/industry-2/content";
import { useLayoutEffect, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { Block, Cylinder, Rod } from "../ScenePrimitives";

// Repeated fasteners share one geometry, material and draw call.
function Fasteners() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < 28; i++) {
      dummy.position.set(-2.32 + (i % 14) * .52, .79, i < 14 ? .712 : -.552);
      dummy.rotation.set(Math.PI / 2, 0, 0); dummy.updateMatrix();
      ref.current?.setMatrixAt(i, dummy.matrix);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[undefined, undefined, 28]}>
    <cylinderGeometry args={[.035,.035,.025,6]} /><meshStandardMaterial color="#c7c8b5" metalness={.65} roughness={.42} />
  </instancedMesh>;
}

export default function ElectricMachineDetails({ inspect }: { inspect?: (id: ElectricPartId) => void }) {
  const select = (id: ElectricPartId) => (event: ThreeEvent<MouseEvent>) => {
    if (!inspect || event.delta > 5) return;
    event.stopPropagation(); inspect(id);
  };
  return <group>
    <group onClick={select("motor")}>
    {/* Motor feet, mounting bolts, cooling cover, and bearing supports. */}
    {[-4.43,-3.43].map(x => <group key={x}>
      <Block position={[x,.33,2.18]} size={[.16,.19,1.13]} color="#2b433c" />
      {[1.77,2.59].map(z => <Cylinder key={z} position={[x,.443,z]} radius={.045} length={.035} radialSegments={6} color="#c7c8b5" />)}
    </group>)}
    <Cylinder position={[-3.93,.62,2.73]} rotation={[Math.PI/2,0,0]} radius={.325} length={.08} color="#263d37" />
    {[-.18,-.09,0,.09,.18].map(x => <Block key={x} position={[-3.93+x,.62,2.782]} size={[.025,.37,.014]} color="#9da896" />)}
    </group><group onClick={select("belt")}>
    {[-3.93,-2.35].map(x => <group key={x}>
      <Block position={[x,.15,1.04]} size={[.48,.14,.49]} color="#42594d" />
      <Block position={[x,.34,1.04]} size={[.26,.3,.25]} color="#617b6c" />
      <Cylinder position={[x,.62,.91]} rotation={[Math.PI/2,0,0]} radius={.14} length={.12} color="#b7baab" />
      <mesh position={[x,.62,1.04]} rotation={[0,0,x < -3 ? Math.PI/2 : -Math.PI/2]} castShadow>
        <torusGeometry args={[.236,.026,6,18,Math.PI]} /><meshStandardMaterial color="#65492e" roughness={.9} />
      </mesh>
    </group>)}
    </group><group onClick={select("conveyor")}>
    {/* Drive roller is coaxial with the driven pulley, not a floating decoration. */}
    {[-2.35,4.43].map(x => <group key={x}>
      <Cylinder position={[x,.62,.08]} rotation={[Math.PI/2,0,0]} radius={.218} length={1.02} color="#7d8b80" />
      <Cylinder position={[x,.62,.7]} rotation={[Math.PI/2,0,0]} radius={.13} length={.12} color="#bcc4ae" />
    </group>)}
    {[-.4,.57].map(z => <group key={z}>
      <Block position={[1.04,.28,z]} size={[6.8,.09,.09]} color="#64796b" />
      {[-2.32,0,2.17,4.43].map(x => <Block key={x} position={[x,.11,z]} size={[.32,.07,.29]} color="#374c40" />)}
      <Rod start={[-2.32,.17,z]} end={[0,.55,z]} radius={.035} color="#8b9a87" />
      <Rod start={[2.17,.17,z]} end={[4.43,.55,z]} radius={.035} color="#8b9a87" />
    </group>)}
    <Fasteners />
    </group><group onClick={select("panel")}>
    {/* Insulated conduits make the electrical route distinct from the drive. */}
    <Rod start={[-4.15,.22,-1.14]} end={[-4.15,.22,-.74]} radius={.055} color="#294854" />
    <Rod start={[-4.15,.22,-.74]} end={[-2.48,.22,-.74]} radius={.055} color="#294854" />
    <Rod start={[-2.48,.22,-.74]} end={[-2.48,.6,-1.2]} radius={.055} color="#294854" />
    <Rod start={[-2.48,.22,-.7]} end={[-4.65,.22,-.15]} radius={.045} color="#294854" />
    <Rod start={[-4.65,.22,-.15]} end={[-4.65,.22,2.18]} radius={.045} color="#294854" />
    <Rod start={[-4.65,.22,2.18]} end={[-4.23,.82,2.18]} radius={.045} color="#294854" />
    </group><group onClick={select("stations")}>
    {/* Workstations retain manual assembly/inspection; no invented automation. */}
    {[.22,2.67].map((x,i) => <group key={x} position={[x,0,-1.25]}>
      <Block position={[0,.61,-.12]} size={[1.12,.3,.46]} color="#4b6356" />
      <Block position={[0,.62,.13]} size={[.23,.035,.06]} color="#cab981" />
      <Block position={[.2,1.055,0]} size={[.26,.06,.3]} color="#d8bd82" />
      <Cylinder position={[-.29,1.24,0]} radius={.08} length={.12} color="#c8c9ad" />
      {i===1 && <Block position={[.05,1.05,-.12]} size={[.36,.025,.32]} color="#eee4c5" metalness={0} />}
    </group>)}
    </group>
  </group>;
}
