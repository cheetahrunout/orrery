import * as THREE from "three";
import type { Body } from "./bodies";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function lerpC(a: number[], b: number[], t: number) {
  return [
    a[0]! + (b[0]! - a[0]!) * t,
    a[1]! + (b[1]! - a[1]!) * t,
    a[2]! + (b[2]! - a[2]!) * t,
  ];
}

function noise2(rng: () => number, w: number, h: number, octaves = 4) {
  const base = new Float32Array(w * h);
  for (let i = 0; i < base.length; i++) base[i] = rng();
  // JS % keeps the sign of the dividend, so a plain `x % w` on the negative
  // coordinates the swirl offsets produce reads out of bounds (NaN -> black
  // pixels) or wraps into the previous row. Floor-mod instead.
  const wrap = (v: number, n: number) => ((v % n) + n) % n;
  const sample = (x: number, y: number) => {
    const x0 = wrap(Math.floor(x), w);
    const y0 = wrap(Math.floor(y), h);
    const x1 = (x0 + 1) % w;
    const y1 = (y0 + 1) % h;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const a = base[y0 * w + x0]!;
    const b = base[y0 * w + x1]!;
    const c = base[y1 * w + x0]!;
    const d = base[y1 * w + x1]!;
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
  };
  return (x: number, y: number) => {
    let v = 0;
    let amp = 1;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      v += sample((x / w) * freq * 8, (y / h) * freq * 8) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return v / norm;
  };
}

function paintSphere(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  paint: (x: number, y: number, lat: number, lon: number) => number[],
) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const lat = (y / (h - 1) - 0.5) * Math.PI;
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * Math.PI * 2;
      const [r, g, b] = paint(x, y, lat, lon);
      const i = (y * w + x) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function mercury(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("mercury"));
  const n = noise2(rng, 64, 32, 5);
  paintSphere(ctx, w, h, (x, y) => {
    const v = n(x, y);
    const c = 90 + v * 70;
    return [c, c * 0.96, c * 0.9];
  });
  for (let i = 0; i < 80; i++) {
    const cx = rng() * w;
    const cy = rng() * h;
    const r = 2 + rng() * 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(40,38,36,${0.15 + rng() * 0.3})`;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.stroke();
  }
}

function venus(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("venus"));
  const n = noise2(rng, 64, 32, 5);
  paintSphere(ctx, w, h, (x, y, lat) => {
    const swirl = n(x + Math.sin(lat * 3) * 18, y);
    const t = swirl;
    const a = [232, 210, 160];
    const b = [196, 154, 96];
    return lerpC(a, b, t);
  });
}

function earth(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("earth"));
  const n = noise2(rng, 64, 32, 6);
  const land = noise2(mulberry32(hash("earth-land")), 64, 32, 5);
  paintSphere(ctx, w, h, (x, y, lat) => {
    const ocean = [42, 92, 148];
    const deep = [18, 52, 96];
    const grass = [62, 122, 72];
    const desert = [194, 168, 110];
    const ice = [236, 242, 248];
    const v = n(x, y);
    const l = land(x, y);
    const polar = Math.abs(lat) > 1.15 + v * 0.15;
    if (polar) return ice;
    if (l > 0.55) {
      const t = Math.min(1, (l - 0.55) * 3);
      return lerpC(grass, desert, t * (0.3 + v));
    }
    return lerpC(deep, ocean, v);
  });
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.ellipse(rng() * w, rng() * h, 40 + rng() * 70, 8 + rng() * 16, rng() * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function mars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("mars"));
  const n = noise2(rng, 64, 32, 5);
  paintSphere(ctx, w, h, (x, y, lat) => {
    const ice = [232, 228, 220];
    const rust = [176, 86, 52];
    const dark = [110, 58, 40];
    if (Math.abs(lat) > 1.25) return ice;
    const v = n(x, y);
    return lerpC(dark, rust, v);
  });
}

function jupiter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("jupiter"));
  const n = noise2(rng, 64, 32, 4);
  const bands = [
    [210, 176, 128],
    [176, 128, 88],
    [232, 214, 176],
    [156, 108, 72],
    [220, 188, 140],
    [190, 140, 96],
  ];
  paintSphere(ctx, w, h, (x, y, lat) => {
    const idx = Math.abs(Math.floor((lat / Math.PI + 0.5) * bands.length * 2)) % bands.length;
    const swirl = n(x + Math.sin(lat * 12) * 8, y);
    const a = bands[idx]!;
    const b = bands[(idx + 1) % bands.length]!;
    return lerpC(a, b, swirl);
  });
  ctx.fillStyle = "rgba(176, 64, 48, 0.85)";
  ctx.beginPath();
  ctx.ellipse(w * 0.62, h * 0.58, 28, 16, 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function saturn(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("saturn"));
  const n = noise2(rng, 64, 32, 3);
  paintSphere(ctx, w, h, (x, y, lat) => {
    const swirl = n(x, y);
    const t = (Math.sin(lat * 10) + 1) * 0.5 * 0.4 + swirl * 0.6;
    return lerpC([232, 210, 160], [196, 168, 112], t);
  });
}

function iceGiant(id: string, a: number[], b: number[]) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const rng = mulberry32(hash(id));
    const n = noise2(rng, 64, 32, 4);
    paintSphere(ctx, w, h, (x, y) => lerpC(a, b, n(x, y)));
  };
}

function pluto(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("pluto"));
  const n = noise2(rng, 64, 32, 5);
  paintSphere(ctx, w, h, (x, y, lat, lon) => {
    const heart =
      Math.hypot((lon - 3.4) * Math.cos(lat), lat + 0.15) < 0.45;
    const ice = [226, 214, 204];
    const rock = [140, 118, 100];
    if (heart) return ice;
    return lerpC(rock, ice, n(x, y) * 0.5);
  });
}

function sun(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = mulberry32(hash("sun"));
  const n = noise2(rng, 64, 32, 5);
  paintSphere(ctx, w, h, (x, y) => {
    const v = n(x, y);
    return lerpC([255, 214, 120], [255, 160, 64], v);
  });
}

const painters: Record<string, (ctx: CanvasRenderingContext2D, w: number, h: number) => void> = {
  sun,
  mercury,
  venus,
  earth,
  mars,
  jupiter,
  saturn,
  uranus: iceGiant("uranus", [132, 204, 206], [88, 168, 176]),
  neptune: iceGiant("neptune", [48, 92, 176], [88, 140, 214]),
  pluto,
};

export function createBodyTexture(body: Body) {
  const paint = painters[body.id] ?? ((ctx, w, h) => {
    ctx.fillStyle = body.swatch;
    ctx.fillRect(0, 0, w, h);
  });
  return canvasTexture(paint);
}

/**
 * Banding runs along u, which `ringUvs` remaps to the radial axis — v is the
 * angular axis, so every row is identical (a band must not vary with angle).
 */
export function createRingTexture() {
  return canvasTexture((ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      let alpha = 0;
      if (u > 0.18 && u < 0.42) alpha = 180;
      else if (u > 0.46 && u < 0.72) alpha = 150;
      else if (u > 0.76 && u < 0.96) alpha = 90;
      // Fine ringlet striation, so the bands don't read as flat blocks.
      const grain = ((x * 17) % 7) * 4;
      const col = 210 + grain;
      const a = alpha * (0.82 + (grain / 24) * 0.18);
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        d[i] = col;
        d[i + 1] = col - 16;
        d[i + 2] = col - 40;
        d[i + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, 1024, 8);
}

export function createGlowTexture() {
  return canvasTexture((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255, 230, 160, 1)");
    g.addColorStop(0.25, "rgba(255, 190, 90, 0.55)");
    g.addColorStop(0.55, "rgba(255, 140, 40, 0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, 256, 256);
}
