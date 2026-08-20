import { useEffect, useState } from "react";
import {
  Captions,
  Focus,
  Minus,
  Pause,
  Play,
  Plus,
  Spline,
  Undo2,
} from "lucide-react";
import { BODIES, getBody, sim, view } from "@/lib/orrery/bodies";
import { useOrrery } from "@/lib/orrery/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function formatYears(t: number) {
  if (t < 0.01) return "0.00";
  if (t < 10) return t.toFixed(2);
  if (t < 100) return t.toFixed(1);
  return Math.round(t).toString();
}

function YearReadout() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT(sim.time), 200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <p className="font-mono text-xs tabular-nums text-muted">
      {formatYears(t)}
      <span className="ml-1 text-subtle">Earth years</span>
    </p>
  );
}

export function Hud() {
  const paused = useOrrery((s) => s.paused);
  const speed = useOrrery((s) => s.speed);
  const focusedId = useOrrery((s) => s.focusedId);
  const labels = useOrrery((s) => s.labels);
  const trails = useOrrery((s) => s.trails);
  const hint = useOrrery((s) => s.hint);
  const focused = getBody(focusedId);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] md:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto">
          <p className="font-display text-2xl leading-none tracking-display text-fg italic md:text-3xl">
            Orrery
          </p>
          <p className="mt-1 hidden text-xs tracking-wide text-muted sm:block">
            A living model of the solar system
          </p>
        </div>
        <YearReadout />
      </header>

      <div className="mt-3 min-h-0 flex-1">
        <div className="pointer-events-auto -mx-1 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
          {BODIES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => useOrrery.getState().setFocused(b.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-xs",
                focusedId === b.id
                  ? "bg-surface-2 text-fg shadow-[var(--shadow-border-hover)]"
                  : "bg-surface/80 text-muted shadow-[var(--shadow-border)]",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: b.swatch }}
              />
              {b.name}
            </button>
          ))}
        </div>

        <div className="mt-2 flex h-[calc(100%-3rem)] items-stretch justify-between gap-3 md:mt-0 md:h-full">
          <nav
            aria-label="Celestial bodies"
            className="pointer-events-auto hidden w-44 flex-col justify-center gap-0.5 md:flex"
          >
            {BODIES.map((b) => {
              const active = focusedId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => useOrrery.getState().setFocused(b.id)}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-left text-sm transition-colors duration-(--motion-quick)",
                    active
                      ? "bg-surface-2 text-fg"
                      : "text-muted hover:bg-surface/80 hover:text-fg",
                  )}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: b.swatch }}
                  />
                  <span className="font-medium">{b.name}</span>
                </button>
              );
            })}
          </nav>

          <aside className="pointer-events-auto ml-auto flex w-full max-w-sm flex-col justify-end md:w-72 md:justify-center">
            <article className="rounded-[var(--radius-xl)] bg-surface/90 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl leading-none tracking-display italic text-fg md:text-2xl">
                    {focused.name}
                  </p>
                  <p className="mt-1.5 text-2xs uppercase tracking-label text-muted">
                    {focused.kind === "star"
                      ? "Star"
                      : focused.kind === "dwarf"
                        ? "Dwarf planet"
                        : "Planet"}
                  </p>
                </div>
                {focusedId !== "sun" ? (
                  <Button
                    variant="quiet"
                    size="icon-sm"
                    aria-label="Return to overview"
                    onClick={() => useOrrery.getState().setFocused("sun")}
                  >
                    <Undo2 className="size-4" />
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-pretty text-muted md:line-clamp-none">
                {focused.blurb}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 md:mt-4 md:gap-y-2.5">
                {focused.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-2xs uppercase tracking-label text-subtle">
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs tabular-nums text-fg">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </aside>
        </div>
      </div>

      <footer className="pointer-events-auto mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={paused ? "Resume simulation" : "Pause simulation"}
            onClick={() => useOrrery.getState().togglePaused()}
          >
            {paused ? (
              <Play className="size-4 translate-x-px" />
            ) : (
              <Pause className="size-4" />
            )}
          </Button>
          <div className="min-w-0 flex-1 rounded-[var(--radius-lg)] bg-surface/90 px-3 py-2 shadow-[var(--shadow-border)] md:w-64 md:flex-none">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-2xs uppercase tracking-label text-subtle">
                Speed
              </span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {speed < 1 ? speed.toFixed(2) : speed.toFixed(1)}×
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[Math.log2(speed / 0.25) / 6]}
              onValueChange={([v]) => {
                const next = 0.25 * 2 ** ((v ?? 0) * 6);
                useOrrery.getState().setSpeed(Math.round(next * 100) / 100);
              }}
              aria-label="Simulation speed"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={labels ? "outline" : "quiet"}
            size="sm"
            aria-pressed={labels}
            onClick={() => useOrrery.getState().toggleLabels()}
          >
            <Captions className="size-3.5" />
            Labels
          </Button>
          <Button
            variant={trails ? "outline" : "quiet"}
            size="sm"
            aria-pressed={trails}
            onClick={() => useOrrery.getState().toggleTrails()}
          >
            <Spline className="size-3.5" />
            Trails
          </Button>
          <Button
            variant="quiet"
            size="icon-sm"
            aria-label="Zoom out"
            onClick={() => view.zoomBy(1.28)}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            variant="quiet"
            size="icon-sm"
            aria-label="Zoom in"
            onClick={() => view.zoomBy(0.78)}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => useOrrery.getState().setFocused("sun")}
          >
            <Focus className="size-3.5" />
            Overview
          </Button>
        </div>
      </footer>

      {hint ? (
        <p className="pointer-events-none absolute bottom-24 left-1/2 hidden -translate-x-1/2 text-center text-xs text-muted md:bottom-28 md:block">
          Drag to orbit · Scroll to zoom · Click a world to approach
        </p>
      ) : null}
    </div>
  );
}
