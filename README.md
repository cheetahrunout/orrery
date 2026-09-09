# Orrery

A living 3D model of the solar system. Drag to orbit, scroll to zoom, click a world to fly in, pause time, and wind the clock.

## Run it

Needs [Node.js 22](https://nodejs.org/).

```bash
git clone https://github.com/cheetahrunout/orrery.git
cd orrery
npm install
npm run dev
```

Then open the URL printed in the terminal (Vite serves on port 8080).

## Controls

| Input | Action |
| --- | --- |
| Drag | Orbit the camera |
| Scroll / pinch | Zoom |
| Click a planet (or the list) | Fly in and follow it |
| Pause | Freeze orbits |
| Speed slider | Slow crawl to fast-forward |
| Labels / Trails / Details | Toggle names, orbital paths, and the info card |
| Overview | Pull back to the whole system |
| Space | Pause / resume |
| 1–9, 0 | Jump between bodies (0 is Pluto) |
| L / T / I | Toggle labels, trails, details |
| `[` `]` | Halve / double speed |
| Esc | Return to the Sun |

## Stack

React, TanStack Start, Three.js, React Three Fiber, Tailwind.

## Deploying

Pushing to `main` publishes the site to GitHub Pages via
`.github/workflows/deploy-pages.yml`. Enable it once under **Settings → Pages →
Build and deployment → Source: GitHub Actions**.

The workflow sets `PAGES_BASE` (from `actions/configure-pages`, so a project
site's `/<repo>/` subpath is handled automatically), which switches the Vite
build to Nitro's `node` preset. `scripts/prerender-pages.mjs` then boots that
server, captures `/` over HTTP, and writes a static `dist-pages/`. Without
`PAGES_BASE` the build is unchanged — still the Vercel preset.

To reproduce a Pages build locally:

```bash
PAGES_BASE=/orrery/ npx vite build
PAGES_BASE=/orrery/ node scripts/prerender-pages.mjs
```
