import { useEffect, useState } from "react";
import {
  Captions,
  ChevronRight,
  Focus,
  Info as InfoIcon,
  Minus,
  Pause,
  Play,
  Plus,
  Ruler,
  Spline,
  Undo2,
  X,
} from "lucide-react";
import {
  distanceAu,
  getBody,
  moonsOf,
  PRIMARIES,
  sim,
  view,
} from "@/lib/orrery/bodies";
import {
  DISTANCE_DIV_MAX,
  exaggeration,
  ORRERY_PRESET,
  SIZE_EXP_MAX,
  SIZE_EXP_MIN,
  TRUE_PRESET,
} from "@/lib/orrery/scale";
import { useOrrery } from "@/lib/orrery/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const SPEED_MIN = 0.01;
const SPEED_MAX = 16;
const SPEED_DECADES = Math.log2(SPEED_MAX / SPEED_MIN);

function formatYears(t: number) {
  if (t < 0.01) return "0.00";
  if (t < 10) return t.toFixed(2);
  if (t < 100) return t.toFixed(1);
  return Math.round(t).toString();
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  if (n >= 10) return Math.round(n).toString();
  return n.toFixed(n >= 1 ? 1 : 2);
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

function ScalePanel() {
  const distanceDiv = useOrrery((s) => s.distanceDiv);
  const sizeExp = useOrrery((s) => s.sizeExp);
  const exag = exaggeration();
  const isTrue = exag < 1.02;

  // Log slider: the useful range spans four decades, so linear would give the
  // whole bottom half of the track to values above 5000x.
  const distPos = Math.log10(distanceDiv) / Math.log10(DISTANCE_DIV_MAX);
  const sizePos = (sizeExp - SIZE_EXP_MIN) / (SIZE_EXP_MAX - SIZE_EXP_MIN);

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-[var(--radius-lg)] bg-surface/95 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm md:w-80">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-2xs uppercase tracking-label text-subtle">Scale</span>
        <span
          className={cn(
            "font-mono text-2xs tabular-nums",
            isTrue ? "text-fg" : "text-muted",
          )}
        >
          {isTrue ? "true scale" : `bodies ${compact(exag)}× oversized`}
        </span>
      </div>

      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-2xs uppercase tracking-label text-subtle">Orbits</span>
        <span className="font-mono text-xs tabular-nums text-fg">
          {distanceDiv <= 1.02 ? "true distance" : `÷${compact(distanceDiv)}`}
        </span>
      </div>
      <Slider
        min={0}
        max={1}
        step={0.001}
        value={[distPos]}
        onValueChange={([v]) =>
          useOrrery
            .getState()
            .setDistanceDiv(10 ** ((v ?? 0) * Math.log10(DISTANCE_DIV_MAX)))
        }
        aria-label="Orbit compression"
      />

      <div className="mt-3 mb-1 flex items-baseline justify-between">
        <span className="text-2xs uppercase tracking-label text-subtle">Body size</span>
        <span className="font-mono text-xs tabular-nums text-fg">
          {sizeExp >= 0.995 ? "true radii" : `compressed ${sizeExp.toFixed(2)}`}
        </span>
      </div>
      <Slider
        min={0}
        max={1}
        step={0.001}
        value={[sizePos]}
        onValueChange={([v]) =>
          useOrrery
            .getState()
            .setSizeExp(SIZE_EXP_MIN + (v ?? 0) * (SIZE_EXP_MAX - SIZE_EXP_MIN))
        }
        aria-label="Body size compression"
      />

      <div className="mt-3 flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => useOrrery.getState().applyScale(ORRERY_PRESET)}
        >
          Orrery
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => useOrrery.getState().applyScale(TRUE_PRESET)}
        >
          True scale
        </Button>
      </div>
      <p className="mt-2 text-2xs leading-relaxed text-subtle">
        {isTrue
          ? "Everything is now its real size at its real distance. The planets are specks — that is what the solar system is."
          : "Bodies are drawn larger than reality relative to their orbits, or you could not see them at all."}
      </p>
    </div>
  );
}

function BodyRow({ id, depth = 0 }: { id: string; depth?: number }) {
  const body = getBody(id);
  const focusedId = useOrrery((s) => s.focusedId);
  const expandedId = useOrrery((s) => s.expandedId);
  const moons = moonsOf(id);
  const active = focusedId === id;
  const open = expandedId === id;

  return (
    <div>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => useOrrery.getState().setFocused(id)}
          className={cn(
            "pointer-events-auto flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 text-left transition-colors duration-(--motion-quick)",
            depth > 0 ? "h-8 text-xs" : "text-sm",
            active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface/80 hover:text-fg",
          )}
          style={depth > 0 ? { marginLeft: 14 } : undefined}
        >
          <span
            className={cn("shrink-0 rounded-full", depth > 0 ? "size-1" : "size-1.5")}
            style={{ background: body.swatch }}
          />
          <span className={cn("truncate", depth === 0 && "font-medium")}>{body.name}</span>
        </button>
        {moons.length > 0 ? (
          <button
            type="button"
            onClick={() => useOrrery.getState().toggleExpanded(id)}
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} moons of ${body.name}`}
            className="pointer-events-auto flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-subtle transition-colors duration-(--motion-quick) hover:bg-surface/80 hover:text-fg"
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-(--motion-quick)",
                open && "rotate-90",
              )}
            />
          </button>
        ) : null}
      </div>
      {open
        ? moons.map((m) => <BodyRow key={m.id} id={m.id} depth={depth + 1} />)
        : null}
    </div>
  );
}

export function Hud() {
  const paused = useOrrery((s) => s.paused);
  const speed = useOrrery((s) => s.speed);
  const focusedId = useOrrery((s) => s.focusedId);
  const labels = useOrrery((s) => s.labels);
  const trails = useOrrery((s) => s.trails);
  const info = useOrrery((s) => s.info);
  const hint = useOrrery((s) => s.hint);
  const [scaleOpen, setScaleOpen] = useState(false);
  const focused = getBody(focusedId);
  const parent = focused.parentId ? getBody(focused.parentId) : null;
  const focusedMoons = moonsOf(focusedId);

  const kindLabel =
    focused.kind === "star"
      ? "Star"
      : focused.kind === "dwarf"
        ? "Dwarf planet"
        : focused.kind === "moon"
          ? `Moon of ${parent?.name ?? ""}`
          : "Planet";

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
        {/* Mobile: primaries, then the focused planet's moons on a second row. */}
        <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
          {PRIMARIES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => useOrrery.getState().setFocused(b.id)}
              className={cn(
                "pointer-events-auto flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-xs",
                focusedId === b.id || focused.parentId === b.id
                  ? "bg-surface-2 text-fg shadow-[var(--shadow-border-hover)]"
                  : "bg-surface/80 text-muted shadow-[var(--shadow-border)]",
              )}
            >
              <span className="size-2 rounded-full" style={{ background: b.swatch }} />
              {b.name}
            </button>
          ))}
        </div>
        {(() => {
          const siblings = parent ? moonsOf(parent.id) : focusedMoons;
          return siblings.length > 0 ? (
            <div className="-mx-1 mt-1 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
              {siblings.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => useOrrery.getState().setFocused(m.id)}
                  className={cn(
                    "pointer-events-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-2xs",
                    focusedId === m.id
                      ? "bg-surface-2 text-fg shadow-[var(--shadow-border-hover)]"
                      : "bg-surface/60 text-subtle shadow-[var(--shadow-border)]",
                  )}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: m.swatch }}
                  />
                  {m.name}
                </button>
              ))}
            </div>
          ) : null;
        })()}

        <div className="mt-2 flex h-[calc(100%-3rem)] items-stretch justify-between gap-3 md:mt-0 md:h-full">
          <nav
            aria-label="Celestial bodies"
            className="hidden w-52 flex-col justify-center md:flex"
          >
            <div className="pointer-events-auto max-h-full overflow-y-auto py-1 pr-1">
              {PRIMARIES.map((b) => (
                <BodyRow key={b.id} id={b.id} />
              ))}
            </div>
          </nav>

          <aside
            className={cn(
              "ml-auto flex w-full max-w-sm flex-col justify-end md:w-72 md:justify-center",
              // On a phone the card and the scale panel together leave almost
              // no scene, so the panel takes over while it is open.
              scaleOpen && "max-md:hidden",
            )}
          >
            {info ? (
              <article className="pointer-events-auto rounded-[var(--radius-xl)] bg-surface/90 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl leading-none tracking-display italic text-fg md:text-2xl">
                      {focused.name}
                    </p>
                    <p className="mt-1.5 text-2xs uppercase tracking-label text-muted">
                      {kindLabel}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {parent ? (
                      <Button
                        variant="quiet"
                        size="icon-sm"
                        aria-label={`Back to ${parent.name}`}
                        onClick={() => useOrrery.getState().setFocused(parent.id)}
                      >
                        <Undo2 className="size-4" />
                      </Button>
                    ) : focusedId !== "sun" ? (
                      <Button
                        variant="quiet"
                        size="icon-sm"
                        aria-label="Return to overview"
                        onClick={() => useOrrery.getState().setFocused("sun")}
                      >
                        <Undo2 className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="quiet"
                      size="icon-sm"
                      aria-label="Hide planet details"
                      onClick={() => useOrrery.getState().setInfo(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
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
                {focusedMoons.length > 0 ? (
                  <div className="mt-3 border-t border-[color-mix(in_oklab,var(--color-fg)_10%,transparent)] pt-3">
                    <p className="text-2xs uppercase tracking-label text-subtle">
                      Moons shown ({focusedMoons.length})
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {focusedMoons.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => useOrrery.getState().setFocused(m.id)}
                          className="rounded-full bg-surface-2/70 px-2 py-0.5 text-2xs text-muted transition-colors hover:text-fg"
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {focused.semiMajorKm > 0 && !parent ? (
                  <p className="mt-3 font-mono text-2xs text-subtle">
                    {distanceAu(focused).toFixed(2)} AU from the Sun
                  </p>
                ) : null}
              </article>
            ) : null}
          </aside>
        </div>
      </div>

      <footer className="mt-3 flex flex-col gap-2">
        {scaleOpen ? <ScalePanel /> : null}
        <div className="pointer-events-auto flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
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
                step={0.001}
                value={[Math.log2(speed / SPEED_MIN) / SPEED_DECADES]}
                onValueChange={([v]) => {
                  const next = SPEED_MIN * 2 ** ((v ?? 0) * SPEED_DECADES);
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
              variant={info ? "outline" : "quiet"}
              size="sm"
              aria-pressed={info}
              onClick={() => useOrrery.getState().toggleInfo()}
            >
              <InfoIcon className="size-3.5" />
              Details
            </Button>
            <Button
              variant={scaleOpen ? "outline" : "quiet"}
              size="sm"
              aria-pressed={scaleOpen}
              onClick={() => setScaleOpen((v) => !v)}
            >
              <Ruler className="size-3.5" />
              Scale
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
