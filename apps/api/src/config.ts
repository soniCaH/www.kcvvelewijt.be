/**
 * Every string var and secret of the Worker, decoded once and in one place.
 * `env.ts` keeps the bindings (KV, Ai, Vectorize, Durable Objects); a string
 * var never gets read off `env` anywhere else.
 *
 * - A required var is a `Schema.Config` (missing or empty → a `ConfigError`
 *   that names it, raised by the read that needs it, not at boot). A secret is
 *   `Redacted`, so a log line or a thrown error never carries its value.
 * - An optional var keeps the default its old hand parser had: unset, empty
 *   and odd values all land on it.
 *
 * `workerConfigProvider(env)` feeds these from the Worker's own `env`; each
 * entry point installs it (`WorkerEnvLive` in `env.ts`, or
 * `Effect.withConfigProvider`).
 */
import {
  Config,
  ConfigProvider,
  type ConfigError,
  Effect,
  Option,
  Redacted,
  Schema,
} from "effect";

/** The vars of the Worker `env`: strings, and the numbers and booleans a
 * `wrangler.toml` `[vars]` entry may hold unquoted (`fromJson` reads them as
 * their string). Bindings are objects and stay out of the provider: `fromJson`
 * would walk into them. */
export const workerConfigProvider = (env: object) =>
  ConfigProvider.fromJson(
    Object.fromEntries(
      Object.entries(env).filter(
        ([, value]) => typeof value !== "object" && typeof value !== "function",
      ),
    ),
  );

const text = (name: string) => Schema.Config(name, Schema.NonEmptyString);

const secret = (name: string) =>
  text(name).pipe(Config.map((value) => Redacted.make(value)));

/** Unset and empty are both "not set". */
const optionalSecret = (name: string) =>
  Config.string(name).pipe(
    Config.withDefault(""),
    Config.map((value) => (value === "" ? undefined : Redacted.make(value))),
  );

/** On only for exactly `on`; unset, empty and anything else is off. */
const flag = (name: string, on: string) =>
  Config.string(name).pipe(
    Config.withDefault(""),
    Config.map((value) => value === on),
  );

/** A non-negative integer ceiling, or `undefined` (no ceiling) when the var is
 * unset or not a number. `0` is accepted on purpose: it refuses everything, a
 * kill switch. */
const ceiling = (name: string) =>
  Config.string(name).pipe(
    Config.withDefault(""),
    Config.map((raw) => {
      const n = Number.parseInt(raw, 10);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    }),
  );

// ─── PSD ──────────────────────────────────────────────────────────────────────

/** Everything one PSD call needs. */
export const psdApi = Config.all({
  baseUrl: text("PSD_API_BASE_URL"), // https://clubapi.prosoccerdata.com
  apiKey: secret("PSD_API_KEY"),
  club: secret("PSD_API_CLUB"),
  auth: secret("PSD_API_AUTH"), // the Authorization header value
});

/** What one PSD call needs: the base URL and the request headers. */
export const psdApiRequest = psdApi.pipe(
  Config.map(({ baseUrl, apiKey, club, auth }) => ({
    baseUrl,
    headers: {
      "x-api-key": Redacted.value(apiKey),
      "x-api-club": Redacted.value(club),
      Authorization: Redacted.value(auth),
      "Accept-Language": "nl-BE",
      "Content-Type": "application/json",
    },
  })),
);

/** Club subdomain that serves player images. */
export const psdImageBaseUrl = text("PSD_IMAGE_BASE_URL");
export const footbalistoLogoCdnUrl = text("FOOTBALISTO_LOGO_CDN_URL");

/** Once the PsdGate's daily call count reaches it, a cold cache miss fails fast
 * with no PSD call (#3468). Unset → no budget. */
export const psdOndemandDailyBudget = ceiling("PSD_ONDEMAND_DAILY_BUDGET");

// ─── Sanity ───────────────────────────────────────────────────────────────────

export const sanityProjectId = text("SANITY_PROJECT_ID");
/** "production" or "staging". */
export const sanityDataset = text("SANITY_DATASET");
/** The write token. Optional: without one the client reads anonymously. */
export const sanityApiToken = optionalSecret("SANITY_API_TOKEN");
/** Signing secret of the Sanity webhooks; the same value is set on the hook. */
export const sanityWebhookSecret = secret("SANITY_WEBHOOK_SECRET");

// ─── Search ───────────────────────────────────────────────────────────────────

/** Per-environment name of the index `SEARCH_INDEX` is bound to (mirrors
 * wrangler.toml's `[[vectorize]].index_name`, which the runtime does not
 * expose). Absent → the dataset/index guard refuses, fail closed (#2833). */
export const searchIndexName = Config.string("SEARCH_INDEX_NAME").pipe(
  Config.option,
  Config.map(Option.getOrUndefined),
);

/** AI answers per UTC day; at or over it /search returns results without an
 * `answer` (#3468). Unset → no cap. */
export const aiAnswerDailyCap = ceiling("AI_ANSWER_DAILY_CAP");

/** Fails safe: a dry run unless exactly `"false"`, so an absent var or a typo
 * never starts deleting production vectors (#2831). */
export const searchIndexPruneDryRun = Config.string(
  "SEARCH_INDEX_PRUNE_DRY_RUN",
).pipe(
  Config.withDefault(""),
  Config.map((value) => value !== "false"),
);

// ─── Front door, forms, alerts ────────────────────────────────────────────────

/** Every route except `/webhooks/*` refuses without it (#3485). Same value as
 * the web app's server-only `BFF_SHARED_SECRET`. */
export const bffSharedSecret = optionalSecret("BFF_SHARED_SECRET");

export const resendApiKey = optionalSecret("RESEND_API_KEY");
export const turnstileSecret = optionalSecret("TURNSTILE_SECRET");
/** `"true"` only in .dev.vars: a missing TURNSTILE_SECRET / RESEND_API_KEY then
 * skips verification / dispatch with a warning (#3464). Anything else fails
 * closed. */
export const allowMissingFormSecrets = flag(
  "ALLOW_MISSING_FORM_SECRETS",
  "true",
);

/** Absent locally and on staging → alerting is a no-op. */
export const slackAlertWebhookUrl = optionalSecret("SLACK_ALERT_WEBHOOK_URL");
export const slackBirthdayWebhookUrl = optionalSecret(
  "SLACK_BIRTHDAY_WEBHOOK_URL",
);

// ─── Switches ─────────────────────────────────────────────────────────────────

/** `"true"` on staging: overrides the hard TTL to 365 days. */
export const cacheLongTtl = flag("CACHE_LONG_TTL", "true");

/** `"1"` only via `scripts/trigger-psd-sync.sh`: the PSD sync then skips
 * cycle-end reconciliation and every accumulator write/clear (#3465). */
export const syncManualRun = flag("SYNC_MANUAL_RUN", "1");

/** Logs a ConfigError, which names the var. */
export const logConfigError = (error: ConfigError.ConfigError) =>
  Effect.logError(`[config] ${error}`);

/** A missing or malformed var is a deploy mistake, not something a caller
 * recovers from: log it (the ConfigError names the var; a request's 500 would
 * not) and die with it. */
export const dieOnConfigError = <A, R>(
  read: Effect.Effect<A, ConfigError.ConfigError, R>,
): Effect.Effect<A, never, R> =>
  read.pipe(Effect.tapError(logConfigError), Effect.orDie);
