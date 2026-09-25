#!/usr/bin/env node
// Prefetch Adobe Typekit's Freight/Freight-Sans CSS + font files ONCE per run,
// into a local static directory Storybook serves from disk (#3137, flake
// ledger class G — see #3108's root cause).
//
// Why this exists: Typekit's CSS ships Adobe's own Terms of Use, so unlike
// IBM Plex Mono (OFL, self-hosted permanently — see
// public/fonts/ibm-plex-mono/) it cannot be committed to the repo. The VR
// runner's deny-by-default network route (apps/web/.storybook/test-runner.ts
// `prepare`) means a live `<link>` to use.typekit.net would 404 during every
// story capture — this script is what makes the substitution possible: fetch
// the kit once, before Storybook builds, and serve it from the same origin
// the runner already allows.
//
// Run before `storybook build` — see the `build-storybook` / `vr:build-storybook`
// package.json scripts. Idempotent and safe to re-run; always refetches (no
// run-to-run caching of its own — "once per run" means once per invocation of
// this script, not once ever, so a font update on Adobe's end is picked up
// the next time anyone builds Storybook).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "../.storybook/.typekit-cache");
const FONTS_DIR = join(CACHE_DIR, "fonts");

const KIT_CSS_URL = "https://use.typekit.net/cvo5raz.css";

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[prefetch-typekit] ${url} responded ${res.status}`);
  }
  return res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[prefetch-typekit] ${url} responded ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Rewrite one `@font-face` block's `src:` declaration to a single local
 * woff2 reference, downloading that file as a side effect.
 *
 * Typekit's CSS lists three formats per face (woff2/woff/opentype) — this
 * runner only ever drives Chromium via Playwright (see
 * docs/agents/testing-ops.md, "The amd64 pin"), which always prefers woff2,
 * so the other two formats are dead weight here and are dropped rather than
 * mirrored.
 */
function rewriteFontFace(block, downloads) {
  return block.replace(
    /src:([^;]+);/,
    (fullMatch, srcList) => {
      // Typekit doesn't encode the format in the URL (no `.woff2` extension
      // anywhere in it) — each `src:` entry is a `url(…) format("…")` pair,
      // and only the format token says which is which. Match the pair whose
      // format is woff2.
      const woff2Match = /url\((["']?)([^"')]+)\1\)\s*format\((["']?)woff2\3\)/.exec(
        srcList,
      );
      if (!woff2Match) return fullMatch; // leave untouched — nothing to rewrite
      const remoteUrl = woff2Match[2];
      const fileName = `${downloads.length}.woff2`;
      downloads.push({ remoteUrl, fileName });
      return `src:url("./fonts/${fileName}") format("woff2");`;
    },
  );
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });

  const kitCss = await fetchText(KIT_CSS_URL);

  // Drop the kit's `@import url("https://p.typekit.net/p.css…")` — measured
  // (#3108) to return a 5-byte `/**/` stub. It carries no @font-face rules
  // (verified: neither freight-big-pro, freight-display-pro nor
  // freight-sans-pro's declarations live there — every one of the 19 rules
  // this kit ships is already inline in cvo5raz.css), so it is pure
  // analytics/tracking traffic. Serving it locally would mean shipping a
  // permanently-empty local stub just to satisfy an `@import` that does
  // nothing — stripping it is the smaller, honest fix, and it is one more
  // off-machine request the VR run no longer makes.
  const withoutImport = kitCss.replace(/@import\s+url\([^)]*\);?\s*/g, "");

  const downloads = [];
  const rewritten = withoutImport.replace(
    /@font-face\s*\{[^}]*\}/g,
    (block) => rewriteFontFace(block, downloads),
  );

  await Promise.all(
    downloads.map(async ({ remoteUrl, fileName }) => {
      const bytes = await fetchBuffer(remoteUrl);
      await writeFile(join(FONTS_DIR, fileName), bytes);
    }),
  );

  await writeFile(join(CACHE_DIR, "typekit.css"), rewritten);

  console.log(
    `[prefetch-typekit] wrote typekit.css + ${downloads.length} font file(s) to ${CACHE_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
