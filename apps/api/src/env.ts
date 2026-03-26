import { Context } from "effect";

export interface WorkerEnv {
  readonly PSD_API_BASE_URL: string; // https://clubapi.prosoccerdata.com
  readonly PSD_IMAGE_BASE_URL: string; // https://kcvv.prosoccerdata.com — club subdomain that serves player images
  readonly FOOTBALISTO_LOGO_CDN_URL: string;
  readonly PSD_API_KEY: string; // wrangler secret
  readonly PSD_API_CLUB: string; // wrangler secret
  readonly PSD_API_AUTH: string; // wrangler secret (Authorization header value)
  readonly PSD_CACHE: KVNamespace;
  readonly SANITY_PROJECT_ID: string; // "vhb33jaz"
  readonly SANITY_DATASET: string; // "production" or "staging"
  readonly SANITY_API_TOKEN: string; // write token — wrangler secret
  readonly AI: Ai; // Workers AI binding
  readonly SEARCH_INDEX: VectorizeIndex; // Vectorize vector store
  readonly SANITY_WEBHOOK_SECRET: string; // SVIX signing secret — wrangler secret
  readonly CACHE_LONG_TTL?: string; // "true" on staging — overrides hardTtl to 365 days
}

export class WorkerEnvTag extends Context.Tag("WorkerEnv")<
  WorkerEnvTag,
  WorkerEnv
>() {}
