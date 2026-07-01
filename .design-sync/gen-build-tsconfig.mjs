// Regenerates .design-sync/tsconfig.build.json.
//
// Why this exists: the design-sync esbuild bundler resolves `@/*` via a
// tsconfig-paths plugin whose ext-probe list starts with the empty string, so
// an `@/x/Button` alias that points at a DIRECTORY resolves to the directory
// (EISDIR) instead of its index file. We can't fork the bundler, so we emit an
// EXACT `paths` entry per directory-alias import (ordered before the `@/*`
// wildcard so the exact rule wins) that points straight at the index file.
//
// Run from repo root:  node .design-sync/gen-build-tsconfig.mjs
import { execSync } from "node:child_process";
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "apps/web/src";
// Cover every source extension so an `@/…/Dir` alias in a .js/.jsx/.mjs/.cjs
// file isn't missed (it would fall back to the `@/*` wildcard → EISDIR).
const INCLUDES = ["ts", "tsx", "js", "jsx", "mjs", "cjs"]
  .map((e) => `--include='*.${e}'`)
  .join(" ");
const raw = execSync(
  `grep -rhoE "from ['\\"]@/[^'\\"]+['\\"]|import\\(['\\"]@/[^'\\"]+['\\"]\\)" ${SRC} .design-sync/entry.ts ${INCLUDES}`,
  { encoding: "utf8" },
);
const specs = new Set();
for (const line of raw.split("\n")) {
  const m = line.match(/@\/[^'"]+/);
  if (m) specs.add(m[0]);
}

const exact = {};
for (const spec of [...specs].sort()) {
  const rel = spec.slice(2); // strip "@/"
  const abs = join(SRC, rel);
  const isFile =
    [".ts", ".tsx", ".js", ".jsx", ".mjs"].some((e) => existsSync(abs + e)) ||
    (existsSync(abs) && statSync(abs).isFile());
  const isDir = existsSync(abs) && statSync(abs).isDirectory();
  if (isDir && !isFile) {
    const idx = ["index.ts", "index.tsx", "index.js", "index.jsx"].find((i) =>
      existsSync(join(abs, i)),
    );
    if (idx) exact[spec] = [`../${SRC}/${rel}/${idx}`];
  }
}

// Exact dir entries FIRST, then the wildcards (rules are matched in order).
const paths = {
  ...exact,
  "@/*": [`../${SRC}/*`],
  "next/image": ["./shims/next-image.tsx"],
  "next/link": ["./shims/next-link.tsx"],
  "next/navigation": ["./shims/next-navigation.tsx"],
  "next/script": ["./shims/next-script.tsx"],
};

const out = { compilerOptions: { jsx: "react-jsx", baseUrl: ".", paths } };
writeFileSync(".design-sync/tsconfig.build.json", JSON.stringify(out, null, 2) + "\n");
console.log(`wrote tsconfig.build.json — ${Object.keys(exact).length} dir-alias entries`);
