import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getBody, moonsOf, radiusOf, view } from "@/lib/orrery/bodies";
import { auToUnits, moonOrbitUnits } from "@/lib/orrery/scale";
import { orbitPointer } from "@/lib/orrery/pointer";
import { bodyWorldPosition } from "@/lib/orrery/registry";
import { useOrrery } from "@/lib/orrery/store";

const _target = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _look = new THREE.Vector3();

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
  return Math.max(r * 10, inner * 3.4, rings * 4.2);
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

  useEffect(() => {
    const limits = focusLimits(focusedId);
    view.minR = limits.min;
    view.maxR = limits.max;
    view.retarget(focusRadius(focusedId));
    // A scale change can leave the camera kilometres inside a planet or so far
    // out the system is a dot, so snap the eased radius into the new bounds.
    view.radius = THREE.MathUtils.clamp(view.radius, limits.min, limits.max);
  }, [focusedId, scaleVersion]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";

    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      dragging.current = true;
      orbitPointer.moved = false;
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
      if (Math.abs(dx) + Math.abs(dy) > 3) orbitPointer.moved = true;
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
        orbitPointer.moved = true;
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

    const follow = 1 - Math.exp(-4.2 * delta);
    _target.lerp(_desired, follow);

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

    const sinPhi = Math.sin(view.phi);
    _offset.set(
      view.radius * sinPhi * Math.sin(view.theta),
      view.radius * Math.cos(view.phi),
      view.radius * sinPhi * Math.cos(view.theta),
    );
    _look.copy(_target).add(_offset);
    camera.position.lerp(_look, 1 - Math.exp(-7.5 * delta));
    camera.lookAt(_target);
  });

  return null;
}
