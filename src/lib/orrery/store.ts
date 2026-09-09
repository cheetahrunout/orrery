import { create } from "zustand";
import {
  DISTANCE_DIV_MAX,
  DISTANCE_DIV_MIN,
  ORRERY_PRESET,
  scale,
  SIZE_EXP_MAX,
  SIZE_EXP_MIN,
  type ScaleSettings,
} from "./scale";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type OrreryState = {
  paused: boolean;
  speed: number;
  focusedId: string;
  labels: boolean;
  trails: boolean;
  info: boolean;
  hint: boolean;
  /** Which planet's moon list is open in the nav. */
  expandedId: string | null;
  distanceDiv: number;
  sizeExp: number;
  /** Bumped on any scale change so geometry memos know to rebuild. */
  scaleVersion: number;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setSpeed: (speed: number) => void;
  setFocused: (id: string) => void;
  toggleLabels: () => void;
  toggleTrails: () => void;
  toggleInfo: () => void;
  setInfo: (info: boolean) => void;
  dismissHint: () => void;
  toggleExpanded: (id: string) => void;
  setDistanceDiv: (v: number) => void;
  setSizeExp: (v: number) => void;
  applyScale: (s: ScaleSettings) => void;
};

export const useOrrery = create<OrreryState>((set) => ({
  paused: false,
  speed: 2,
  focusedId: "sun",
  labels: true,
  trails: true,
  info: true,
  hint: true,
  expandedId: null,
  distanceDiv: ORRERY_PRESET.distanceDiv,
  sizeExp: ORRERY_PRESET.sizeExp,
  scaleVersion: 0,
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
  setFocused: (focusedId) => set({ focusedId, hint: false }),
  toggleLabels: () => set((s) => ({ labels: !s.labels })),
  toggleTrails: () => set((s) => ({ trails: !s.trails })),
  toggleInfo: () => set((s) => ({ info: !s.info })),
  setInfo: (info) => set({ info }),
  dismissHint: () => set({ hint: false }),
  toggleExpanded: (id) => set((s) => ({ expandedId: s.expandedId === id ? null : id })),
  setDistanceDiv: (v) =>
    set((s) => ({
      distanceDiv: clamp(v, DISTANCE_DIV_MIN, DISTANCE_DIV_MAX),
      scaleVersion: s.scaleVersion + 1,
    })),
  setSizeExp: (v) =>
    set((s) => ({
      sizeExp: clamp(v, SIZE_EXP_MIN, SIZE_EXP_MAX),
      scaleVersion: s.scaleVersion + 1,
    })),
  applyScale: (next) =>
    set((s) => ({
      distanceDiv: clamp(next.distanceDiv, DISTANCE_DIV_MIN, DISTANCE_DIV_MAX),
      sizeExp: clamp(next.sizeExp, SIZE_EXP_MIN, SIZE_EXP_MAX),
      scaleVersion: s.scaleVersion + 1,
    })),
}));

/**
 * Mirror the scale into the plain object the frame loop reads. Subscribing here
 * rather than threading props means `orbitPosition` stays a pure function of
 * (body, time) from the caller's point of view.
 */
const syncScale = (s: OrreryState) => {
  scale.distanceDiv = s.distanceDiv;
  scale.sizeExp = s.sizeExp;
};
syncScale(useOrrery.getState());
useOrrery.subscribe(syncScale);
