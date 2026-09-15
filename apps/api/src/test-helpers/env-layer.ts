import { Layer } from "effect";
import { WorkerEnvTag, type WorkerEnv } from "../env";

const defaultTestEnv: WorkerEnv = {
  PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
  PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
  FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
  PSD_API_KEY: "test-key",
  PSD_API_CLUB: "test-club",
  PSD_API_AUTH: "test-auth",
  PSD_CACHE: {} as KVNamespace,
  PSD_GATE: {} as DurableObjectNamespace,
  SANITY_PROJECT_ID: "test",
  SANITY_DATASET: "test",
  SANITY_API_TOKEN: "test-token",
  AI: {} as Ai,
  SEARCH_INDEX: {} as VectorizeIndex,
  SANITY_WEBHOOK_SECRET: "test-webhook-secret",
};

/** The raw `WorkerEnv` object — defaults merged with `overrides`. Use this
 * when a test needs the plain env value itself (e.g. to compose it into a
 * `Layer.mergeAll(...).pipe(Layer.provide(...))` alongside other services,
 * or to build several env variants before wrapping just one in a Layer)
 * rather than an already-built `Layer<WorkerEnvTag>`. `makeTestEnvLayer`
 * builds on this, so there is one source of truth for the defaults. */
export function makeTestEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return { ...defaultTestEnv, ...overrides };
}

export const testEnvLayer = Layer.succeed(WorkerEnvTag, defaultTestEnv);

export function makeTestEnvLayer(overrides: Partial<WorkerEnv> = {}) {
  return Layer.succeed(WorkerEnvTag, makeTestEnv(overrides));
}
