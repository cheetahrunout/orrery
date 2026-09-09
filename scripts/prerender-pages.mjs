#!/usr/bin/env node
/**
 * Static export for GitHub Pages.
 *
 * Nitro's own `static`/`github-pages` presets prerender to empty files on this
 * stack (nitro 3 beta + vite 8 + TanStack Start) and then fail the server
 * bundle step, so instead we build the `node` preset — which works — boot that
 * server, and capture `/` over real HTTP. One route, no server data, so a
 * single fetch is the whole site.
 *
 * Run after `PAGES_BASE=… vite build`. Writes:
 *   index.html   the rendered app shell
 *   404.html     same bytes, so deep links land on the hydrating app
 *   .nojekyll    or Pages' Jekyll pass drops any `_`-prefixed asset dir
 *   assets/, favicon.svg, …  copied from the build's public dir
 */
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverEntry = join(root, ".output/server/index.mjs");
const publicDir = join(root, ".output/public");
const outDir = join(root, process.env.PAGES_OUT_DIR || "dist-pages");
// Same normalisation as vite.config.ts: the workflow passes configure-pages'
// `base_path` straight through, which may or may not be punctuated with slashes.
const rawBase = process.env.PAGES_BASE?.trim() ?? "";
const base = rawBase.replace(/^\/+|\/+$/g, "") ? `/${rawBase.replace(/^\/+|\/+$/g, "")}/` : "/";
const port = Number(process.env.PAGES_PRERENDER_PORT || 3123);

if (!existsSync(serverEntry)) {
  console.error(`[pages] ${serverEntry} missing — run the build first.`);
  process.exit(1);
}

const server = spawn(process.execPath, [serverEntry], {
  env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

const stop = () => {
  if (!server.killed) server.kill("SIGTERM");
};
process.on("exit", stop);

/** The server needs a moment to bind; fail loudly rather than hang forever. */
async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}):\n${serverLog}`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      // A non-2xx from a listening server is a real failure, not a warm-up.
      throw new Error(`GET ${url} -> ${res.status}\n${(await res.text()).slice(0, 500)}`);
    } catch (err) {
      if (String(err).includes("->")) throw err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`server did not answer within ${timeoutMs}ms:\n${serverLog}`);
}

try {
  const url = `http://127.0.0.1:${port}${base}`;
  const res = await waitForServer(url);
  const html = await res.text();

  // An empty or shell-less body is exactly the silent failure this script
  // exists to avoid — refuse to publish it.
  if (html.length < 500 || !/<div id="?root|<body/i.test(html)) {
    throw new Error(`prerendered HTML looks empty (${html.length} bytes):\n${html.slice(0, 400)}`);
  }
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  if (!scripts.some((src) => src.startsWith(base))) {
    throw new Error(`asset URLs do not start with base ${base}: ${scripts.join(", ") || "(none)"}`);
  }

  const site = JSON.parse(await readFile(join(root, "src/lib/og/site.json"), "utf8"));
  const name = site.title || "App";

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  if (existsSync(publicDir)) await cp(publicDir, outDir, { recursive: true });
  await writeFile(join(outDir, "index.html"), html);
  // Pages serves 404.html for unknown paths. Reusing the prerendered shell
  // here hydrates it under the wrong URL (React error #418), and the app has
  // one route anyway — so redirect instead of rendering.
  await writeFile(
    join(outDir, "404.html"),
    `<!doctype html>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta http-equiv="refresh" content="0; url=${base}">
<script>location.replace(${JSON.stringify(base)})</script>
<a href="${base}">Continue to ${name}</a>
`,
  );
  await writeFile(join(outDir, ".nojekyll"), "");

  // The manifest is normally served by server/middleware/grok-pwa.ts, which a
  // static host doesn't run — emit it as a file so the <link rel="manifest">
  // in __root.tsx resolves instead of 404ing. Paths are base-relative.
  await mkdir(join(outDir, "__grok"), { recursive: true });
  await writeFile(
    join(outDir, "__grok/manifest.webmanifest"),
    JSON.stringify(
      {
        name,
        short_name: name,
        id: base,
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#07070c",
        theme_color: "#07070c",
        icons: [{ src: `${base}__grok/icon-180.png`, sizes: "180x180", type: "image/png" }],
      },
      null,
      2,
    ),
  );

  const bytes = (await readFile(join(outDir, "index.html"))).length;
  console.log(`[pages] wrote ${outDir} (index.html ${bytes} bytes, base ${base})`);
} finally {
  stop();
}
