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
  SANITY_PROJECT_ID: "test",
  SANITY_DATASET: "test",
  SANITY_API_TOKEN: "test-token",
  AI: {} as Ai,
  SEARCH_INDEX: {} as VectorizeIndex,
};

export const testEnvLayer = Layer.succeed(WorkerEnvTag, defaultTestEnv);

export function makeTestEnvLayer(overrides: Partial<WorkerEnv> = {}) {
  return Layer.succeed(WorkerEnvTag, { ...defaultTestEnv, ...overrides });
}
