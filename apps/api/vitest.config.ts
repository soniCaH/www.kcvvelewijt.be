import { defineConfig } from "vitest/config";

/**
 * Root aggregator — runs both Vitest projects (`vitest run` /
 * `vitest run --coverage` picks this file up automatically). See
 * apps/api/README.md for the test-layer split rule this implements:
 * "node" (vitest.node.config.ts) for pure logic, "workers"
 * (vitest.workers.config.ts) for cache/TTL/single-flight semantics that
 * need a real workerd.
 *
 * `coverage` lives here, not on either project: per Vitest 4's docs, a root
 * config's `coverage` (like `reporters`/`globalSetup`) applies globally
 * regardless of per-project settings, which is what lets ONE coverage run
 * span both projects.
 *
 * Provider is `istanbul`, not the default `v8` — v8 collects coverage via
 * Node's V8 inspector API (`node:inspector/promises`), which does not exist
 * inside workerd. Running `--coverage` with the v8 provider crashes the
 * `workers` project outright (see Cloudflare's own known-issues doc: "Native
 * code coverage via V8 is not supported. You must use instrumented code
 * coverage via Istanbul instead."). Istanbul instruments source at
 * transform time, so it works the same way in both projects.
 */
export default defineConfig({
  test: {
    projects: ["./vitest.node.config.ts", "./vitest.workers.config.ts"],
    coverage: {
      provider: "istanbul",
    },
  },
});
