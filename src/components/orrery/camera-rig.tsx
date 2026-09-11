import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getBody, moonsOf, radiusOf, view } from "@/lib/orrery/bodies";
import { auToUnits, moonOrbitUnits } from "@/lib/orrery/scale";
import { bodyWorldPosition } from "@/lib/orrery/registry";
import { useOrrery } from "@/lib/orrery/store";

const _target = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _offset = new THREE.Vector3();
/**
 * Where the camera is looking, expressed relative to the focused body rather
 * than in world space. It decays to exactly zero, which is what makes the
 * subject dead centre: an absolute target chased with a lerp can never catch a
 * moving body, and the miss grows with orbital speed. At true scale Earth
 * covers ~16,000 scene units per second while the camera sits 10 units away,
 * so the old chase left it completely out of frame.
 */
const _lag = new THREE.Vector3();
const _parent = new THREE.Vector3();

/**
 * The world azimuth the camera used last frame. Kept so a focus change can
 * rebase `view.theta` onto the new parent without the view snapping round.
 */
let lastWorldTheta = view.theta;

/** What a body orbits: its planet for a moon, the Sun for a planet. */
function parentIdOf(id: string): string | null {
  if (id === "sun") return null;
  return getBody(id).parentId ?? "sun";
}

/**
 * Azimuth of the direction *away* from whatever the body orbits, so a
 * `view.theta` of 0 puts that parent straight behind the subject.
 *
 * Measuring the camera angle in world axes instead leaves the parent sweeping
 * a full circle through the frame every orbit — once every 1.8 days while
 * following Io. Anchoring here holds it still, and swiping still re-aims
 * freely; it just offsets from the parent line rather than from world north.
 */
function parentAzimuth(id: string, bodyPos: THREE.Vector3): number {
  const pid = parentIdOf(id);
  if (!pid) return 0;
  bodyWorldPosition(pid, _parent);
  const dx = _parent.x - bodyPos.x;
  const dz = _parent.z - bodyPos.z;
  if (dx * dx + dz * dz < 1e-12) return 0;
  return Math.atan2(dx, dz) + Math.PI;
}

/**
 * Framing is derived from the body's drawn size rather than fixed numbers: the
 * scale sliders move every radius over five orders of magnitude, so any
 * constant here would be right at exactly one setting.
 */
function focusRadius(id: string) {
  if (id === "sun") return overviewRadius();
  const body = getBody(id);
  const r = radiusOf(body);
  // Pull back far enough to hold the inner moons — and Saturn's rings, which
  // reach 2.35 radii on their own — rather than filling the frame with globe.
  const moons = moonsOf(id);
  const inner = moons.length
    ? Math.min(...moons.map((m) => moonOrbitUnits(m.semiMajorKm, body.radiusKm)))
    : 0;
  const rings = body.hasRings
    ? moonOrbitUnits(2.27 * body.radiusKm, body.radiusKm)
    : 0;
  // Widen for the nearest moon, but never so far that the planet you actually
  // selected becomes a speck: at true scale the Moon orbits 60 Earth radii
  // out, which would park the camera 205 radii away from a 1-radius Earth.
  const forMoons = Math.min(inner * 3.4, r * 25);
  return Math.max(r * 10, forMoons, rings * 4.2);
}

function focusLimits(id: string) {
  if (id === "sun") {
    const r = overviewRadius();
    return { min: r * 0.05, max: r * 2.6 };
  }
  const r = radiusOf(getBody(id));
  return { min: r * 1.6, max: r * 900 };
}

/** Far enough out to hold the whole planetary system in frame. */
function overviewRadius() {
  return auToUnits(34);
}

export function CameraRig() {
  const { gl, camera } = useThree();
  const focusedId = useOrrery((s) => s.focusedId);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pinch = useRef<number | null>(null);
  const idle = useRef(0);

  const scaleVersion = useOrrery((s) => s.scaleVersion);

  const lastFocus = useRef(focusedId);

  useEffect(() => {
    const limits = focusLimits(focusedId);
    view.minR = limits.min;
    view.maxR = limits.max;
    view.retarget(focusRadius(focusedId));
    // A scale change can leave the camera kilometres inside a planet or so far
    // out the system is a dot, so snap the eased radius into the new bounds.
    view.radius = THREE.MathUtils.clamp(view.radius, limits.min, limits.max);

    bodyWorldPosition(focusedId, _desired);
    if (lastFocus.current === focusedId) {
      // Scale change: the old target is in stale units, so easing from it would
      // fling the camera across the system. Cut instead.
      _lag.set(0, 0, 0);
    } else {
      // Focus change: keep looking where we were, then let it decay in — that
      // decay *is* the fly-to, and it ends at exactly the body.
      _lag.subVectors(_target, _desired);
      lastFocus.current = focusedId;
      // theta is relative to the new parent now, so re-express the angle the
      // camera is already at. Without this, switching subjects whips the view
      // round by the difference between the two parent directions.
      view.theta = lastWorldTheta - parentAzimuth(focusedId, _desired);
      const cap = focusRadius(focusedId) * 60;
      if (_lag.lengthSq() > cap * cap) _lag.setLength(cap);
    }
  }, [focusedId, scaleVersion]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";

    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      idle.current = 0;
      useOrrery.getState().dismissHint();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* already captured */
      }
    };

    const move = (e: PointerEvent) => {
      // A two-finger pinch also emits pointermove; without this the zoom
      // gesture spins the camera at the same time.
      if (!dragging.current || pinch.current != null) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      view.theta -= dx * 0.005;
      view.phi = THREE.MathUtils.clamp(
        view.phi - dy * 0.004,
        0.18,
        Math.PI - 0.18,
      );
      idle.current = 0;
    };

    const up = () => {
      dragging.current = false;
    };

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(e.deltaY * 0.0012);
      view.zoomBy(factor);
      idle.current = 0;
      useOrrery.getState().dismissHint();
    };

    const touchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch.current != null) view.zoomBy(pinch.current / dist);
        pinch.current = dist;
        idle.current = 0;
      }
    };
    const touchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinch.current = null;
        // The remaining finger would otherwise jump the camera by the full
        // distance travelled during the pinch.
        dragging.current = false;
      }
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchmove", touchMove, { passive: true });
    el.addEventListener("touchend", touchEnd);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchmove", touchMove);
      el.removeEventListener("touchend", touchEnd);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    bodyWorldPosition(focusedId, _desired);

    _lag.multiplyScalar(Math.exp(-4.2 * delta));
    // Exponential decay only approaches zero, and "almost centred" is still
    // visibly off at these distances, so snap once the miss is under a
    // thousandth of the body.
    const snap = Math.max(radiusOf(getBody(focusedId)) * 1e-3, Number.MIN_VALUE);
    if (_lag.lengthSq() < snap * snap) _lag.set(0, 0, 0);
    _target.copy(_desired).add(_lag);

    // Unconditional: a manual zoom sets goal === radius, so this is a no-op
    // except while a focus change is easing in.
    view.radius = THREE.MathUtils.lerp(
      view.radius,
      view.goal,
      1 - Math.exp(-3.4 * delta),
    );

    idle.current += delta;
    const overview = focusedId === "sun";
    if (overview && !dragging.current && idle.current > 2.4) {
      view.theta += delta * 0.045;
    }

    const worldTheta = view.theta + parentAzimuth(focusedId, _desired);
    lastWorldTheta = worldTheta;
    const sinPhi = Math.sin(view.phi);
    _offset.set(
      view.radius * sinPhi * Math.sin(worldTheta),
      view.radius * Math.cos(view.phi),
      view.radius * sinPhi * Math.cos(worldTheta),
    );
    // Placed exactly, not eased. Easing the position is the same trap as
    // easing the target: it trails a fast body by speed x time-constant, which
    // both decentres the subject and leaves the camera at the wrong distance.
    // Smoothness comes from theta/phi following the pointer and from the
    // radius easing above, neither of which depends on how fast the body moves.
    camera.position.copy(_target).add(_offset);
    camera.lookAt(_target);

    // The near plane has to track the viewing distance, not the size of the
    // system. Deriving it from the scene reach put it at 10.6 units while the
    // camera sat 10 units from Earth at true scale, clipping the planet away
    // to a sliver. The log depth buffer absorbs the resulting near/far range.
    const near = Math.max(view.radius * 0.002, 1e-6);
    const far = Math.max(overviewRadius() * 8, view.radius * 16);
    if (
      Math.abs(camera.near - near) > near * 0.05 ||
      Math.abs(camera.far - far) > far * 0.05
    ) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
