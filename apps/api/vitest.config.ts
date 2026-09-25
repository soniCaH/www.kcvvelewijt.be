import { defineConfig } from "vitest/config";

/**
 * Root aggregator — runs both Vitest projects (`vitest run` /
 * `vitest run --coverage` picks this file up automatically). See
 * apps/api/README.md for the test-layer split rule this implements:
 * "node" (vitest.node.config.ts) for pure logic, "workers"
 * (vitest.workers.config.ts) for cache/TTL/single-flight semantics that
 * need a real workerd.
 */
export default defineConfig({
  test: {
    projects: ["./vitest.node.config.ts", "./vitest.workers.config.ts"],
  },
});
