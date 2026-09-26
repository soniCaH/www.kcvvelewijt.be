#!/usr/bin/env node
// Prints this worktree's derived e2e dev-server port (#3141 finding 9) — the
// `e2e:port` package.json script. Use it to run against an already-started
// server instead of letting Playwright start its own (which never reuses one
// under `reuseExistingServer: false`, playwright.config.ts):
//
//   BASE_URL=http://localhost:$(pnpm --filter @kcvv/web run --silent e2e:port) \
//     pnpm --filter @kcvv/web run test:e2e
//
// Kept out of e2e-dev-port.mjs on purpose — that module is `import`ed by
// test/e2e/playwright.config.ts through Playwright's own loader, which
// breaks on a module touching `import.meta.url` at import time.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { derivePort } from "./e2e-dev-port.mjs";

/** The exact directory `test/e2e/playwright.config.ts` derives its port from. */
export function e2eConfigDir() {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "test", "e2e");
}

function main() {
  console.log(derivePort(e2eConfigDir()));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
