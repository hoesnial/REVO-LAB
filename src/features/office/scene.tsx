"use client";
import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { AgentId } from "@/shared/domain";
type V3 = [number,number,number];
function Box({position=[0,0,0],size,color,rotation=[0,0,0]}:{position?:V3;size:V3;color:string;rotation?:V3}) {return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.75}/></mesh>;}
function Cylinder({position,size,color}:{position:V3;size:[number,number,number];color:string}) {return <mesh position={position} castShadow receiveShadow><cylinderGeometry args={[...size,12]}/><meshStandardMaterial color={color}/></mesh>;}
function Label({text,position,width=2,height=.4,color="#e2eadd",bg="transparent",fontSize=50}:{text:string;position:V3;width?:number;height?:number;color?:string;bg?:string;fontSize?:number}) {
  const texture = useMemo(()=> {const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;const ctx=canvas.getContext("2d")!;if(bg!=="transparent"){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);}ctx.fillStyle=color;ctx.font=`600 ${fontSize*2}px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,512,128);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;},[text,color,bg,fontSize]);
  return <mesh position={position}><planeGeometry args={[width,height]}/><meshBasicMaterial map={texture} transparent depthWrite={false}/></mesh>;
}
function Plant({position,scale=1}:{position:V3;scale?:number}) {return <group position={position} scale={scale}><Cylinder position={[0,.22,0]} size={[.25,.19,.44]} color="#c1b298"/><Cylinder position={[0,.7,0]} size={[.035,.04,.7]} color="#625745"/>{[[-.18,.9,0],[.2,1.1,.1],[-.05,1.3,-.06],[.14,.8,-.12]].map((p,i)=><mesh key={i} position={p as V3} scale={[.3,.42,.24]} rotation={[0,i,.3]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={i%2 ? "#427953" : "#65916b"} roughness={.9}/></mesh>)}</group>;}
function Monitor({position,active=false,kind="code"}:{position:V3;active?:boolean;kind?:string}) {
  const texture=useMemo(()=>{const c=document.createElement("canvas");c.width=256;c.height=160;const x=c.getContext("2d")!;x.fillStyle="#1e3530";x.fillRect(0,0,256,160);x.fillStyle="#445b51";x.fillRect(0,0,256,16);["#c0cbaa","#729b91","#bfad79","#8aa4b5","#82a98d"].forEach((color,i)=>{x.fillStyle=color;if(kind==="chart"){x.fillRect(35+i*40,130-i*16,24,20+i*16);}else {x.fillRect(20+(i%2)*12,38+i*20,70+(i%3)*32,4);x.fillStyle="#4e6c5d";x.fillRect(120,38+i*20,30+(i%2)*25,4);}});return new THREE.CanvasTexture(c);},[kind]);
  return <group position={position}><Box position={[0,-.38,.05]} size={[.08,.45,.08]} color="#3e4842"/><Box position={[0,-.59,.12]} size={[.45,.04,.28]} color="#3e4842"/><RoundedBox args={[1.05,.68,.08]} radius={.025} castShadow><meshStandardMaterial color="#283b33"/></RoundedBox><mesh position={[0,0,.045]}><planeGeometry args={[.96,.57]}/><meshStandardMaterial map={texture} emissive={active ? "#b5f4c3" : "#526d58"} emissiveIntensity={active ? .8 : .15}/></mesh></group>;
}
function Avatar({color,active=false}:{color:string;active?:boolean}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({clock})=>{if(group.current && active) group.current.rotation.z=Math.sin(clock.elapsedTime*4)*.025;});
  return <group ref={group} position={[0,.73,1.05]}><RoundedBox args={[.5,.58,.4]} radius={.14} position={[0,.45,0]} castShadow><meshStandardMaterial color={color}/></RoundedBox><mesh position={[0,.98,0]} castShadow><sphereGeometry args={[.24,16,16]}/><meshStandardMaterial color="#dec5a6"/></mesh><mesh position={[0,1.06,-.015]} castShadow><sphereGeometry args={[.245,16,12,0,Math.PI*2,0,Math.PI*.46]}/><meshStandardMaterial color="#38453c"/></mesh><Box position={[-.19,.31,.3]} size={[.15,.14,.5]} rotation={[-.3,0,.12]} color={color}/><Box position={[.19,.31,.3]} size={[.15,.14,.5]} rotation={[-.3,0,-.12]} color={color}/><Box position={[-.13,-.04,.17]} size={[.18,.32,.32]} color="#455a50"/><Box position={[.13,-.04,.17]} size={[.18,.32,.32]} color="#455a50"/></group>;
}
function Desk({position,agent,color,double=false,active,onSelect,rotation=0}:{position:V3;agent:AgentId;color:string;double?:boolean;active:boolean;onSelect:(id:AgentId)=>void;rotation?:number}) {
  const router=useRouter();
  return <group position={position} rotation={[0,rotation,0]} onClick={e=>{e.stopPropagation();onSelect(agent);}} onDoubleClick={e=>{e.stopPropagation();router.push(`/ai/${agent}`);}} onPointerOver={e=>{e.stopPropagation();document.body.style.cursor="pointer";}} onPointerOut={()=>{document.body.style.cursor="auto";}}>
    <RoundedBox args={[2.5,.12,1.2]} radius={.05} position={[0,1.22,0]} castShadow receiveShadow><meshStandardMaterial color="#c6aa85"/></RoundedBox>
    {[-1.03,1.03].map(x=><Box key={x} position={[x,.63,0]} size={[.08,1.15,.92]} color="#48584a"/>)}
    <Monitor position={[double ? -.57 : 0,1.85,-.32]} active={active} kind={agent==="growth" ? "chart" : "code"}/>{double && <Monitor position={[.57,1.85,-.32]} active={active}/>}
    <Box position={[0,1.3,.25]} size={[.62,.025,.23]} color="#e8e8dd"/><Box position={[.6,1.3,.3]} size={[.1,.04,.14]} color="#e8e8dd"/>
    <Cylinder position={[-.95,1.43,.25]} size={[.1,.08,.24]} color="#f1e9d6"/>
    <RoundedBox args={[.66,.65,.14]} radius={.1} position={[0,1.07,1.32]} castShadow><meshStandardMaterial color="#747f69"/></RoundedBox><Box position={[0,.67,1.09]} size={[.65,.15,.65]} color="#747f69"/><Cylinder position={[0,.3,1.1]} size={[.04,.04,.6]} color="#4e574d"/>
    <Avatar color={color} active={active}/>
    {active && <mesh position={[0,2.55,0]}><sphereGeometry args={[.075,12,12]}/><meshBasicMaterial color="#80d49a"/></mesh>}
  </group>;
}
function Room({dark,working,onSelect}:{dark:boolean;working:AgentId[];onSelect:(id:AgentId)=>void}) {return <group position={[0,-.4,0]}>
  <RoundedBox args={[11.5,.24,8.8]} radius={.1} position={[0,-.14,0]} receiveShadow><meshStandardMaterial color={dark ? "#8d806b" : "#d9c7ad"}/></RoundedBox>
  {Array.from({length:19},(_,i)=><Box key={i} position={[-5.4+i*.6,.003,0]} size={[.012,.01,8.5]} color="#c7b79e"/>)}
  <Box position={[0,1.45,-4.28]} size={[11.5,2.9,.16]} color={dark ? "#203a2c" : "#e6e3d7"}/>
  <Box position={[-5.63,1.45,0]} size={[.16,2.9,8.7]} color={dark ? "#283d32" : "#dfded2"}/>
  <Box position={[.3,1.5,-4.17]} size={[4.25,2.22,.08]} color="#335443"/>
  <Label text="HOESCODES STUDIO" position={[.3,2.02,-4.11]} width={3.6} height={.65} fontSize={45}/>
  <Label text="BUILD. LEARN. SHIP. GROW." position={[.3,1.58,-4.1]} width={2.8} height={.32} fontSize={24} color="#b9c9af"/>
  <Box position={[-3.65,1.92,-4.16]} size={[2.35,1.48,.04]} color="#819f8e"/>
  <Box position={[-3.65,1.92,-4.1]} size={[2.18,1.3,.02]} color={dark ? "#506858" : "#d6e3d8"}/>
  <Box position={[-3.65,1.92,-4.06]} size={[.06,1.3,.04]} color="#89987d"/><Box position={[-3.65,1.92,-4.06]} size={[2.18,.06,.04]} color="#89987d"/>
  <Plant position={[-4.76,0,-3.5]} scale={1.2}/><Plant position={[4.6,0,-3.5]} scale={1.2}/><Plant position={[4.9,0,3.3]} scale={.95}/>
  <Box position={[3.8,1.77,-4.12]} size={[1.6,1.5,.05]} color="#b5b89e"/>
  <Box position={[3.8,1.77,-4.075]} size={[1.46,1.36,.03]} color="#f0eee3"/>
  {[0,1,2,3,4,5].map(i=><Box key={i} position={[3.42+(i%3)*.38,2.05-Math.floor(i/3)*.42,-4.04]} size={[.27,.28,.015]} color={["#afbc98","#d6be8e","#b8c7b5"][i%3]}/>)}
  <Box position={[-5.37,.85,2.25]} size={[.38,1.7,2.5]} color="#5d6e56"/>
  {[.27,.86,1.4].map((y,i)=><group key={y}><Box position={[-5.12,y,2.25]} size={[.45,.08,2.45]} color="#9f997d"/>{Array.from({length:5},(_,j)=><Box key={j} position={[-5.04,y+.22,1.4+j*.23]} size={[.26,.35,.16]} color={["#c9ba9b","#83917c","#a09c82","#d8cbae"][j%4]}/>)}{i===2 && <Plant position={[-5.1,y+.07,3.07]} scale={.35}/>}</group>)}
  <Box position={[-1.1,.012,1.6]} size={[5.9,.025,3.95]} color={dark ? "#52614b" : "#b8c1a4"}/>
  <Desk position={[-3.25,0,-1.8]} agent="engineer" color="#6f8da2" double active={working.includes("engineer")} onSelect={onSelect}/>
  <Desk position={[.2,0,-2.2]} agent="research" color="#bd9c67" active={working.includes("research")} onSelect={onSelect}/>
  <Desk position={[3.5,0,-.65]} agent="growth" color="#aa8193" active={working.includes("growth")} onSelect={onSelect}/>
  <Desk position={[-.75,0,1.2]} agent="chief" color="#498367" double active={working.includes("chief")} onSelect={onSelect}/>
  <Box position={[-3.75,.32,2.9]} size={[1.6,.6,.8]} color="#d7d6bf"/><RoundedBox args={[1.62,.65,.25]} radius={.08} position={[-3.75,.72,3.23]} castShadow><meshStandardMaterial color="#d7d6bf"/></RoundedBox>
  <Cylinder position={[-3.6,.4,1.65]} size={[.55,.55,.07]} color="#bfa98a"/><Cylinder position={[-3.6,.2,1.65]} size={[.09,.14,.4]} color="#465d49"/>
  <Box position={[-3.64,.45,1.63]} size={[.42,.045,.28]} color="#e9e5d4"/>
  <Box position={[-4.73,.62,-.62]} size={[.6,1.22,.62]} color="#52604f"/>{[.2,.45,.7,.95].map(y=><group key={y}><Box position={[-4.73,y,-.29]} size={[.47,.1,.025]} color="#283d30"/><mesh position={[-4.55,y,-.27]}><sphereGeometry args={[.015,6,6]}/><meshBasicMaterial color="#99c99f"/></mesh></group>)}
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.29,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color={dark ? "#1e2c24" : "#efefe7"}/></mesh>
</group>;}
export default function OfficeScene({dark,working,onSelect}:{dark:boolean;working:AgentId[];onSelect:(id:AgentId)=>void}) {
  return <Canvas shadows orthographic camera={{position:[13,12,15],zoom:35,near:.1,far:100}} dpr={[1,1.5]} frameloop={working.length ? "always" : "demand"} gl={{antialias:true,alpha:true,powerPreference:"low-power"}}>
    <color attach="background" args={[dark ? "#1e2c24" : "#efefe7"]}/><ambientLight intensity={dark ? 1 : 1.5}/><directionalLight position={[3,10,6]} intensity={dark ? 2 : 3} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-normalBias={.05}/><directionalLight position={[-6,4,-5]} intensity={.6} color={dark ? "#e0cba6" : "#ffffff"}/>
    <Room dark={dark} working={working} onSelect={onSelect}/><OrbitControls makeDefault enablePan={false} minZoom={28} maxZoom={70} minPolarAngle={Math.PI/5} maxPolarAngle={Math.PI/2.8} minAzimuthAngle={.15} maxAzimuthAngle={1.3} target={[0,.55,0]}/>
  </Canvas>;
}
