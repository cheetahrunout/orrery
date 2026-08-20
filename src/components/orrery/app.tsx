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
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
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
      } else if (e.key === "[") {
        store.setSpeed(Math.max(0.25, +(store.speed / 2).toFixed(2)));
      } else if (e.key === "]") {
        store.setSpeed(Math.min(16, +(store.speed * 2).toFixed(2)));
      } else if (e.key === "-" || e.key === "_") {
        view.zoomBy(1.2);
      } else if (e.key === "=" || e.key === "+") {
        view.zoomBy(0.82);
      } else if (e.key >= "1" && e.key <= "9") {
        const body = BODIES[Number(e.key) - 1];
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
