import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/** A name the site serves at its first path segment, and where it came from. */
export interface TopLevelName {
  name: string;
  /** Human-readable origin (`app/(main)/club`), for the failure message. */
  origin: string;
}

type Sources = { source: string }[];

/**
 * Same shape check as `shortLink.name` (`SHORT_LINK_NAME_PATTERN`): a name that
 * cannot be a short link (`robots.txt`, `_next`, `[slug]`) can never clash with
 * one, so it is not worth reserving.
 */
const NAME = /^[a-z0-9-]+$/;

/** App-root convention files that serve a dotless URL (`/opengraph-image`). */
const DOTLESS_METADATA_ROUTE =
  /^(opengraph-image|twitter-image|icon|apple-icon)\.(?:tsx?|jsx?)$/;

/**
 * `/team/:slug` → `team`; `/:path*`, `/(a|b)/x` and `/` → `null` (the first
 * segment is a parameter, so it names nothing).
 */
export function firstSegmentOf(source: string): string | null {
  const segment = source.split("/")[1] ?? "";
  return segment === "" || /[:()*?+{}\\]/.test(segment) ? null : segment;
}

/** Folders directly under `dir`, through route groups `(…)`, minus private/dynamic/slot ones. */
function routeFolders(dir: string, relative: string): TopLevelName[] {
  const found: TopLevelName[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("(")) {
      found.push(...routeFolders(full, `${relative}/${entry}`));
    } else if (!/^[_[@]/.test(entry)) {
      found.push({ name: entry, origin: `${relative}/${entry}` });
    }
  }
  return found;
}

/**
 * Every top-level name the site already serves, so a short link must not take
 * it (#3573): the app router's route folders (through route groups, minus
 * private `_`, dynamic `[…]` and `@slot` folders, which includes the catch-all
 * itself), the first segment of each `redirects()` / `rewrites()` source, the
 * `public/` entries and the dotless metadata routes in the app root.
 */
export function collectTopLevelNames({
  appDir,
  publicDir,
  redirects,
  rewrites,
}: {
  appDir: string;
  publicDir: string;
  redirects: Sources;
  rewrites: Awaited<ReturnType<NonNullable<NextConfig["rewrites"]>>> | Sources;
}): TopLevelName[] {
  const fromSources = (label: string, sources: Sources): TopLevelName[] =>
    sources.flatMap(({ source }) => {
      const name = firstSegmentOf(source);
      return name ? [{ name, origin: `${label} ${source}` }] : [];
    });

  const fromRewrites = Array.isArray(rewrites)
    ? rewrites
    : [
        ...(rewrites.beforeFiles ?? []),
        ...(rewrites.afterFiles ?? []),
        ...(rewrites.fallback ?? []),
      ];

  const found: TopLevelName[] = [
    ...routeFolders(appDir, "app"),
    ...readdirSync(appDir).flatMap((entry) => {
      const match = DOTLESS_METADATA_ROUTE.exec(entry);
      return match ? [{ name: match[1], origin: `app/${entry}` }] : [];
    }),
    ...fromSources("redirects()", redirects),
    ...fromSources("rewrites()", fromRewrites),
    ...readdirSync(publicDir).map((entry) => ({
      name: entry,
      origin: `public/${entry}`,
    })),
  ];
  return found.filter(({ name }) => NAME.test(name));
}
