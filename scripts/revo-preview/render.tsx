import { Canvas, useFrame } from "@react-three/fiber";
import { createRoot } from "react-dom/client";
import { useRef } from "react";
import { SteamPreviewModel } from "../../src/components/revo/FactoryScene";
import { ElectricPreviewModel } from "../../src/components/revo/industry-2/ElectricScene";

function CaptureFrame() {
  const frames = useRef(0);
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    if (++frames.current === 3) document.body.dataset.ready = "true";
  }, 1);
  return null;
}

const electric = new URLSearchParams(location.search).get("era") === "2";
createRoot(document.getElementById("root")!).render(
  <Canvas shadows orthographic dpr={1} camera={{ position: [12, 11, 16], zoom: 68, near: .1, far: 100 }}
    gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
    onCreated={({ camera, gl }) => {
      camera.lookAt(0, 1.4, 0);
      gl.setClearColor(0, 0);
    }}>
    <ambientLight intensity={1.35} color="#fff8ed" />
    <hemisphereLight args={["#eef5ff", "#b0a088", 1.0]} />
    <directionalLight position={[-4, 9, 6]} intensity={3} color="#fff4dc" castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9}
      shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={.035} />
    <directionalLight position={[6, 4, -5]} intensity={1.15} color="#dceaf3" />
    {electric ? <ElectricPreviewModel /> : <SteamPreviewModel />}
    <CaptureFrame />
  </Canvas>
);
