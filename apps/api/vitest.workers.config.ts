import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineProject } from "vitest/config";

/**
 * The "workers" project — runtime semantics that only a real workerd can
 * prove, per the test-layer split rule in apps/api/README.md: cache
 * read/write, TTL/expiry, and single-flight coordination through the actual
 * PSD_CACHE (KV) and PSD_GATE (Durable Object) bindings, via Miniflare
 * (see wrangler.workerd-test.jsonc — a minimal, test-only Worker config,
 * never the real wrangler.toml).
 *
 * Deliberately small: this is the ONE place in the suite that pays workerd's
 * boot cost, so only `*.workerd.test.ts` files land here — everything else
 * stays on the "node" project (vitest.node.config.ts).
 */
export default defineProject({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.workerd-test.jsonc" },
    }),
  ],
  test: {
    name: "workers",
    include: ["src/**/*.workerd.test.ts"],
  },
});
