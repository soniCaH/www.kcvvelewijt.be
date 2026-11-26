import { Config, Effect, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import {
  aiAnswerDailyCap,
  allowMissingFormSecrets,
  bffSharedSecret,
  cacheLongTtl,
  footbalistoLogoCdnUrl,
  psdApi,
  psdImageBaseUrl,
  psdOndemandDailyBudget,
  resendApiKey,
  sanityApiToken,
  sanityDataset,
  sanityProjectId,
  sanityWebhookSecret,
  searchIndexName,
  searchIndexPruneDryRun,
  slackAlertWebhookUrl,
  slackBirthdayWebhookUrl,
  syncManualRun,
  turnstileSecret,
  workerConfigProvider,
} from "./config";

type Vars = Record<string, unknown>;

const load = <A>(config: Config.Config<A>, vars: Vars) =>
  Effect.runPromise(
    config.pipe(Effect.withConfigProvider(workerConfigProvider(vars))),
  );

const failure = <A>(config: Config.Config<A>, vars: Vars) =>
  Effect.runPromise(
    config.pipe(
      Effect.flip,
      Effect.withConfigProvider(workerConfigProvider(vars)),
    ),
  );

describe("required vars", () => {
  const required = [
    ["PSD_IMAGE_BASE_URL", psdImageBaseUrl],
    ["FOOTBALISTO_LOGO_CDN_URL", footbalistoLogoCdnUrl],
    ["SANITY_PROJECT_ID", sanityProjectId],
    ["SANITY_DATASET", sanityDataset],
  ] as const;

  it.each(required)(
    "%s is read as the string it holds",
    async (name, config) => {
      expect(await load(config, { [name]: "value" })).toBe("value");
    },
  );

  it.each(required)(
    "%s missing fails with an error naming it",
    async (name, config) => {
      expect(String(await failure(config, {}))).toContain(name);
    },
  );

  it.each(required)(
    "%s empty fails with an error naming it",
    async (name, config) => {
      expect(String(await failure(config, { [name]: "" }))).toContain(name);
    },
  );

  it("ignores a binding sitting next to the vars", async () => {
    const env = { SANITY_DATASET: "staging", PSD_CACHE: { get: () => null } };
    expect(await load(sanityDataset, env)).toBe("staging");
  });
});

describe("required secrets", () => {
  const secrets = [
    ["SANITY_API_TOKEN", sanityApiToken],
    ["SANITY_WEBHOOK_SECRET", sanityWebhookSecret],
  ] as const;

  it.each(secrets)("%s reads redacted", async (name, config) => {
    const value = await load(config, { [name]: "s3cret" });
    expect(Redacted.value(value)).toBe("s3cret");
    expect(String(value)).not.toContain("s3cret");
  });

  it.each(secrets)(
    "%s missing or empty fails naming it, never its value",
    async (name, config) => {
      expect(String(await failure(config, {}))).toContain(name);
      expect(String(await failure(config, { [name]: "" }))).toContain(name);
    },
  );

  it.each(["PSD_API_BASE_URL", "PSD_API_KEY", "PSD_API_CLUB", "PSD_API_AUTH"])(
    "the PSD credentials fail naming %s when it is missing",
    async (name) => {
      const vars: Vars = {
        PSD_API_BASE_URL: "https://psd.test",
        PSD_API_KEY: "k",
        PSD_API_CLUB: "c",
        PSD_API_AUTH: "a",
        [name]: undefined,
      };
      expect(String(await failure(psdApi, vars))).toContain(name);
    },
  );
});

describe("optional secrets", () => {
  const optional = [
    ["BFF_SHARED_SECRET", bffSharedSecret],
    ["RESEND_API_KEY", resendApiKey],
    ["TURNSTILE_SECRET", turnstileSecret],
    ["SLACK_ALERT_WEBHOOK_URL", slackAlertWebhookUrl],
    ["SLACK_BIRTHDAY_WEBHOOK_URL", slackBirthdayWebhookUrl],
  ] as const;

  it.each(optional)(
    "%s unset and empty both read as not set",
    async (name, config) => {
      expect(await load(config, {})).toBeUndefined();
      expect(await load(config, { [name]: "" })).toBeUndefined();
    },
  );

  it.each(optional)("%s set reads redacted", async (name, config) => {
    const value = await load(config, { [name]: "s3cret" });
    expect(value && Redacted.value(value)).toBe("s3cret");
    expect(String(value)).not.toContain("s3cret");
  });
});

describe("SEARCH_INDEX_NAME", () => {
  it("is undefined when unset, so the guard fails closed", async () => {
    expect(await load(searchIndexName, {})).toBeUndefined();
  });

  it.each(["kcvv-search", ""])("reads %j as it is", async (raw) => {
    expect(await load(searchIndexName, { SEARCH_INDEX_NAME: raw })).toBe(raw);
  });
});

// A switch is on for exactly its one value: unset, empty and every odd value
// (case, padding, a neighbour's value) is off.
describe.each([
  ["ALLOW_MISSING_FORM_SECRETS", allowMissingFormSecrets, "true"],
  ["CACHE_LONG_TTL", cacheLongTtl, "true"],
  ["SYNC_MANUAL_RUN", syncManualRun, "1"],
] as const)("%s", (name, config, on) => {
  it(`is on only for exactly ${JSON.stringify(on)}`, async () => {
    expect(await load(config, { [name]: on })).toBe(true);
  });

  it.each(
    [undefined, "", "TRUE", " true", "true ", "1 ", "0", "false", "yes"].filter(
      (raw) => raw !== on,
    ),
  )("reads %j as off", async (raw) => {
    expect(await load(config, { [name]: raw })).toBe(false);
  });
});

describe("SEARCH_INDEX_PRUNE_DRY_RUN", () => {
  it('is a live run only for exactly "false"', async () => {
    expect(
      await load(searchIndexPruneDryRun, {
        SEARCH_INDEX_PRUNE_DRY_RUN: "false",
      }),
    ).toBe(false);
  });

  it.each([undefined, "", "FALSE", " false", "false ", "0", "true", "no"])(
    "stays a dry run for %j",
    async (raw) => {
      expect(
        await load(searchIndexPruneDryRun, { SEARCH_INDEX_PRUNE_DRY_RUN: raw }),
      ).toBe(true);
    },
  );
});

describe.each([
  ["AI_ANSWER_DAILY_CAP", aiAnswerDailyCap],
  ["PSD_ONDEMAND_DAILY_BUDGET", psdOndemandDailyBudget],
] as const)("%s (a daily ceiling, #3468)", (name, config) => {
  it("accepts 0 as a kill switch that refuses everything", async () => {
    expect(await load(config, { [name]: "0" })).toBe(0);
  });

  it.each([
    ["2000", 2000],
    [" 850", 850],
    ["12abc", 12],
  ])("reads %j as %d", async (raw, expected) => {
    expect(await load(config, { [name]: raw })).toBe(expected);
  });

  it.each([undefined, "", "abc", "-1"])(
    "reads %j as no ceiling",
    async (raw) => {
      expect(await load(config, { [name]: raw })).toBeUndefined();
    },
  );
});
