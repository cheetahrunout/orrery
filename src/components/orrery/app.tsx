import { lazy, Suspense, useEffect, useState } from "react";
import { BODIES, view } from "@/lib/orrery/bodies";
import { useOrrery } from "@/lib/orrery/store";
import { Hud } from "./hud";

const CanvasView = lazy(() =>
  import("./canvas-view").then((m) => ({ default: m.CanvasView })),
);

function Boot() {
  return (
    <div className="pointer-events-none flex h-full items-center justify-center">
      <p className="text-sm text-muted">Aligning the spheres</p>
    </div>
  );
}

export function OrreryApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el?.isContentEditable) return;
      const store = useOrrery.getState();
      if (e.code === "Space") {
        e.preventDefault();
        store.togglePaused();
      } else if (e.key === "Escape") {
        store.setFocused("sun");
      } else if (e.key === "l" || e.key === "L") {
        store.toggleLabels();
      } else if (e.key === "t" || e.key === "T") {
        store.toggleTrails();
      } else if (e.key === "i" || e.key === "I") {
        store.toggleInfo();
      } else if (e.key === "[") {
        store.setSpeed(Math.max(0.25, +(store.speed / 2).toFixed(2)));
      } else if (e.key === "]") {
        store.setSpeed(Math.min(16, +(store.speed * 2).toFixed(2)));
      } else if (e.key === "-" || e.key === "_") {
        view.zoomBy(1.2);
      } else if (e.key === "=" || e.key === "+") {
        view.zoomBy(0.82);
      } else if (e.key >= "0" && e.key <= "9") {
        // 1-9 walk Sun..Neptune; 0 is the 10th slot so Pluto is reachable too.
        const body = BODIES[(Number(e.key) + BODIES.length - 1) % BODIES.length];
        if (body) store.setFocused(body.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <Hud />
      <div
        aria-hidden
        className="vignette pointer-events-none absolute inset-0 z-0"
      />
      <div className="absolute inset-0 z-0">
        {mounted ? (
          <Suspense fallback={<Boot />}>
            <CanvasView />
          </Suspense>
        ) : (
          <Boot />
        )}
      </div>
    </main>
  );
}
