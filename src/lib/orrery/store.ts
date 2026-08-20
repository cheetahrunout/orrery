import { create } from "zustand";

export type OrreryState = {
  paused: boolean
  speed: number
  focusedId: string
  labels: boolean
  trails: boolean
  hint: boolean
  setPaused: (paused: boolean) => void
  togglePaused: () => void
  setSpeed: (speed: number) => void
  setFocused: (id: string) => void
  toggleLabels: () => void
  toggleTrails: () => void
  dismissHint: () => void
};

export const useOrrery = create<OrreryState>((set) => ({
  paused: false,
  speed: 2,
  focusedId: "sun",
  labels: true,
  trails: true,
  hint: true,
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
  setFocused: (focusedId) => set({ focusedId, hint: false }),
  toggleLabels: () => set((s) => ({ labels: !s.labels })),
  toggleTrails: () => set((s) => ({ trails: !s.trails })),
  dismissHint: () => set({ hint: false }),
}));
