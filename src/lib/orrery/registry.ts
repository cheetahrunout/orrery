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

export function orbitCurve(body: ReturnType<typeof getBody>, segments = 256) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const years = (i / segments) * body.period;
    const p = orbitPosition(body, years);
    pts.push(new THREE.Vector3(p.x, p.y, p.z));
  }
  return pts;
}
