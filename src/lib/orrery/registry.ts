import * as THREE from "three";
import { getBody, orbitPosition, sim } from "./bodies";

export const bodyRefs = new Map<string, THREE.Object3D>();

export function registerBody(id: string, obj: THREE.Object3D | null) {
  if (obj) bodyRefs.set(id, obj);
  else bodyRefs.delete(id);
}

const _world = new THREE.Vector3();

export function bodyWorldPosition(id: string, out: THREE.Vector3 = _world) {
  const obj = bodyRefs.get(id);
  if (obj) {
    obj.getWorldPosition(out);
    return out;
  }
  const p = orbitPosition(getBody(id), sim.time);
  return out.set(p.x, p.y, p.z);
}

/**
 * A ring band texture wants u = radial fraction, but THREE.RingGeometry maps
 * uv planar (u tracks x, so u sweeps 0.24..0.79 at a *constant* radius) —
 * bands would render as stripes across the disc instead of concentric rings.
 * Rebuild uv as (radial, angular).
 */
export function ringGeometry(inner: number, outer: number, segments = 96) {
  const geo = new THREE.RingGeometry(inner, outer, segments);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  const span = outer - inner || 1;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const radial = (Math.hypot(x, y) - inner) / span;
    const angular = (Math.atan2(y, x) / (Math.PI * 2) + 1) % 1;
    uv.setXY(i, radial, angular);
  }
  uv.needsUpdate = true;
  return geo;
}

export function orbitCurve(body: ReturnType<typeof getBody>, segments = 256) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const years = (i / segments) * body.period;
    const p = orbitPosition(body, years);
    pts.push(new THREE.Vector3(p.x, p.y, p.z));
  }
  return pts;
}
