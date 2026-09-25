/**
 * Worker entry for the `workers` Vitest project (vitest.workers.config.ts +
 * wrangler.workerd-test.jsonc) — the real production entry (index.ts) is
 * NEVER used here.
 *
 * The `@cloudflare/vitest-plugin` pool needs a `main` module to boot workerd
 * from, and a Durable Object class can only be bound if it's exported from
 * that module (same rule index.ts's own comment states for the real
 * PSD_GATE binding). This file exists purely to satisfy that — it exports
 * the one DO class the workerd tests exercise directly (`gate-do.workerd.test.ts`)
 * and a placeholder `fetch` that nothing calls. Deliberately NOT the real
 * `src/index.ts`: that module's import graph pulls in Vectorize, Workers AI
 * and email bindings this test config never declares (see the split-rule
 * doc in apps/api/README.md), and none of that surface is what these tests
 * are for.
 */
export { PsdGate } from "../psd/gate-do";

export default {
  fetch: () => new Response("workerd test entry", { status: 200 }),
} satisfies ExportedHandler;
