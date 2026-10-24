"use client";

import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Boiler, SteamPipes } from "./Boiler";
import { FactoryEnvironment } from "./FactoryEnvironment";
import { Flywheel, PistonMechanism, type EngineMotion } from "./SteamEngine";
import { TextileMachine } from "./TextileMachine";
import PowerTransmission from "./PowerTransmission";
import { COMPONENT_POSITIONS, type ComponentId, type FactorySceneProps, type SceneVector } from "./scene-types";
import { ASSEMBLY_PARTS } from "@/lib/revo/assembly";
import { AssemblyConnections, AssemblyPiece, AssemblyProjector, AssemblySockets, type AssemblyMarkers } from "./AssemblyScene";
import { CoalFeeding, ResourceContext, ResourceProjector, WaterSupply, type ResourceMarkers } from "./ResourceFilling";

export type { ComponentId, FactorySceneProps } from "./scene-types";

const COMPONENT_NAMES: Record<ComponentId, string> = {
  boiler: "Ketel uap", flywheel: "Roda gila", piston: "Piston", pipe: "Pipa uap", textile: "Mesin tekstil",
};

const HOTSPOTS: { id: ComponentId; position: SceneVector }[] = [
  { id: "boiler", position: [-3.65, 2.3, 0.95] },
  { id: "flywheel", position: [-0.17, 2.49, 1.1] },
  { id: "piston", position: [-2.4, 1.25, 2.03] },
  { id: "pipe", position: [-1.85, 3.15, -0.55] },
  { id: "textile", position: [3.29, 2.28, 0.18] },
];

type HotspotElements = RefObject<Record<ComponentId, HTMLButtonElement | null>>;

// Keep labels in the page's React root. Separate DOM roots inside the R3F tree
// cannot be unmounted synchronously during React 19 Strict Mode reconciliation.
function HotspotProjector({ elements }: { elements: HotspotElements }) {
  const projected = useRef(HOTSPOTS.map((hotspot) => ({ ...hotspot, vector: new THREE.Vector3(), x: 0, y: 0, transform: "" })));
  useFrame(({ camera, size }) => {
    projected.current.forEach((hotspot, index) => {
      const button = elements.current[hotspot.id];
      if (!button) return;
      hotspot.vector.set(...hotspot.position).project(camera);
      hotspot.x = THREE.MathUtils.clamp((hotspot.vector.x + 1) * size.width / 2, 24, size.width - 24);
      hotspot.y = THREE.MathUtils.clamp((1 - hotspot.vector.y) * size.height / 2, 75, size.height - 60);
      // Preserve a usable target when orbiting or zooming projects labels together.
      for (let previous = 0; previous < index; previous++) {
        const other = projected.current[previous];
        if (Math.hypot(hotspot.x - other.x, hotspot.y - other.y) < 43) {
          hotspot.y = other.y + 43 < size.height - 60 ? other.y + 43 : other.y - 43;
        }
      }
      const transform = `translate3d(${Math.round(hotspot.x)}px, ${Math.round(hotspot.y)}px, 0) translate(-50%, -50%)`;
      if (transform !== hotspot.transform) {
        button.style.transform = transform;
        button.style.visibility = "visible";
        hotspot.transform = transform;
      }
    });
  });
  return null;
}

function TransmissionHotspotProjector({ element }: { element: RefObject<HTMLButtonElement | null> }) {
  const point = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    const button = element.current;
    if (!button) return;
    point.current.set(0.8, 3.16, -1.1).project(camera);
    const x = THREE.MathUtils.clamp((point.current.x + 1) * size.width / 2, 30, size.width - 30);
    const y = THREE.MathUtils.clamp((1 - point.current.y) * size.height / 2, 90, size.height - 55);
    button.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`;
    button.style.visibility = "visible";
  });
  return null;
}

function Inspectable({ id, selected, highlighted, onSelect, children }: {
  id: ComponentId; selected: ComponentId | null; highlighted: ComponentId | null; onSelect: FactorySceneProps["onSelect"]; children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const active = selected === id;
  const highlight = hovered || highlighted === id;
  useEffect(() => {
    group.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: THREE.Material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        if (!material.userData.originalEmissive) {
          material.userData.originalEmissive = material.emissive.clone();
          material.userData.originalEmissiveIntensity = material.emissiveIntensity;
        }
        if (highlight || active) {
          material.emissive.set("#d8bc49");
          material.emissiveIntensity = highlight ? 0.14 : 0.07;
        } else {
          material.emissive.copy(material.userData.originalEmissive);
          material.emissiveIntensity = material.userData.originalEmissiveIntensity;
        }
      });
    });
  }, [active, highlight]);
  return <group ref={group}
      onClick={(event) => { if (event.delta > 4) return; event.stopPropagation(); onSelect(id); }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}>
      {children}
  </group>;
}

function Steam({ heat, pressure, reducedMotion, animationActive }: Pick<FactorySceneProps, "heat" | "pressure" | "reducedMotion" | "animationActive">) {
  const cloud = useRef<THREE.Group>(null);
  const exhaust = useRef<THREE.Group>(null);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (animationActive) time.current += Math.min(delta, 0.05);
    const intensity = Math.max(0, (heat - 18) / 82);
    cloud.current?.children.forEach((object, i) => {
      const mesh = object as THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
      const progress = ((reducedMotion ? i * 0.13 : time.current * (0.13 + intensity * 0.12) + i * 0.13) % 1);
      mesh.position.set(Math.sin(progress * 4 + i) * 0.13 + progress * 0.38, progress * 1.35, Math.cos(progress * 3 + i) * 0.08);
      mesh.scale.setScalar(0.1 + progress * 0.23);
      mesh.material.opacity = Math.sin(progress * Math.PI) * intensity * 0.22;
    });
    exhaust.current?.children.forEach((object, i) => {
      const mesh = object as THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
      const progress = ((reducedMotion ? i * 0.21 : time.current * 0.7 + i * 0.21) % 1);
      mesh.position.set(progress * 0.32, progress * 0.52, 0);
      mesh.scale.setScalar(0.055 + progress * 0.12);
      mesh.material.opacity = Math.sin(progress * Math.PI) * (pressure / 100) * 0.24;
    });
  });
  return <group>
    <group ref={cloud} position={[-4.1, 4.18, -1.75]}>{Array.from({ length: 7 }, (_, i) => <mesh key={i}>
      <sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#f5f1df" transparent opacity={0} depthWrite={false} roughness={1} />
    </mesh>)}</group>
    <group ref={exhaust} position={[-1.95, 2.93, -0.55]}>{Array.from({ length: 4 }, (_, i) => <mesh key={i}>
      <sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#faf7eb" transparent opacity={0} depthWrite={false} roughness={1} />
    </mesh>)}</group>
  </group>;
}

function CameraController({ selected, cameraCommand, reducedMotion, assembly }: Pick<FactorySceneProps, "selected" | "cameraCommand" | "reducedMotion" | "assembly">) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const target = useRef(new THREE.Vector3(0, 1.12, 0));
  const position = useRef(new THREE.Vector3(10.8, 8.6, 12));
  const zoom = useRef(45);
  const transition = useRef(true);
  const commandSeen = useRef(-1);
  const defaultZoom = Math.min(size.width / (assembly ? 16 : 14.6), size.height / (assembly ? 13 : 10.3));
  useEffect(() => {
    const orbit = camera as THREE.OrthographicCamera;
    orbit.zoom = defaultZoom;
    zoom.current = defaultZoom;
    orbit.updateProjectionMatrix();
  }, [camera, defaultZoom]);
  useEffect(() => {
    if (!selected || assembly) return;
    target.current.set(...COMPONENT_POSITIONS[selected]);
    position.current.copy(target.current).add(new THREE.Vector3(9.4, 7.2, 11.3));
    zoom.current = defaultZoom * 1.33;
    transition.current = true;
  }, [selected, defaultZoom, assembly]);
  useEffect(() => {
    if (commandSeen.current === cameraCommand.serial) return;
    commandSeen.current = cameraCommand.serial;
    if (cameraCommand.kind === "reset") {
      target.current.set(0, 1.12, assembly ? 1.4 : 0);
      position.current.set(10.8, 8.6, assembly ? 13.4 : 12);
      zoom.current = defaultZoom;
    } else if (cameraCommand.kind === "focus" && selected) {
      target.current.set(...COMPONENT_POSITIONS[selected]);
      position.current.copy(target.current).add(new THREE.Vector3(9.4, 7.2, 11.3));
      zoom.current = defaultZoom * 1.45;
    } else {
      target.current.copy(controls.current?.target ?? target.current);
      position.current.copy(camera.position);
      zoom.current = THREE.MathUtils.clamp(camera.zoom * (cameraCommand.kind === "zoom-in" ? 1.18 : 1 / 1.18), defaultZoom * 0.7, defaultZoom * 2.6);
    }
    transition.current = true;
  }, [cameraCommand, camera, defaultZoom, selected, assembly]);
  useFrame((_, delta) => {
    if (!transition.current || !controls.current) return;
    const orbit = camera as THREE.OrthographicCamera;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 5);
    orbit.position.lerp(position.current, blend);
    controls.current.target.lerp(target.current, blend);
    orbit.zoom = THREE.MathUtils.lerp(orbit.zoom, zoom.current, blend);
    orbit.updateProjectionMatrix();
    controls.current.update();
    if (orbit.position.distanceTo(position.current) < 0.008 && Math.abs(orbit.zoom - zoom.current) < 0.03) transition.current = false;
  });
  return <OrbitControls ref={controls} makeDefault target={[0, 1.12, 0]} enablePan={false} minZoom={defaultZoom * 0.7} maxZoom={defaultZoom * 2.6} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.18} enableDamping={!reducedMotion} dampingFactor={0.09} rotateSpeed={0.6} onStart={() => { transition.current = false; }} />;
}

function Diorama(props: FactorySceneProps & { hotspotElements: HotspotElements; transmissionElement: RefObject<HTMLButtonElement | null>; resourceElements: ResourceMarkers; highlighted: ComponentId | null; assemblyElements: AssemblyMarkers; candidate: ComponentId | null; onCandidate: (id: ComponentId | null) => void; onDragging: (dragging: boolean) => void }) {
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null;
  const motion = useRef<EngineMotion>({ angle: 0, velocity: 0 });
  useFrame((_, delta) => {
    if (props.assembly) { motion.current.velocity = 0; return; }
    if (!props.animationActive) return;
    const safeDelta = Math.min(delta, 0.05);
    const wanted = props.running && props.safety !== "danger" ? props.speed / 100 * 5 : 0;
    motion.current.velocity = THREE.MathUtils.damp(motion.current.velocity, wanted, 2.5, safeDelta);
    motion.current.angle += motion.current.velocity * safeDelta;
    if (motion.current.angle > Math.PI * 2000) motion.current.angle %= Math.PI * 2;
  });
  const interactions = { selected: props.selected, highlighted: props.highlighted, onSelect: props.onSelect };
  function dragging(value: boolean) {
    if (controls) controls.enabled = !value && (!props.assembly || props.assembly.enabled);
    props.onDragging(value);
  }
  function piece(id: ComponentId, children: ReactNode) {
    return props.assembly ? <AssemblyPiece key={id} id={id} assembly={props.assembly} reducedMotion={props.reducedMotion} onDragging={dragging} onCandidate={props.onCandidate}>{children}</AssemblyPiece>
      : <Inspectable key={id} id={id} {...interactions}>{children}</Inspectable>;
  }
  return <>
    <color attach="background" args={["#e7e3d8"]} />
    <ambientLight intensity={1.15} color="#fff8e7" />
    <hemisphereLight args={["#eef4ff", "#91856e", 1.15]} />
    <directionalLight position={[-3, 10, 7]} intensity={3.25} color="#fff5da" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0002} shadow-normalBias={0.035} />
    <directionalLight position={[7, 5, -4]} intensity={1.7} color="#e0e8f3" />
    <mesh position={[0, -0.421, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} /><meshStandardMaterial color="#e7e3d8" roughness={1} />
    </mesh>
    <FactoryEnvironment onCoalSelect={props.resources?.enabled ? () => props.resources?.onSelect("coal") : undefined} />
    {!props.assembly && <WaterSupply resources={props.resources} reducedMotion={props.reducedMotion} />}
    {props.resources && <><CoalFeeding filling={props.resources.filling} reducedMotion={props.reducedMotion} /><ResourceProjector elements={props.resourceElements} /></>}
    {piece("boiler", <Boiler heat={props.heat} pressure={props.pressure} water={props.water} safety={props.safety} filling={props.resources?.filling} reducedMotion={props.reducedMotion} />)}
    {piece("flywheel", <Flywheel motion={motion} />)}
    {piece("piston", <PistonMechanism motion={motion} />)}
    {piece("pipe", <SteamPipes />)}
    {piece("textile", <TextileMachine motion={motion} />)}
    {(!props.assembly || props.assembly.state.placed.includes("flywheel") && props.assembly.state.placed.includes("textile")) && <PowerTransmission motion={motion} active={props.animationActive && !props.assembly} />}
    {props.assembly ? <>
      <AssemblySockets assembly={props.assembly} candidate={props.candidate} />
      <AssemblyConnections state={props.assembly.state} animate={props.assembly.enabled && !props.reducedMotion} />
      <AssemblyProjector elements={props.assemblyElements} state={props.assembly.state} />
    </> : <><Steam heat={props.heat} pressure={props.pressure} reducedMotion={props.reducedMotion} animationActive={props.animationActive} /><HotspotProjector elements={props.hotspotElements} /><TransmissionHotspotProjector element={props.transmissionElement} /></>}
    <CameraController selected={props.selected} cameraCommand={props.cameraCommand} reducedMotion={props.reducedMotion} assembly={props.assembly} />
  </>;
}

function SceneFallback() {
  return <div role="status" style={{ height: "100%", minHeight: 300, display: "grid", alignContent: "center", justifyItems: "center", padding: 32, textAlign: "center", color: "#394a3b", background: "#e7e3d8" }}>
    <div aria-hidden="true" style={{ fontSize: 64, lineHeight: 1.2 }}>⚙</div>
    <strong style={{ marginTop: 16 }}>Tampilan 3D belum tersedia</strong>
    <p style={{ maxWidth: 320, fontSize: 13, lineHeight: 1.7 }}>Aktifkan akselerasi grafis atau gunakan peramban lain. Kamu tetap dapat menjelajahi komponen dan menjalankan simulasi melalui panel kontrol.</p>
  </div>;
}

function AssemblyControlsGuard({ dragging, enabled, onCancel }: { dragging: boolean; enabled: boolean; onCancel: (value: boolean) => void }) {
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null;
  useEffect(() => {
    if (controls) controls.enabled = enabled && !dragging;
  }, [controls, dragging, enabled]);
  useEffect(() => () => {
    if (controls) controls.enabled = true;
    onCancel(false);
  }, [controls, onCancel]);
  return null;
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <SceneFallback /> : this.props.children; }
}

export default function FactoryScene(props: FactorySceneProps) {
  const [contextLost, setContextLost] = useState(false);
  const [highlighted, setHighlighted] = useState<ComponentId | null>(null);
  const [dragging, setDragging] = useState(false);
  const [candidate, setCandidate] = useState<ComponentId | null>(null);
  const assemblyElements = useRef<Record<string, HTMLElement | null>>({});
  const resourceElements = useRef<Record<"coal" | "water", HTMLButtonElement | null>>({ coal: null, water: null });
  const hotspotElements = useRef<Record<ComponentId, HTMLButtonElement | null>>({ boiler: null, flywheel: null, piston: null, pipe: null, textile: null });
  const transmissionElement = useRef<HTMLButtonElement | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  if (contextLost) return <SceneFallback />;
  return <SceneErrorBoundary>
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
    <Canvas shadows orthographic camera={{ position: [10.8, 8.6, 12], zoom: 45, near: 0.1, far: 100 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} fallback={<SceneFallback />} style={{ touchAction: "none" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#e7e3d8");
        const handleLoss = (event: Event) => { event.preventDefault(); setContextLost(true); };
        gl.domElement.addEventListener("webglcontextlost", handleLoss);
        cleanup.current = () => gl.domElement.removeEventListener("webglcontextlost", handleLoss);
      }}>
      <Diorama {...props} hotspotElements={hotspotElements} transmissionElement={transmissionElement} resourceElements={resourceElements} highlighted={highlighted} assemblyElements={assemblyElements} candidate={candidate} onCandidate={setCandidate} onDragging={setDragging} />
      {props.assembly && <AssemblyControlsGuard dragging={dragging} enabled={props.assembly.enabled} onCancel={setDragging} />}
    </Canvas>
    {props.assembly ? <div className="revo-assembly-markers" role="group" aria-label="Sambungan perakitan 3D">
      {ASSEMBLY_PARTS.map((part, index) => <span key={part.id}>
        <button ref={element => { assemblyElements.current[`socket-${part.id}`] = element; }} className="revo-assembly-socket" type="button" data-socket={part.id} aria-label={`Sambungan ${part.socket}`} aria-pressed={props.assembly?.state.socket === part.id} disabled={!props.assembly?.enabled || props.assembly.state.placed.includes(part.id)} onClick={() => props.assembly?.onAction({ type: "socket", id: part.id })}>{index + 1}</button>
        <span ref={element => { assemblyElements.current[`tray-${part.id}`] = element; }} className="revo-assembly-tray-label" data-tray={part.id}>{part.name}</span>
      </span>)}
    </div> : <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} role="group" aria-label="Penanda eksplorasi mesin">
      {HOTSPOTS.map(({ id }, index) => <button key={id} ref={(element) => { hotspotElements.current[id] = element; }} type="button"
        className={`revo-scene-hotspot${props.selected === id ? " is-active" : ""}`} aria-label={`Jelajahi ${COMPONENT_NAMES[id]}`} aria-pressed={props.selected === id} title={COMPONENT_NAMES[id]}
        onClick={() => props.onSelect(id)} onPointerEnter={() => setHighlighted(id)} onPointerLeave={() => setHighlighted(null)} onFocus={() => setHighlighted(id)} onBlur={() => setHighlighted(null)}
        style={{ position: "absolute", left: 0, top: 0, visibility: "hidden", pointerEvents: "auto", display: "grid", placeItems: "center", width: 33, height: 33, borderRadius: "50%", border: props.selected === id ? "2px solid #262e27" : "1px solid rgba(51,59,46,.2)", background: props.selected === id || highlighted === id ? "#ffe234" : "#f8f4dc", color: "#283229", fontSize: 12, fontWeight: 700, boxShadow: "0 3px 10px #30281126, 0 0 0 4px #fff7d536", cursor: "pointer", transition: "background 150ms" }}>
        {String(index + 1).padStart(2, "0")}
      </button>)}
      <button ref={transmissionElement} type="button" className="revo-scene-hotspot revo-transmission-hotspot" aria-label="Informasi Transmisi Tenaga" title="Transmisi Tenaga" onClick={props.onTransmissionInfo}
        style={{ position: "absolute", left: 0, top: 0, visibility: "hidden", pointerEvents: "auto", display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(51,59,46,.3)", background: "#dce4c6", color: "#283229", fontSize: 12, fontWeight: 700, boxShadow: "0 3px 10px #30281126, 0 0 0 4px #fff7d536", cursor: "pointer" }}>T</button>
    </div>}
    {props.resources && <>
      <div className="revo-resource-markers" role="group" aria-label="Sumber daya pabrik">
        {(["coal", "water"] as const).map(kind => <button key={kind} ref={element => { resourceElements.current[kind] = element; }} type="button" data-resource={kind} title={kind === "coal" ? "Batu bara · pilih untuk mengisi" : "Pompa air · pilih untuk mengisi"} aria-label={kind === "coal" ? "Pilih batu bara" : "Pilih pompa air"} aria-pressed={props.resources?.selected === kind} disabled={!props.resources?.enabled} onClick={() => props.resources?.onSelect(kind)}>{kind === "coal" ? "B" : "A"}</button>)}
      </div>
      <ResourceContext resources={props.resources} />
    </>}
    </div>
  </SceneErrorBoundary>;
}
