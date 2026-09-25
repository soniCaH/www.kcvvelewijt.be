#!/usr/bin/env node
// Prefetch Adobe Typekit's Freight/Freight-Sans CSS + font files ONCE per VR
// run, into a gitignored local cache the test-runner serves from via
// `route.fulfill` (#3137, flake ledger class G — see #3108's root cause).
//
// Why this shape: Typekit's CSS ships Adobe's own Terms of Use, so unlike
// IBM Plex Mono (OFL, self-hosted permanently — see .storybook/fonts/) it
// cannot be committed to the repo or baked into `storybook-static` — CI
// uploads that directory as a public build artifact on a public repo, which
// would redistribute Adobe's files. `preview-head.html` keeps a live
// `<link>` to `use.typekit.net` so plain `pnpm storybook` dev just works;
// under the VR runner, `apps/web/.storybook/test-runner.ts`'s deny-by-default
// route intercepts that exact request and fulfils it from this cache
// instead of letting it (or the woff2 files it references) reach the real
// network.
//
// Run once per VR invocation from the `vr:run` package.json script (covers
// CI, which calls `vr:ci` -> `vr:run` per shard) and from
// `scripts/vr-docker.mjs` (covers local Docker runs, where the container
// mounts `.storybook` read-only and can't fetch for itself). NOT part of
// `build-storybook` / `vr:build-storybook` — those only produce
// `storybook-static`, which must never carry Adobe's files.
//
// Each network call is bounded (`FETCH_TIMEOUT_MS`) and falls back to
// whatever this cache already holds from a previous run if the fetch fails;
// with no prior cache to fall back to, it fails loudly instead of silently
// producing an empty/partial cache the test-runner would then have to
// explain away as "denied" requests.
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "../.storybook/.typekit-cache");
const FONTS_DIR = join(CACHE_DIR, "fonts");
const MANIFEST_PATH = join(CACHE_DIR, "manifest.json");

const KIT_CSS_URL = "https://use.typekit.net/cvo5raz.css";
const FETCH_TIMEOUT_MS = 10_000;

function loadExistingManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Fetch `url`, falling back to a previously-cached copy (if the manifest
 * already has one and its file is still on disk) when the fetch fails.
 * Throws when the fetch fails AND there is no prior cache — a silent empty
 * cache would just surface later as a confusing "denied" request in the VR
 * run instead of a clear failure here.
 */
async function fetchWithFallback(url, { existingManifest, asBuffer }) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`responded ${res.status}`);
    return {
      body: asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.text(),
      fromCache: false,
    };
  } catch (err) {
    const cached = existingManifest[url];
    const cachedPath = cached && join(CACHE_DIR, cached.file);
    if (cachedPath && existsSync(cachedPath)) {
      console.warn(
        `[prefetch-typekit] ${url} fetch failed (${err.message}); using the cached copy from a previous run`,
      );
      return {
        body: asBuffer ? readFileSync(cachedPath) : readFileSync(cachedPath, "utf8"),
        fromCache: true,
      };
    }
    throw new Error(
      `[prefetch-typekit] ${url} fetch failed and no cached copy exists: ${err.message}`,
    );
  }
}

/**
 * Every woff2 URL a `@font-face` block's `src:` list references. Typekit
 * lists three formats per face (woff2/woff/opentype) and doesn't encode the
 * format in the URL itself (no `.woff2` extension anywhere in it) — each
 * `src:` entry is a `url(…) format("…")` pair, and only the format token
 * says which is which. This runner only ever drives Chromium via Playwright
 * (see docs/agents/testing-ops.md, "The amd64 pin"), which always prefers
 * woff2 when offered, so only that format is ever actually requested and
 * only that one needs caching — the other two are dead weight here.
 */
function extractWoff2Urls(css) {
  const urls = [];
  for (const block of css.matchAll(/@font-face\s*\{[^}]*\}/g)) {
    const match =
      /url\((["']?)([^"')]+)\1\)\s*format\((["']?)woff2\3\)/.exec(block[0]);
    if (match) urls.push(match[2]);
  }
  return urls;
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });
  const existingManifest = loadExistingManifest();
  const manifest = {};

  const { body: kitCss } = await fetchWithFallback(KIT_CSS_URL, {
    existingManifest,
    asBuffer: false,
  });

  // Drop the kit's `@import url("https://p.typekit.net/p.css…")` — measured
  // (#3108) to return a 5-byte `/**/` stub. It carries no @font-face rules
  // (verified: neither freight-big-pro, freight-display-pro nor
  // freight-sans-pro's declarations live there — every one of the 19 rules
  // this kit ships is already inline in cvo5raz.css), so it is pure
  // analytics/tracking traffic serving no rendering purpose — stripped
  // rather than cached, one more off-machine request the VR run no longer
  // makes.
  const withoutImport = kitCss.replace(/@import\s+url\([^)]*\);?\s*/g, "");

  await writeFile(join(CACHE_DIR, "typekit.css"), withoutImport);
  manifest[KIT_CSS_URL] = { file: "typekit.css", contentType: "text/css" };

  const woff2Urls = extractWoff2Urls(withoutImport);
  await Promise.all(
    woff2Urls.map(async (url, i) => {
      const fileName = `${i}.woff2`;
      const { body } = await fetchWithFallback(url, {
        existingManifest,
        asBuffer: true,
      });
      await writeFile(join(FONTS_DIR, fileName), body);
      manifest[url] = { file: `fonts/${fileName}`, contentType: "font/woff2" };
    }),
  );

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(
    `[prefetch-typekit] cached typekit.css + ${woff2Urls.length} font file(s) to ${CACHE_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
