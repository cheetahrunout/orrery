import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Html, Line, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type Body, orbitPosition, sim, SUN } from "@/lib/orrery/bodies";
import { orbitCurve, registerBody, ringGeometry } from "@/lib/orrery/registry";
import { useOrrery } from "@/lib/orrery/store";
import {
  createBodyTexture,
  createGlowTexture,
  createRingTexture,
} from "@/lib/orrery/textures";
import { cn } from "@/lib/utils";

const _pos = new THREE.Vector3();
const _wake = new THREE.Vector3();
const _world = new THREE.Vector3();
const noRaycast = () => {};

/**
 * Axial rotation as a function of sim time rather than accumulated frame
 * deltas, so spin stops on pause and scales with the speed slider. A negative
 * `day` (Venus, Uranus, Pluto) falls out as retrograde for free.
 */
function spinAngle(body: Body) {
  return body.day === 0 ? 0 : (sim.time * Math.PI * 2) / body.day;
}

function useBodyTexture(body: Body) {
  const tex = useMemo(() => createBodyTexture(body), [body]);
  useLayoutEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function FocusRing({ radius }: { radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = (performance.now() / 1800) % 1;
    const s = 1 + Math.sin(t * Math.PI * 2) * 0.04;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} raycast={noRaycast}>
      <ringGeometry args={[radius * 1.28, radius * 1.36, 64]} />
      <meshBasicMaterial
        color="#c5cdd8"
        transparent
        opacity={0.55}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function PlanetLabel({
  body,
  radius,
  hovered,
  target,
}: {
  body: Body
  radius: number
  hovered: boolean
  target: RefObject<THREE.Object3D | null>
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  useFrame(({ camera }) => {
    const el = spanRef.current;
    if (!el) return;
    const { labels, focusedId } = useOrrery.getState();
    // _world is shared scratch — without a target it still holds whichever
    // body wrote it last, so bail rather than measure the wrong distance.
    if (!target.current) return;
    target.current.getWorldPosition(_world);
    const dist = camera.position.distanceTo(_world);
    const apparent = radius / Math.max(dist, 0.01);
    const show = focusedId === body.id || hovered || (labels && apparent > 0.018);
    el.style.opacity = show ? "1" : "0";
  });
  return (
    <Html
      position={[0, radius + 0.55, 0]}
      center
      sprite
      occlude={false}
      distanceFactor={22}
      wrapperClass="pointer-events-none"
      style={{ pointerEvents: "none" }}
      zIndexRange={[0, 0]}
    >
      <span
        ref={spanRef}
        aria-hidden
        className={cn(
          "whitespace-nowrap font-display text-sm italic tracking-display text-fg transition-opacity duration-(--motion-quick)",
        )}
      >
        {body.name}
      </span>
    </Html>
  );
}

export function Sun() {
  const group = useRef<THREE.Group>(null);
  const tex = useBodyTexture(SUN);
  const glow = useMemo(() => createGlowTexture(), []);
  useLayoutEffect(() => () => glow.dispose(), [glow]);
  const focused = useOrrery((s) => s.focusedId === "sun");
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useLayoutEffect(() => {
    registerBody("sun", group.current);
    return () => registerBody("sun", null);
  }, []);

  useFrame(() => {
    // Derived from sim.time, not the frame delta, so the Sun freezes on pause
    // and follows the speed slider like every other body.
    if (group.current) group.current.rotation.y = spinAngle(SUN);
  });

  return (
    <group ref={group}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          useOrrery.getState().setFocused("sun");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[SUN.radius, 64, 48]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <mesh scale={1.14} raycast={noRaycast}>
        <sphereGeometry args={[SUN.radius, 32, 24]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <sprite scale={[SUN.radius * 7.6, SUN.radius * 7.6, 1]} raycast={noRaycast}>
        <spriteMaterial
          map={glow}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.85}
        />
      </sprite>
      <pointLight color="#fff1d0" intensity={4.4} distance={240} decay={1.55} />
      {focused ? <FocusRing radius={SUN.radius} /> : null}
      <PlanetLabel body={SUN} radius={SUN.radius} hovered={hovered} target={group} />
    </group>
  );
}

function Wake({ body }: { body: Body }) {
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = 40;
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(n * 3), 3),
    );
    const colors = new Float32Array(n * 3);
    const c = new THREE.Color(body.swatch);
    for (let i = 0; i < n; i++) {
      const t = 1 - i / (n - 1);
      colors[i * 3] = c.r * t;
      colors[i * 3 + 1] = c.g * t;
      colors[i * 3 + 2] = c.b * t;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    const obj = new THREE.Line(geo, mat);
    obj.raycast = noRaycast;
    return obj;
  }, [body.swatch]);

  useLayoutEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  useFrame(() => {
    const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    const n = pos.count;
    for (let i = 0; i < n; i++) {
      const years = sim.time - (i / (n - 1)) * body.period * 0.12;
      orbitPosition(body, years, _wake);
      pos.setXYZ(i, _wake.x, _wake.y, _wake.z);
    }
    pos.needsUpdate = true;
  });

  return <primitive object={line} />;
}

function OrbitPath({ body, active }: { body: Body; active: boolean }) {
  const points = useMemo(() => orbitCurve(body, 192), [body]);
  return (
    <Line
      points={points}
      color={active ? body.swatch : "#c5cdd8"}
      transparent
      opacity={active ? 0.45 : 0.12}
      lineWidth={active ? 1.4 : 1}
      raycast={noRaycast}
    />
  );
}

function SaturnRings({ radius }: { radius: number }) {
  const tex = useMemo(() => createRingTexture(), []);
  const geo = useMemo(
    () => ringGeometry(radius * 1.35, radius * 2.35, 96),
    [radius],
  );
  useLayoutEffect(() => () => tex.dispose(), [tex]);
  useLayoutEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} raycast={noRaycast}>
      <meshStandardMaterial
        map={tex}
        transparent
        side={THREE.DoubleSide}
        roughness={0.7}
        metalness={0.05}
        depthWrite={false}
      />
    </mesh>
  );
}

function EarthMoon({ parentRadius }: { parentRadius: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const a = (sim.time / 0.0748) * Math.PI * 2;
    const r = parentRadius * 2.6;
    ref.current.position.set(
      Math.cos(a) * r,
      Math.sin(a) * 0.12 * r,
      Math.sin(a) * r,
    );
  });
  return (
    <group ref={ref}>
      <mesh raycast={noRaycast}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#b8b4ae" roughness={1} />
      </mesh>
    </group>
  );
}

export function Planet({ body }: { body: Body }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const tex = useBodyTexture(body);
  const focusedId = useOrrery((s) => s.focusedId);
  const trails = useOrrery((s) => s.trails);
  const focused = focusedId === body.id;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useLayoutEffect(() => {
    registerBody(body.id, group.current);
    return () => registerBody(body.id, null);
  }, [body.id]);

  useFrame(() => {
    if (!group.current) return;
    orbitPosition(body, sim.time, _pos);
    group.current.position.copy(_pos);
    if (spin.current) spin.current.rotation.y = spinAngle(body);
  });

  return (
    <>
      {trails ? <OrbitPath body={body} active={focused || hovered} /> : null}
      {trails ? <Wake body={body} /> : null}
      <group ref={group}>
        {/* Tilt and spin must be separate groups. On one group the euler
            composes as Ry * Rz, so the spin rotates the tilt itself and the
            pole sweeps a cone once per rotation instead of holding still. */}
        <group rotation={[0, 0, body.tilt]}>
          <group ref={spin}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                useOrrery.getState().setFocused(body.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
              }}
              onPointerOut={() => setHovered(false)}
              scale={hovered ? 1.04 : 1}
            >
              <sphereGeometry args={[body.radius, 48, 32]} />
              <meshStandardMaterial
                map={tex}
                roughness={0.82}
                metalness={0.08}
                emissive={body.swatch}
                emissiveIntensity={0.04}
              />
            </mesh>
            {body.atmosphere ? (
              <mesh scale={1.045} raycast={noRaycast}>
                <sphereGeometry args={[body.radius, 32, 24]} />
                <meshBasicMaterial
                  color={body.atmosphere}
                  transparent
                  opacity={0.14}
                  side={THREE.BackSide}
                  depthWrite={false}
                />
              </mesh>
            ) : null}
          </group>
          {/* Equatorial plane, but the rings don't turn with the surface. */}
          {body.hasRings ? <SaturnRings radius={body.radius} /> : null}
        </group>
        {/* Outside the tilt/spin frame: the Moon orbits near the ecliptic,
            and inheriting the spin made it lap Earth once per Earth day. */}
        {body.id === "earth" ? <EarthMoon parentRadius={body.radius} /> : null}
        {focused ? <FocusRing radius={body.radius} /> : null}
        <PlanetLabel body={body} radius={body.radius} hovered={hovered} target={group} />
      </group>
    </>
  );
}

/** Main-belt bodies circle in ~4.6 yr — between Mars (1.9) and Jupiter (11.9). */
const BELT_RATE = (Math.PI * 2) / 4.6;

export function AsteroidBelt() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = 420;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => {
    const rng = () => Math.random();
    return Array.from({ length: count }, () => ({
      a: rng() * Math.PI * 2,
      r: 28.4 + rng() * 5.6,
      y: (rng() - 0.5) * 0.55,
      s: 0.03 + rng() * 0.07,
      spin: 0.2 + rng() * 0.8,
      rx: rng() * Math.PI,
      ry: rng() * Math.PI,
    }));
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    const t = sim.time;
    for (let i = 0; i < count; i++) {
      const s = seeds[i]!;
      const a = s.a + t * BELT_RATE;
      dummy.position.set(Math.cos(a) * s.r, s.y, Math.sin(a) * s.r);
      dummy.rotation.set(s.rx, s.ry + t * s.spin, 0);
      dummy.scale.setScalar(s.s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} raycast={noRaycast}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#6a635c" roughness={1} metalness={0.05} />
    </instancedMesh>
  );
}
