import { Canvas } from "@react-three/fiber";
import { orbitPointer } from "@/lib/orrery/pointer";
import { useOrrery } from "@/lib/orrery/store";
import { Scene } from "./scene";

export function CanvasView() {
  return (
    <Canvas
      className="h-full w-full touch-none"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        // True scale puts the near plane ~0.02 units out and the far plane
        // ~6,000,000; a linear depth buffer z-fights itself apart over that.
        logarithmicDepthBuffer: true,
      }}
      camera={{ fov: 42, near: 0.12, far: 420, position: [0, 28, 74] }}
      onPointerMissed={() => {
        if (orbitPointer.moved) return;
        useOrrery.getState().setFocused("sun");
      }}
    >
      <Scene />
    </Canvas>
  );
}
