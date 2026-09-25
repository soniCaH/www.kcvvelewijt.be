import { configDefaults, defineConfig } from "vitest/config";

/**
 * The "node" project — pure logic, per the test-layer split rule in
 * apps/api/README.md. Everything that does NOT touch a live KV/DO binding
 * (business logic, transforms, schemas, Effect services provided with
 * `Layer.succeed`/mocks) runs here, on the plain Node runtime, exactly as
 * this whole suite did before #3145.
 *
 * `*.workerd.test.ts` is excluded — those files touch cache reads/writes,
 * TTL or single-flight through a REAL binding and belong to the sibling
 * "workers" project (vitest.workers.config.ts) instead.
 */
export default defineConfig({
  test: {
    name: "node",
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "src/**/*.workerd.test.ts"],
  },
});
