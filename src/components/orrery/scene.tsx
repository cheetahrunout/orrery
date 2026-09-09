import { Stars } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import { PLANETS, sim } from "@/lib/orrery/bodies";
import { auToUnits } from "@/lib/orrery/scale";
import { useOrrery } from "@/lib/orrery/store";
import { CameraRig } from "./camera-rig";
import { AsteroidBelt, Planet, Sun } from "./celestial";

/** Earth years per real second at 1x. */
export const YEAR_SCALE = 1 / 18;

export function Scene() {
  const distanceDiv = useOrrery((s) => s.distanceDiv);
  const { camera } = useThree();
  // Pluto sits at ~39.5 AU; the frustum has to follow the distance slider or
  // the outer system clips away entirely at low compression.
  const reach = auToUnits(45, distanceDiv);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.far = reach * 6;
    cam.near = Math.max(reach * 1e-5, 0.001);
    cam.updateProjectionMatrix();
  }, [camera, reach]);

  useFrame((_, raw) => {
    const d = Math.min(raw, 0.1);
    const { paused, speed } = useOrrery.getState();
    if (!paused) sim.time += d * speed * YEAR_SCALE;
  });

  return (
    <>
      <color attach="background" args={["#07070c"]} />
      <ambientLight intensity={0.07} />
      <hemisphereLight args={["#1a2233", "#050506", 0.28]} />
      <Stars
        radius={reach * 2.2}
        depth={reach * 0.8}
        count={3500}
        factor={reach * 0.04}
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
