import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { PLANETS, sim, YEAR_SCALE } from "@/lib/orrery/bodies";
import { useOrrery } from "@/lib/orrery/store";
import { CameraRig } from "./camera-rig";
import { AsteroidBelt, Planet, Sun } from "./celestial";

export function Scene() {
  useFrame((_, raw) => {
    const d = Math.min(raw, 0.1);
    const { paused, speed } = useOrrery.getState();
    if (!paused) sim.time += d * speed * YEAR_SCALE;
  });

  return (
    <>
      <color attach="background" args={["#07070c"]} />
      <fog attach="fog" args={["#07070c", 90, 240]} />
      <ambientLight intensity={0.07} />
      <hemisphereLight args={["#1a2233", "#050506", 0.28]} />
      <Stars
        radius={180}
        depth={70}
        count={3500}
        factor={3.2}
        saturation={0}
        fade
        speed={0.25}
      />
      <Sun />
      {PLANETS.map((body) => (
        <Planet key={body.id} body={body} />
      ))}
      <AsteroidBelt />
      <CameraRig />
    </>
  );
}
