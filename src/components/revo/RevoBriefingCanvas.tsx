"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box3, MathUtils, Spherical, Vector3, type Group, type OrthographicCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SteamPreviewModel } from "./FactoryScene";
import { ElectricPreviewModel } from "./industry-2/ElectricScene";
import type { BriefingEra, PreviewCameraCommand } from "./RevoBriefingPreview";

const minPolar = .9;
const maxPolar = 1.36;
const overview = new Vector3(12, 9.6, 16).normalize().multiplyScalar(25);
const cameraOptions = { position: [12, 9.6, 16] as [number, number, number], near: .1, far: 90 };

function CameraRig({ era, command, visible }: { era: BriefingEra; command: PreviewCameraCommand; visible: boolean }) {
  const model = useRef<Group>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const framing = useRef({ fit: 0, overviewZoom: 1 });
  const appliedCommand = useRef(0);
  const camera = useThree(state => state.camera) as OrthographicCamera;
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);

  useLayoutEffect(() => {
    if (!model.current || !controls.current || !size.width || !size.height) return;
    const box = new Box3().setFromObject(model.current);
    const half = box.getSize(new Vector3()).multiplyScalar(.5);
    if (box.isEmpty()) return;
    const orbit = controls.current;
    const horizontal = Math.hypot(half.x, half.z);
    // Bound the projected box for every allowed azimuth and elevation, including
    // diagonal views. Zoom cannot cut off a corner at the maximum elevation.
    const angle = MathUtils.clamp(Math.atan2(horizontal, half.y), Math.PI / 2 - maxPolar, Math.PI / 2 - minPolar);
    const vertical = half.y * Math.cos(angle) + horizontal * Math.sin(angle);
    const fit = Math.min(size.width / (2 * horizontal), size.height / (2 * vertical)) * .94;
    const relative = framing.current.fit ? camera.zoom / framing.current.fit : .9;
    box.getCenter(orbit.target);
    if (!framing.current.fit) camera.position.copy(orbit.target).add(overview);
    framing.current = { fit, overviewZoom: fit * .9 };
    orbit.minZoom = fit * .59;
    orbit.maxZoom = fit;
    camera.zoom = MathUtils.clamp(fit * relative, orbit.minZoom, orbit.maxZoom);
    camera.updateProjectionMatrix();
    orbit.update();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || !framing.current.fit || command.id === appliedCommand.current) return;
    appliedCommand.current = command.id;
    if (command.action === "reset") {
      camera.position.copy(orbit.target).add(overview);
      camera.zoom = framing.current.overviewZoom;
    } else if (command.action === "left" || command.action === "right") {
      const position = new Spherical().setFromVector3(camera.position.clone().sub(orbit.target));
      position.theta += command.action === "left" ? -.24 : .24;
      camera.position.setFromSpherical(position).add(orbit.target);
    } else {
      const multiplier = command.action === "zoom-in" ? 1.13 : 1 / 1.13;
      camera.zoom = MathUtils.clamp(camera.zoom * multiplier, orbit.minZoom, orbit.maxZoom);
    }
    camera.updateProjectionMatrix();
    orbit.update();
    invalidate();
  }, [camera, command, invalidate]);

  useEffect(() => { if (visible) invalidate(); }, [visible, invalidate]);

  return <>
    <group ref={model}>{era === "industry-1" ? <SteamPreviewModel /> : <ElectricPreviewModel />}</group>
    <OrbitControls ref={controls} enabled={visible} enablePan={false} enableDamping={false}
      minPolarAngle={minPolar} maxPolarAngle={maxPolar} rotateSpeed={.65} zoomSpeed={.65} />
  </>;
}

export default function RevoBriefingCanvas({ era, command, onReady, onFailure }: {
  era: BriefingEra; command: PreviewCameraCommand; onReady: () => void; onFailure: () => void;
}) {
  const [visible, setVisible] = useState(() => !document.hidden);
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => { document.removeEventListener("visibilitychange", update); cleanup.current?.(); };
  }, []);
  return <Canvas orthographic shadows dpr={[1, 1.45]} frameloop={visible ? "demand" : "never"}
    camera={cameraOptions} gl={{ antialias: true, alpha: true }} style={{ touchAction: "none" }}
    onCreated={({ gl, setEvents }) => {
      setEvents({ enabled: false }); // OrbitControls owns the pointer; no R3F mesh events.
      const lost = (event: Event) => { event.preventDefault(); onFailure(); };
      gl.domElement.addEventListener("webglcontextlost", lost);
      cleanup.current = () => gl.domElement.removeEventListener("webglcontextlost", lost);
      onReady();
    }}>
    <ambientLight intensity={1.35} color="#fff8ed" />
    <hemisphereLight args={["#eef5ff", "#b0a088", 1]} />
    <directionalLight position={[-4, 9, 6]} intensity={3} color="#fff4dc" castShadow shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={.035} />
    <directionalLight position={[6, 4, -5]} intensity={1.15} color="#dceaf3" />
    <CameraRig era={era} command={command} visible={visible} />
  </Canvas>;
}
