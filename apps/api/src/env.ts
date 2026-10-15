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
  readonly SEARCH_INDEX_NAME?: string; // per-environment name of the index SEARCH_INDEX is bound to (mirrors wrangler.toml's [[vectorize]].index_name — Wrangler doesn't expose it at runtime). Read by the webhook's dataset/index guard (webhooks/index-handler.ts, #2833); absent → guard refuses, fail closed
  readonly SEARCH_IP_LIMITER: RateLimit; // [[ratelimits]] 10/60 s per visitor, key `ip:{x-kcvv-client-ip}` — runs before the search cache (#3468)
  readonly SEARCH_GLOBAL_LIMITER: RateLimit; // [[ratelimits]] 120/60 s, key `global` — runs on a search cache miss only (#3468)
  readonly AI_ANSWER_DAILY_CAP?: string; // [vars] — AI answers per UTC day; at or over it /search returns results without `answer` (#3468). Unset → no cap
  readonly PSD_GATE: DurableObjectNamespace; // global PSD rate-limit + single-flight gate (see psd/gate.ts)
  readonly BFF_SHARED_SECRET?: string; // wrangler secret; required — every route except `/webhooks/index` refuses without it (#3485). Same value as the web app's server-only BFF_SHARED_SECRET, sent as the `x-kcvv-bff-key` header
  readonly SANITY_WEBHOOK_SECRET: string; // Sanity webhook signing secret (same value as on the Sanity hook) — wrangler secret
  readonly RESEND_API_KEY?: string; // Resend transactional email — wrangler secret (absent without ALLOW_MISSING_FORM_SECRETS → dispatch fails with EmailDeliveryError)
  readonly TURNSTILE_SECRET?: string; // Cloudflare Turnstile secret — wrangler secret (absent without ALLOW_MISSING_FORM_SECRETS → verification fails closed)
  readonly ALLOW_MISSING_FORM_SECRETS?: string; // "true" only in .dev.vars — lets a missing TURNSTILE_SECRET / RESEND_API_KEY skip verification / dispatch with a warning (#3464). Never set in wrangler.toml, never a secret: anything else, or unset, fails closed
  readonly SLACK_ALERT_WEBHOOK_URL?: string; // Slack incoming-webhook for PSD incident/drift alerts — wrangler secret (absent locally → alerting is a no-op)
  readonly PSD_ONDEMAND_DAILY_BUDGET?: string; // [vars] — once today's psd:calls counter reaches it, a cold cache miss fails fast with no PSD call (#3468). Unset → no budget
  readonly SYNC_MANUAL_RUN?: string; // "1" only via `scripts/trigger-psd-sync.sh` (`wrangler dev --var`) — the PSD sync then skips cycle-end reconciliation and every accumulator write/clear, so a hand-run team never touches nightly-cycle state (#3465). Never set in wrangler.toml
  readonly CACHE_LONG_TTL?: string; // "true" on staging — overrides hardTtl to 365 days
  readonly SEARCH_INDEX_PRUNE_DRY_RUN?: string; // "false" since the sweep's prune step was checked against the live index (#2857); set it back to "true" to re-arm dry-run, where sanity-index-sync.ts logs the delete set instead of calling deleteByIds. Fails safe: anything other than the literal "false" is treated as dry-run (#2831)
}

export class WorkerEnvTag extends Context.Tag("WorkerEnv")<
  WorkerEnvTag,
  WorkerEnv
>() {}
