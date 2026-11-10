"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CanvasTexture, Group, Mesh, MeshStandardMaterial, OrthographicCamera, SRGBColorSpace } from "three";
import ElectricMachineDetails from "./ElectricMachineDetails";
import { Block, Cylinder, Crate, Rod } from "../ScenePrimitives";
import { PARTS, PATHS, type ElectricPartId, type PathKind } from "@/lib/revo/industry-2/content";
import { CONNECTIONS, type ConnectionId } from "@/lib/revo/industry-2/assembly";
import type { ElectricOutcome, ElectricRun } from "@/lib/revo/industry-2/experiment";

type Vec = [number, number, number];
type ExperimentView = { run: ElectricRun; outcome: ElectricOutcome; motion: boolean };
type SceneProps = {
  selected: ElectricPartId | null;
  focus?: ElectricPartId | null;
  target?: ElectricPartId | null;
  connections?: readonly ConnectionId[];
  path: PathKind | null;
  inspect: (id: ElectricPartId) => void;
  fallback: ReactNode;
  experiment?: ExperimentView;
};
const steel = "#536d66";
const brass = "#b99354";
const axisZ: Vec = [Math.PI / 2, 0, 0];
const labels: Record<ElectricPartId, Vec> = {
  supply: [-4.15, 1.76, -1.35], panel: [-2.46, 1.78, -1.35], motor: [-4.05, 1.05, 2.65],
  shaft: [-3.93, 1.01, 1.34], belt: [-2.93, 1.12, 1.04], conveyor: [2.35, 1.22, .82], stations: [3.27, 1.68, -1.48],
};

function Marker({ id, selected }: { id: ElectricPartId; selected: boolean }) {
  const texture = useMemo(() => {
    const surface = document.createElement("canvas");
    surface.width = surface.height = 96;
    const ctx = surface.getContext("2d")!;
    ctx.beginPath(); ctx.arc(48, 48, 41, 0, Math.PI * 2);
    ctx.fillStyle = selected ? "#ffe234" : "#fbf6dd"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#2a4942"; ctx.stroke();
    ctx.fillStyle = "#213a33"; ctx.font = "bold 38px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(PARTS.findIndex(part => part.id === id) + 1), 48, 50);
    const next = new CanvasTexture(surface);
    next.colorSpace = SRGBColorSpace;
    return next;
  }, [id, selected]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={labels[id]} scale={[.49, .49, .49]} renderOrder={3}>
    <spriteMaterial map={texture} depthTest={false} depthWrite={false} transparent toneMapped={false} />
  </sprite>;
}

function Part({ id, active, inspect, children }: { id: ElectricPartId; active: boolean; inspect: SceneProps["inspect"]; children: ReactNode }) {
  const group = useRef<Group>(null);
  useLayoutEffect(() => {
    group.current?.traverse(object => {
      if (object instanceof Mesh && object.material instanceof MeshStandardMaterial) {
        object.material.emissive.set("#f3ae39");
        object.material.emissiveIntensity = active ? .09 : 0;
      }
    });
  }, [active]);
  function pick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (event.delta <= 5) inspect(id);
  }
  return <group ref={group} onClick={pick}>
    {children}
    <Marker id={id} selected={active} />
  </group>;
}

function Shop() {
  return <>
    <Block position={[0, -.22, 0]} size={[11.6, .42, 6.4]} color="#718076" />
    <Block position={[0, .01, 0]} size={[11.7, .12, 6.5]} color="#a8aa96" />
    <gridHelper args={[11, 22, "#a4ad9f", "#a4ad9f"]} position={[0, .076, 0]} scale={[1, 1, .57]} />
    <Block position={[0, 1.48, -2.92]} size={[11.55, 2.95, .2]} color="#aea68d" />
    <Block position={[0, .52, -2.78]} size={[11.55, 1.02, .17]} color="#8c7660" />
    {[-4.55, -2.27, 0, 2.27, 4.55].map(x => <group key={x} position={[x, 1.97, -2.78]}>
      <Block size={[1.78, 1.28, .07]} color="#c3d9cd" metalness={0} />
      {[-.91, 0, .91].map(v => <Block key={v} position={[v, 0, .06]} size={[.065, 1.37, .05]} color="#263e39" />)}
      {[-.66, 0, .66].map(v => <Block key={v} position={[0, v, .06]} size={[1.88, .065, .05]} color="#263e39" />)}
    </group>)}
    {[-5.49, 0, 5.49].map(x => <Block key={x} position={[x, 1.58, -2.61]} size={[.16, 3.14, .23]} color="#273e39" />)}
    <Block position={[0, 3.12, -2.7]} size={[11.8, .2, .34]} color="#3c5148" />
    {[.25,.49,.73,.97].map(y => <Block key={y} position={[0,y,-2.675]} size={[11.4,.016,.016]} color="#b3a58b" metalness={0} />)}
    {[-5.49,0,5.49].map(x => <group key={x}>
      <Block position={[x,.16,-2.59]} size={[.42,.2,.48]} color="#35483e" />
      <Block position={[x,2.94,-2.5]} size={[.48,.13,.46]} color="#566254" />
    </group>)}
    <Block position={[0,-.04,3.24]} size={[11.7,.19,.08]} color="#d0b16d" />
    <Block position={[0,-.04,-3.24]} size={[11.7,.19,.08]} color="#d0b16d" />
    <Crate position={[4.85, .08, -1.62]} scale={.78} /><Crate position={[4.94, .08, -2.24]} scale={.73} />
    <Crate position={[-.72, .08, -1.97]} scale={.68} />
  </>;
}

const routes: Record<PathKind, { points: Vec[]; arrows: [Vec, Vec][] }> = {
  electrical: { points: [[-4.15,.18,-.73],[-2.48,.18,-.73],[-2.48,.18,.13],[-4.38,.18,.13],[-4.38,.18,2.37],[-4.07,.42,2.37]], arrows: [[[-3.35,.18,-.73],[1,0,0]],[[-4.38,.18,.76],[0,0,1]]] },
  mechanical: { points: [[-3.93,.76,1.87],[-3.93,.81,1.05],[-2.35,.81,1.05],[-2.35,.81,.65]], arrows: [[[-3.13,.81,1.05],[1,0,0]]] },
  material: { points: [[-2.05,1.04,.08],[4.4,1.04,.08]], arrows: [[[-1.26,1.04,.08],[1,0,0]],[[.92,1.04,.08],[1,0,0]],[[3.91,1.04,.08],[1,0,0]]] },
};

function Flows({ path }: { path: PathKind | null }) {
  return <>{(Object.keys(routes) as PathKind[]).filter(kind => !path || kind === path).map(kind => <group key={kind}>
    <Line points={routes[kind].points} color={PATHS[kind].color} lineWidth={3} dashed={kind === "electrical"} dashSize={.12} gapSize={.08} />
    {routes[kind].arrows.map(([pos, dir], i) => {
      const [x,y,z] = pos;
      const [dx,,dz] = dir;
      const wing = (side: number): Vec => [x-dx*.2+dz*.11*side,y,z-dz*.2-dx*.11*side];
      return <Line key={i} points={[wing(1), pos, wing(-1)]} color={PATHS[kind].color} lineWidth={3} />;
    })}
  </group>)}</>;
}

// One overlay per accepted functional link; the factory geometry stays mounted.
const linkPoints: Record<ConnectionId, Vec[]> = {
  E1: [[-4.15,.27,-1.05],[-4.15,.27,-.74],[-2.48,.27,-.74],[-2.48,.49,-1.17]],
  E2: [[-2.48,.49,-1.17],[-2.28,.26,-.66],[-2.28,.26,.15],[-4.56,.26,.15],[-4.56,.26,2.37],[-4.22,.51,2.37]],
  M1: [[-3.93,.98,1.89],[-3.93,.89,1.59],[-3.93,.87,1.37]],
  M2: [[-3.93,.87,1.37],[-3.93,.94,1.04],[-2.59,.94,1.04]],
  M3: [[-2.59,.94,1.04],[-2.35,.94,1.04],[-2.35,.88,.63],[-2.35,.88,.4]],
};

function AssemblyLinks({ installed, experiment }: { installed: readonly ConnectionId[]; experiment?: ExperimentView }) {
  return <>{CONNECTIONS.filter(link => installed.includes(link.id)).map(link => {
    const points = linkPoints[link.id];
    const [x,y,z] = points[points.length - 1];
    const [px,,pz] = points[points.length - 2];
    const length = Math.hypot(x - px, z - pz);
    const dx = (x - px) / length, dz = (z - pz) / length;
    const wing = (side: number): Vec => [x-dx*.16+dz*.1*side,y,z-dz*.16-dx*.1*side];
    const color = PATHS[link.kind].color;
    const energized = !experiment || (link.kind === "electrical" ? experiment.run.power && (link.id === "E1" || experiment.run.running) : experiment.outcome.driveMoving);
    return <group key={link.id}>
      <Line points={points} color={energized ? color : "#68786f"} lineWidth={energized ? 4 : 2} dashed={link.kind === "electrical"} dashSize={.14} gapSize={.075} />
      <Line points={[wing(1), [x,y,z], wing(-1)]} color={energized ? color : "#68786f"} lineWidth={energized ? 4 : 2} />
    </group>;
  })}</>;
}

function Camera({ reset, focus }: { reset: number; focus?: ElectricPartId | null }) {
  const { camera, size, invalidate } = useThree();
  const overview = Math.min(size.width / 14, size.height / 6.6);
  const target: Vec = focus ? focus === "conveyor" ? [1.1,.7,.1] : focus === "shaft" ? [-3.15,.65,1.5] : labels[focus] : [0,1.02,0];
  const zoom = focus ? overview * (focus === "conveyor" || focus === "stations" ? 1.35 : 2.05) : overview;
  const [tx,ty,tz] = target;
  useLayoutEffect(() => {
    const view = camera as OrthographicCamera;
    view.zoom = zoom;
    view.position.set(tx+7.2, ty+6.5, tz+14);
    view.lookAt(tx, ty, tz);
    view.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, reset, zoom, tx, ty, tz]);
  return <OrbitControls key={`${reset}-${focus}`} target={target} enablePan={false} enableDamping={false}
    minZoom={zoom * .78} maxZoom={zoom * 1.8} minPolarAngle={.44} maxPolarAngle={1.26} minAzimuthAngle={-.65} maxAzimuthAngle={1.22} />;
}

const experimentLinks = CONNECTIONS.map(link => link.id);
const looseExperimentLinks = experimentLinks.filter(id => id !== "M1");
const cargoStart = [-1.65, .22, 2.67, 4.01];

function ExperimentMotion({ run, outcome, motion }: ExperimentView) {
  const shaft = useRef<Group>(null);
  const pulleys = useRef<Group>(null);
  const cargo = useRef<Group>(null);
  const beltStripe = useRef<Group>(null);
  const conveyorTreads = useRef<Group>(null);
  const phase = useRef(0);
  const beltPhase = useRef(0);
  const invalidate = useThree(state => state.invalidate);
  const gl = useThree(state => state.gl);
  const rotating = motion && outcome.motor === "turning";
  useLayoutEffect(() => { invalidate(); }, [invalidate, rotating, outcome.driveMoving, run.obstruction]);
  useFrame((_, delta) => {
    // Report the rendered frame, not the earlier outer DOM state update.
    const surface = gl.domElement.closest<HTMLElement>(".electric-canvas");
    if (surface) surface.dataset.motion = rotating ? "active" : "still";
    if (!rotating) return;
    const step = Math.min(delta, .05);
    if (shaft.current) shaft.current.rotation.z -= step * 4.8;
    if (outcome.driveMoving) {
      phase.current = (phase.current + step * 1.05) % 6.4;
      beltPhase.current = (beltPhase.current + step * 1.3) % .46;
      if (pulleys.current) for (const wheel of pulleys.current.children) wheel.rotation.z -= step * 4.8;
      if (beltStripe.current) beltStripe.current.position.x = beltPhase.current;
      if (conveyorTreads.current) conveyorTreads.current.position.x = phase.current % .28;
      if (cargo.current) cargo.current.children.forEach((item, index) => {
        item.position.x = -2.05 + ((cargoStart[index] + 2.05 + phase.current) % 6.4);
      });
    }
    invalidate();
  });
  return <>
    <group ref={shaft} position={[-3.93, .62, 2.813]}>
      <Cylinder rotation={axisZ} radius={.25} length={.038} color="#314b43" />
      <Block position={[0,.11,.024]} size={[.067,.16,.03]} color="#f7d586" />
      <Block position={[.1,-.1,.024]} size={[.085,.055,.03]} color="#c1d4aa" />
    </group>
    <group ref={pulleys}>
      {[-3.93,-2.35].map(x => <group key={x} position={[x,.62,1.134]}>
        <Block position={[0,.128,0]} size={[.05,.11,.026]} color="#ffe094" />
      </group>)}
    </group>
    <group ref={beltStripe}>
      {[-3.69,-3.23,-2.77].map(x => <Block key={x} position={[x,.869,1.04]} size={[.075,.013,.14]} color="#e2b867" />)}
    </group>
    <group ref={conveyorTreads}>
      {Array.from({length:24},(_,i) => <Block key={i} position={[-2.23+i*.28,.884,.08]} size={[.012,.008,1]} color="#a0ac91" />)}
    </group>
    <group ref={cargo}>
      {cargoStart.map((x,i) => <group key={i} position={[x,0,0]}>
        <Block position={[0,.95,.09]} size={[.47,.15,.45]} color="#d2a16a" metalness={0} />
        {i > 0 && <Cylinder position={[0,1.06,.09]} radius={.143} length={.11} color="#d8c494" />}
      </group>)}
    </group>
    {run.obstruction && <group position={[2.38, 1, 0]}>
      <Block size={[.16,.33,1.36]} color="#9d382a" />
      {[-.4,0,.4].map(z => <Block key={z} position={[0,.17,z]} size={[.16,.025,.15]} color="#f6d465" />)}
    </group>}
  </>;
}

function Diorama({ selected, target, connections, path, inspect, experiment }: Omit<SceneProps, "fallback">) {
  const part = (id: ElectricPartId, children: ReactNode) => experiment ? children : <Part id={id} active={selected === id || target === id} inspect={inspect}>{children}</Part>;
  return <>
    <ambientLight intensity={1.1} color="#fff7e4" />
    <directionalLight position={[-3, 8, 6]} intensity={2.8} color="#fff0cf" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.04} />
    <directionalLight position={[4, 4, -5]} intensity={.8} color="#c6e8ef" />
    <Shop />
    <ElectricMachineDetails inspect={experiment ? undefined : inspect} />
    {part("supply", <group position={[-4.15,.08,-1.55]}>
      <Block position={[0,.11,0]} size={[1.52,.22,1.12]} color="#414d45" />
      <Block position={[0,.74,0]} size={[1.34,1.2,.9]} color={steel} />
      {[-.43,-.22,0,.22,.43].map(x => <Block key={x} position={[x,.72,.48]} size={[.075,.7,.11]} color="#2b4640" />)}
      {[-.39,.39].map(x => <Cylinder key={x} position={[x,1.37,0]} radius={.105} length={.24} color="#dbc792" />)}
    </group>)}
    {part("panel", <group position={[-2.48,.07,-1.47]}>
      <Block position={[0,.13,0]} size={[.92,.26,.7]} color="#4c5650" />
      <Block position={[0,.81,0]} size={[.72,1.32,.49]} color="#697c6a" />
      <Block position={[0,1,.27]} size={[.58,.68,.065]} color="#d5b772" />
      <Block position={[0,1.04,.34]} size={[.1,.24,.065]} color="#354b41" />
      <Block position={[0,.7,.32]} size={[.33,.06,.03]} color="#897349" />
      {experiment && <Block position={[.15,1.18,.34]} size={[.13,.1,.05]} color={experiment.run.power ? "#4a8e65" : "#9f4634"} />}
    </group>)}
    {part("motor", <group position={[-3.93,.62,2.18]}>
      <Block position={[0,-.42,0]} size={[1.35,.22,1.48]} color="#4d6156" />
      <Cylinder rotation={axisZ} radius={.37} length={1} color="#3c695e" />
      {[-.44,-.31,-.18,-.05,.08,.21,.34,.46].map(z => <Cylinder key={z} rotation={axisZ} radius={.4} length={.045} position={[0,0,z]} color="#6e8c79" />)}
      <Cylinder rotation={axisZ} position={[0,0,.55]} radius={.29} length={.13} color={steel} />
      <Block position={[-.3,.22,.1]} size={[.24,.25,.4]} color="#729180" />
    </group>)}
    {part("shaft", <>
      <Rod start={[-3.93,.62,1.7]} end={[-3.93,.62,experiment?.run.transmission === false ? 1.55 : .97]} radius={.075} color="#756749" />
      {experiment?.run.transmission === false && <Rod start={[-3.93,.62,1.23]} end={[-3.93,.62,.97]} radius={.075} color="#756749" />}
      <Cylinder rotation={axisZ} position={[-3.93,.62,experiment?.run.transmission === false ? 1.17 : 1.37]} radius={.135} length={.2} color={brass} />
    </>)}
    {part("belt", <>
      {[-3.93,-2.35].map(x => <Cylinder key={x} rotation={axisZ} position={[x,.62,1.04]} radius={.23} length={.16} color={brass} />)}
      {[.4,.84].map(y => <Block key={y} position={[-3.14,y,1.04]} size={[1.57,.052,.16]} color="#775231" />)}
      <Rod start={[-2.35,.62,1.12]} end={[-2.35,.62,.56]} radius={.072} color="#736b50" />
    </>)}
    {part("conveyor", <>
      <Block position={[1.04,.61,.08]} size={[6.96,.44,1.15]} color="#394b46" />
      {[.65,-.49].map(z => <Block key={z} position={[1.04,.79,z]} size={[7.09,.13,.1]} color={brass} />)}
      {Array.from({length: 25}, (_,i) => <Block key={i} position={[-2.33+i*.28,.847,.08]} size={[.251,.065,1.04]} color={i%2 ? "#5e7770" : "#697f74"} />)}
      {[-2.32,0,2.17,4.43].map(x => <group key={x}>
        {[-.4,.57].map(z => <Block key={z} position={[x,.32,z]} size={[.13,.57,.13]} color={steel} />)}
      </group>)}
      {!experiment && cargoStart.map((x,i) => <group key={x}>
        <Block position={[x,.93,.09]} size={[.47,.14,.45]} color="#d2a16a" metalness={0} />
        {i > 0 && <Cylinder position={[x,1.04,.09]} radius={.143} length={.11} color="#d8c494" />}
      </group>)}
    </>)}
    {part("stations", <>{[.22,2.67].map((x,i) => <group key={x} position={[x,.08,-1.25]}>
      <Block position={[0,.89,0]} size={[1.34,.12,.74]} color="#a38259" metalness={0} />
      {[-.56,.56].map(a => <Block key={a} position={[a,.44,0]} size={[.11,.87,.61]} color={steel} />)}
      <Block position={[-.29,1.02,0]} size={[.45,.16,.34]} color={i ? "#586d63" : "#b38a55"} />
      <Rod start={[.47,.92,-.22]} end={[.47,1.51,-.22]} radius={.037} />
      <Block position={[.29,1.49,-.22]} size={[.42,.08,.25]} color="#d6bc7d" />
    </group>)}</>)}
    {experiment ? <>
      <AssemblyLinks installed={experiment.run.transmission ? experimentLinks : looseExperimentLinks} experiment={experiment} />
      <ExperimentMotion {...experiment} />
    </> : connections ? <AssemblyLinks installed={connections} /> : <Flows path={path} />}
  </>;
}

class ElectricSceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function ElectricScene({ fallback, reset, ...view }: SceneProps & { reset: number }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const removeListener = useRef<(() => void) | null>(null);
  useEffect(() => {
    try {
      const context = document.createElement("canvas").getContext("webgl2");
      setAvailable(Boolean(context));
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch { setAvailable(false); }
    return () => removeListener.current?.();
  }, []);
  if (available === null) return <p className="electric-scene-status" role="status">Memuat diorama…</p>;
  if (!available) return fallback;
  return <ElectricSceneBoundary fallback={fallback}>
    <Canvas shadows orthographic camera={{ position: [9.4,8,13.5], near: .1, far: 70 }} dpr={[1, 1.45]} frameloop="demand"
      gl={{ antialias: true, alpha: true }} fallback={fallback} style={{ touchAction: "none" }}
      onCreated={({ gl }) => {
        const lost = (event: Event) => {
          event.preventDefault();
          removeListener.current?.();
          removeListener.current = null;
          setAvailable(false);
        };
        gl.domElement.addEventListener("webglcontextlost", lost);
        removeListener.current = () => gl.domElement.removeEventListener("webglcontextlost", lost);
      }}>
      <Camera reset={reset} focus={view.focus} />
      <Diorama {...view} />
    </Canvas>
  </ElectricSceneBoundary>;
}
