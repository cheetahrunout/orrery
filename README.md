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
| Labels / Trails | Toggle names and orbital paths |
| Overview | Pull back to the whole system |
| Space | Pause / resume |
| 1–9 | Jump between bodies |
| `[` `]` | Halve / double speed |
| Esc | Return to the Sun |

## Stack

React, TanStack Start, Three.js, React Three Fiber, Tailwind.
