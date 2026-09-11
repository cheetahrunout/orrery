import { Canvas } from "@react-three/fiber";
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
      // No onPointerMissed deselect. Tapping empty space used to snap back to
      // the Sun, and at true scale a body covers a handful of pixels, so nearly
      // every tap missed and silently dropped the focus. Overview, Esc and the
      // body list are the ways out.
    >
      <Scene />
    </Canvas>
  );
}
