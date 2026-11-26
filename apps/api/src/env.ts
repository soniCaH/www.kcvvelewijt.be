import { Context, Layer } from "effect";
import { workerConfigProvider } from "./config";

/**
 * The Worker's bindings: objects, not strings. Every string var and secret is
 * decoded in `config.ts`, never read off `env`.
 */
export interface WorkerEnv {
  readonly PSD_CACHE: KVNamespace;
  readonly AI: Ai; // Workers AI binding
  readonly SEARCH_INDEX: VectorizeIndex; // Vectorize vector store
  readonly SEARCH_IP_LIMITER: RateLimit; // [[ratelimits]] 10/60 s per visitor, key `ip:{x-kcvv-client-ip}` — runs before the search cache (#3468)
  readonly SEARCH_GLOBAL_LIMITER: RateLimit; // [[ratelimits]] 120/60 s, key `global` — runs on a search cache miss only (#3468)
  readonly PSD_GATE: DurableObjectNamespace; // global PSD rate-limit + single-flight gate (see psd/gate.ts)
}

export class WorkerEnvTag extends Context.Tag("WorkerEnv")<
  WorkerEnvTag,
  WorkerEnv
>() {}

/** The Worker's env as a layer: the bindings as `WorkerEnvTag`, and its string
 * vars as the config provider that `config.ts` reads from. */
export const WorkerEnvLive = (env: WorkerEnv) =>
  Layer.merge(
    Layer.succeed(WorkerEnvTag, env),
    Layer.setConfigProvider(workerConfigProvider(env)),
  );
