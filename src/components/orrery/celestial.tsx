import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Html, Line, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  type Body,
  moonsOf,
  orbitPosition,
  radiusOf,
  sim,
  spinAngle,
  SUN,
} from "@/lib/orrery/bodies";
import { orbitCurve, registerBody, ringGeometry } from "@/lib/orrery/registry";
import {
  auToUnits,
  moonOrbitUnits,
  radiusUnits,
  unitsToAu,
} from "@/lib/orrery/scale";
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
    ref.current.scale.setScalar(1 + Math.sin(t * Math.PI * 2) * 0.04);
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

function BodyLabel({
  body,
  radius,
  hovered,
  target,
  always,
}: {
  body: Body;
  radius: number;
  hovered: boolean;
  target: RefObject<THREE.Object3D | null>;
  /** Moons: shown only while their planet is the subject, never on apparent size. */
  always?: boolean;
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
    const show =
      focusedId === body.id ||
      hovered ||
      (labels && (always ? true : apparent > 0.018));
    el.style.opacity = show ? "1" : "0";
  });
  return (
    <Html
      // Offset purely in body radii: a constant term means nothing when a
      // radius can be 0.02 units or 109.
      position={[0, radius * 1.6, 0]}
      center
      occlude={false}
      // No distanceFactor. It scales the label inversely with camera distance,
      // which was fine at one fixed scale but blows moon labels up to fill the
      // screen once you fly in close. Constant screen size instead.
      wrapperClass="pointer-events-none"
      style={{ pointerEvents: "none" }}
      zIndexRange={[0, 0]}
    >
      <span
        ref={spanRef}
        aria-hidden
        className={cn(
          "whitespace-nowrap font-display italic tracking-display text-fg transition-opacity duration-(--motion-quick)",
          body.kind === "moon" ? "text-2xs not-italic text-muted" : "text-sm",
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
  // Re-render when the scale changes so the geometry args below rebuild.
  useOrrery((s) => s.scaleVersion);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const r = radiusOf(SUN);

  useLayoutEffect(() => {
    registerBody("sun", group.current);
    return () => registerBody("sun", null);
  }, []);

  useFrame(() => {
    if (group.current) group.current.rotation.y = spinAngle(SUN, sim.time);
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
        <sphereGeometry args={[r, 64, 48]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <mesh scale={1.14} raycast={noRaycast}>
        <sphereGeometry args={[r, 32, 24]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <sprite scale={[r * 7.6, r * 7.6, 1]} raycast={noRaycast}>
        <spriteMaterial
          map={glow}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.85}
        />
      </sprite>
      {/* No falloff: the distance slider spans five orders of magnitude, and a
          decaying light leaves the outer planets pitch black at true scale. */}
      <pointLight color="#fff1d0" intensity={2.2} distance={0} decay={0} />
      {focused ? <FocusRing radius={r} /> : null}
      <BodyLabel body={SUN} radius={r} hovered={hovered} target={group} />
    </group>
  );
}

function Wake({ body }: { body: Body }) {
  const scaleVersion = useOrrery((s) => s.scaleVersion);
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = 40;
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
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
    void scaleVersion;
    const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    const n = pos.count;
    const periodYears = body.periodDays / 365.256;
    for (let i = 0; i < n; i++) {
      const years = sim.time - (i / (n - 1)) * periodYears * 0.12;
      orbitPosition(body, years, _wake);
      pos.setXYZ(i, _wake.x, _wake.y, _wake.z);
    }
    pos.needsUpdate = true;
  });

  return <primitive object={line} />;
}

function OrbitPath({
  body,
  active,
  segments = 192,
}: {
  body: Body;
  active: boolean;
  segments?: number;
}) {
  const scaleVersion = useOrrery((s) => s.scaleVersion);
  const points = useMemo(
    () => orbitCurve(body, segments),
    // Scale changes move every point on the curve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [body, segments, scaleVersion],
  );
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

/**
 * Ring edges go through the same exponent as moon orbits. A fixed multiple of
 * the drawn radius drifts out of step with the moons once sizes are
 * compressed — at the default scale it put Mimas (3.19 Saturn radii, really
 * well outside the A ring) inside the rings.
 */
function SaturnRings({ body }: { body: Body }) {
  const tex = useMemo(() => createRingTexture(), []);
  const geo = useMemo(() => {
    // D ring inner edge to A ring outer edge, in Saturn radii.
    const inner = moonOrbitUnits(1.24 * body.radiusKm, body.radiusKm);
    const outer = moonOrbitUnits(2.27 * body.radiusKm, body.radiusKm);
    return ringGeometry(inner, outer, 96);
  }, [body.radiusKm]);
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

function Moon({ body, visible }: { body: Body; visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Mesh>(null);
  const tex = useBodyTexture(body);
  const focused = useOrrery((s) => s.focusedId === body.id);
  useOrrery((s) => s.scaleVersion);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const r = radiusOf(body);

  useLayoutEffect(() => {
    registerBody(body.id, group.current);
    return () => registerBody(body.id, null);
  }, [body.id]);

  useFrame(() => {
    if (group.current) {
      orbitPosition(body, sim.time, _pos);
      group.current.position.copy(_pos);
    }
    if (spin.current) spin.current.rotation.y = spinAngle(body, sim.time);
  });

  return (
    <>
      {visible ? <OrbitPath body={body} active={focused} segments={96} /> : null}
      <group ref={group}>
        <mesh
          ref={spin}
          onClick={(e) => {
            e.stopPropagation();
            useOrrery.getState().setFocused(body.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.08 : 1}
        >
          <sphereGeometry args={[r, 24, 16]} />
          <meshStandardMaterial map={tex} roughness={0.95} metalness={0.02} />
        </mesh>
        {focused ? <FocusRing radius={r} /> : null}
        {visible ? (
          <BodyLabel body={body} radius={r} hovered={hovered} target={group} always />
        ) : null}
      </group>
    </>
  );
}

export function Planet({ body }: { body: Body }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const tex = useBodyTexture(body);
  const focusedId = useOrrery((s) => s.focusedId);
  const trails = useOrrery((s) => s.trails);
  useOrrery((s) => s.scaleVersion);
  const focused = focusedId === body.id;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const r = radiusOf(body);
  const moons = useMemo(() => moonsOf(body.id), [body.id]);

  // 28 moons and their orbit rings everywhere at once is spaghetti — show a
  // planet's system only while it, or one of its moons, is the subject.
  const systemActive =
    focused || moons.some((m) => m.id === focusedId);

  useLayoutEffect(() => {
    registerBody(body.id, group.current);
    return () => registerBody(body.id, null);
  }, [body.id]);

  useFrame(() => {
    if (!group.current) return;
    orbitPosition(body, sim.time, _pos);
    group.current.position.copy(_pos);
    if (spin.current) spin.current.rotation.y = spinAngle(body, sim.time);
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
              <sphereGeometry args={[r, 48, 32]} />
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
                <sphereGeometry args={[r, 32, 24]} />
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
          {body.hasRings ? <SaturnRings body={body} /> : null}
          {/* Regular moons orbit the equator, so they belong in the tilt frame
              and outside the spin frame — which is why Uranus's moons stand
              almost vertical, as they really do. */}
          {moons.map((m) => (
            <Moon key={m.id} body={m} visible={systemActive} />
          ))}
        </group>
        {focused ? <FocusRing radius={r} /> : null}
        <BodyLabel body={body} radius={r} hovered={hovered} target={group} />
      </group>
    </>
  );
}

export function AsteroidBelt() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = 420;
  const distanceDiv = useOrrery((s) => s.distanceDiv);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // The real main belt spans roughly 2.1-3.3 AU.
  const inner = auToUnits(2.1, distanceDiv);
  const outer = auToUnits(3.3, distanceDiv);
  // Ceres-ish, so the specks grow and shrink with the size slider.
  const grain = radiusUnits(470);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        a: Math.random() * Math.PI * 2,
        t: Math.random(),
        y: (Math.random() - 0.5) * 0.12,
        s: 0.02 + Math.random() * 0.05,
        spin: 0.2 + Math.random() * 0.8,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
      })),
    [count],
  );

  useFrame(() => {
    if (!mesh.current) return;
    const t = sim.time;
    const span = outer - inner;
    for (let i = 0; i < count; i++) {
      const s = seeds[i]!;
      const rr = inner + s.t * span;
      // Kepler's third law, so the belt shears the way a real one does
      // instead of turning as a rigid disc.
      const au = unitsToAu(rr, distanceDiv);
      const periodYears = Math.max(au ** 1.5, 1e-6);
      const a = s.a + (t / periodYears) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * rr, s.y * span, Math.sin(a) * rr);
      dummy.rotation.set(s.rx, s.ry + t * s.spin, 0);
      dummy.scale.setScalar(s.s * grain);
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
