import { Layer } from "effect";
import { WorkerEnvLive, type WorkerEnv, type WorkerEnvTag } from "../env";

/** The string vars and secrets a test may set on its fake `env`. The worker
 * reads them through `config.ts`; this type only keeps a fixture's names
 * honest. */
export type TestVars = Partial<
  Record<
    | "PSD_API_BASE_URL"
    | "PSD_IMAGE_BASE_URL"
    | "FOOTBALISTO_LOGO_CDN_URL"
    | "PSD_API_KEY"
    | "PSD_API_CLUB"
    | "PSD_API_AUTH"
    | "SANITY_PROJECT_ID"
    | "SANITY_DATASET"
    | "SANITY_API_TOKEN"
    | "SANITY_WEBHOOK_SECRET"
    | "SEARCH_INDEX_NAME"
    | "SEARCH_INDEX_PRUNE_DRY_RUN"
    | "AI_ANSWER_DAILY_CAP"
    | "PSD_ONDEMAND_DAILY_BUDGET"
    | "BFF_SHARED_SECRET"
    | "RESEND_API_KEY"
    | "TURNSTILE_SECRET"
    | "ALLOW_MISSING_FORM_SECRETS"
    | "SLACK_ALERT_WEBHOOK_URL"
    | "SLACK_BIRTHDAY_WEBHOOK_URL"
    | "SYNC_MANUAL_RUN"
    | "CACHE_LONG_TTL",
    string | undefined
  >
>;

/** What a test hands the worker as `env`: the bindings plus the string vars. */
export type TestEnv = WorkerEnv & TestVars;

const defaultTestEnv: TestEnv = {
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
  // Rate limiters that always allow — a test of the limits passes its own.
  SEARCH_IP_LIMITER: { limit: async () => ({ success: true }) },
  SEARCH_GLOBAL_LIMITER: { limit: async () => ({ success: true }) },
  SANITY_WEBHOOK_SECRET: "test-webhook-secret",
};

/** The raw env object — defaults merged with `overrides` (an `undefined`
 * override leaves the var unset). Use this when a test needs the plain env
 * value itself (e.g. to compose it into a
 * `Layer.mergeAll(...).pipe(Layer.provide(...))` alongside other services,
 * or to build several env variants before wrapping just one in a Layer)
 * rather than an already-built layer. `makeTestEnvLayer` builds on this, so
 * there is one source of truth for the defaults. */
export const makeTestEnv = (overrides: Partial<TestEnv> = {}): TestEnv => ({
  ...defaultTestEnv,
  ...overrides,
});

export const testEnvLayer = WorkerEnvLive(defaultTestEnv);

export const makeTestEnvLayer = (
  overrides: Partial<TestEnv> = {},
): Layer.Layer<WorkerEnvTag> => WorkerEnvLive(makeTestEnv(overrides));
