import type { WorkerEnv } from "../env";

/** Shared Sanity client config derived from worker env. */
export const sanityClientConfig = (env: WorkerEnv) => ({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: "2024-01-01" as const,
  token: env.SANITY_API_TOKEN,
});
