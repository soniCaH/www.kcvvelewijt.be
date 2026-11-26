import { describe, it, expect, vi } from "vitest";
import { Cause, Effect, Exit, Layer, Logger, Option } from "effect";
import type { MembershipRequest } from "@kcvv/api-contract";
import {
  SanityMutation,
  type SanityMutationInterface,
} from "../sanity/mutation";
import { SanityProjection, type FormRoutingConfig } from "../sanity/projection";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import {
  EmailDeliveryError,
  EmailTransport,
  type EmailTransportInterface,
} from "../email/resend";
import { makeTestEnvLayer, type TestEnv } from "../test-helpers/env-layer";
import {
  decodeMembership,
  validMembershipRaw,
} from "../test-helpers/membership-request";
import { makeSanityProjectionStub } from "../test-helpers/sanity-projection-stub";
import { handleMembership } from "./forms";

const validRaw = validMembershipRaw;
const decode = decodeMembership;

const validPayload = decode(validRaw);

function makeMutationMock(
  writeImpl?: SanityMutationInterface["writeMembershipApplication"],
): SanityMutationInterface {
  return {
    upsertPlayer: () => Effect.succeed(undefined),
    upsertTeam: () => Effect.succeed(undefined),
    upsertStaff: () => Effect.succeed(undefined),
    uploadPlayerImage: () => Effect.succeed(undefined),
    uploadStaffImage: () => Effect.succeed(undefined),
    unsetPlayerImage: () => Effect.succeed(undefined),
    unsetStaffImage: () => Effect.succeed(undefined),
    archivePlayers: () => Effect.succeed(undefined),
    archiveStaff: () => Effect.succeed(undefined),
    archiveTeams: () => Effect.succeed(undefined),
    writeMembershipApplication: writeImpl ?? (() => Effect.succeed(undefined)),
    writeDartsSignup: () => Effect.succeed(undefined),
  };
}

const projectionMock = makeSanityProjectionStub();

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
  durable: noopDurableKv,
};

function run(
  payload: MembershipRequest,
  opts: {
    write?: SanityMutationInterface["writeMembershipApplication"];
    dispatch?: EmailTransportInterface["dispatchEmail"];
    routing?: FormRoutingConfig;
    /** The KV copy of the routing config, as a raw string. */
    cached?: string;
    env?: Partial<TestEnv>;
    errors?: string[];
  } = {},
) {
  const emailMock: EmailTransportInterface = {
    dispatchEmail: opts.dispatch ?? (() => Effect.succeed(undefined)),
  };
  const layer = Layer.mergeAll(
    Layer.succeed(SanityMutation, makeMutationMock(opts.write)),
    Layer.succeed(SanityProjection, {
      ...projectionMock,
      getFormRoutingConfig: () => Effect.succeed(opts.routing ?? null),
    }),
    Layer.succeed(KvCacheService, {
      ...cacheMock,
      get: () => Effect.succeed(opts.cached ?? null),
    }),
    Layer.succeed(EmailTransport, emailMock),
    // no TURNSTILE_SECRET → verification skipped by the dev flag
    makeTestEnvLayer({ ALLOW_MISSING_FORM_SECRETS: "true", ...opts.env }),
  );
  const logger = Logger.replace(
    Logger.defaultLogger,
    Logger.make(({ logLevel, message }) => {
      if (logLevel._tag === "Error") opts.errors?.push(String(message));
    }),
  );
  return Effect.runPromiseExit(
    handleMembership(payload).pipe(
      Effect.provide(layer),
      Effect.provide(logger),
    ),
  );
}

describe("handleMembership", () => {
  it("persists and returns ok for a valid adult submission", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const dispatch = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(validPayload, { write, dispatch });

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    // applicant ack + admin notification (no parent for an adult)
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it("still persists and returns ok when email dispatch fails, logging an error", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const errors: string[] = [];
    const exit = await run(validPayload, {
      write,
      errors,
      dispatch: () => Effect.fail(new EmailDeliveryError("Resend down")),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    // applicant ack + admin notification both failed → two error logs
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("email dispatch failed");
  });

  it("rejects the submission without persisting when no Turnstile secret is set and the dev flag is off", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(validPayload, {
      write,
      env: { ALLOW_MISSING_FORM_SECRETS: undefined },
    });

    expect(Exit.isFailure(exit)).toBe(true);
    expect(write).not.toHaveBeenCalled();
  });

  it("persists the remark", async () => {
    const write = vi.fn<SanityMutationInterface["writeMembershipApplication"]>(
      () => Effect.succeed(undefined),
    );
    await run(decode({ ...validRaw, remark: "Mijn zoon is keeper." }), {
      write,
    });

    expect(write.mock.calls[0]![0].remark).toBe("Mijn zoon is keeper.");
  });

  it("persists and mails a submission without gender and municipality, with no empty rows", async () => {
    const write = vi.fn<SanityMutationInterface["writeMembershipApplication"]>(
      () => Effect.succeed(undefined),
    );
    const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
      Effect.succeed(undefined),
    );
    const { gender: _g, municipality: _m, ...rest } = validRaw;
    const exit = await run(decode(rest), { write, dispatch });

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    const doc = write.mock.calls[0]![0];
    expect(doc.gender).toBeUndefined();
    expect(doc.municipality).toBeUndefined();
    const admin = dispatch.mock.calls.at(-1)![0];
    for (const body of [admin.text, admin.html]) {
      expect(body).not.toContain("Geslacht");
      expect(body).not.toContain("Gemeente");
    }
  });

  it("persists and mails gender and municipality when a client still sends them", async () => {
    const write = vi.fn<SanityMutationInterface["writeMembershipApplication"]>(
      () => Effect.succeed(undefined),
    );
    const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await run(validPayload, { write, dispatch });

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write.mock.calls[0]![0]).toMatchObject({
      gender: "m",
      municipality: "Elewijt",
    });
    const admin = dispatch.mock.calls.at(-1)![0];
    expect(admin.text).toContain("Man");
    expect(admin.text).toContain("Elewijt");
  });

  it("drops a honeypot submission without persisting", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(decode({ ...validRaw, company: "spam-bot" }), {
      write,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write).not.toHaveBeenCalled();
  });

  it("rejects a minor without parent fields (400 with field errors)", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(decode({ ...validRaw, birthDate: "2012-01-01" }), {
      write,
    });

    expect(Exit.isFailure(exit)).toBe(true);
    expect(write).not.toHaveBeenCalled();
    if (Exit.isFailure(exit)) {
      const error = JSON.stringify(exit.cause);
      expect(error).toContain("parentEmail");
    }
  });

  it("sends a parent acknowledgment for a consenting minor", async () => {
    const dispatch = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(
      decode({
        ...validRaw,
        birthDate: "2012-01-01",
        parentEmail: "ouder@example.com",
        parentalConsent: true,
      }),
      { dispatch },
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    // applicant + parent + admin
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it("rejects an implausible birth year with a birthDate field error", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(decode({ ...validRaw, birthDate: "0010-05-01" }), {
      write,
    });

    expect(Exit.isFailure(exit)).toBe(true);
    expect(write).not.toHaveBeenCalled();
    if (Exit.isFailure(exit)) {
      const failure = Cause.failureOption(exit.cause);
      expect(Option.isSome(failure)).toBe(true);
      expect(Option.getOrThrow(failure)).toMatchObject({
        _tag: "HttpBadRequest",
        fields: { birthDate: "Vul een geldige geboortedatum in." },
      });
    }
  });

  describe("cached routing config (#3876)", () => {
    const adminTo = async (cached: string) => {
      const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
        Effect.succeed(undefined),
      );
      const exit = await run(validPayload, {
        dispatch,
        cached,
        routing: {
          speler: null,
          jeugdspeler: null,
          vrijwilliger: "vrijwilligers@example.com",
          trainer: null,
          scheidsrechter: null,
        },
      });
      expect(Exit.isSuccess(exit)).toBe(true);
      return dispatch.mock.calls.at(-1)![0].to;
    };

    it.each([
      [
        "a role that is not a string",
        JSON.stringify({
          speler: null,
          jeugdspeler: null,
          vrijwilliger: 5,
          trainer: null,
          scheidsrechter: null,
        }),
      ],
      ["a value that is not JSON", "not json"],
      ["a value that is not an object", "42"],
    ])("refetches when the cached value has %s", async (_label, cached) => {
      expect(await adminTo(cached)).toBe("vrijwilligers@example.com");
    });
  });

  describe("admin recipient", () => {
    const adminTo = async (configured: string | null) => {
      const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
        Effect.succeed(undefined),
      );
      await run(validPayload, {
        dispatch,
        routing: {
          speler: null,
          jeugdspeler: null,
          vrijwilliger: configured,
          trainer: null,
          scheidsrechter: null,
        },
      });
      return dispatch.mock.calls.at(-1)![0].to;
    };

    it.each(["", "   ", "not-an-email", null])(
      "falls back to info@ for %j",
      async (configured) => {
        expect(await adminTo(configured)).toBe("info@kcvvelewijt.be");
      },
    );

    it("uses the trimmed configured address", async () => {
      expect(await adminTo(" bestuur@kcvvelewijt.be ")).toBe(
        "bestuur@kcvvelewijt.be",
      );
    });
  });

  describe("named contact", () => {
    const base = {
      speler: null,
      jeugdspeler: null,
      vrijwilliger: null,
      trainer: null,
      scheidsrechter: null,
    };
    const applicantText = async (routing: FormRoutingConfig) => {
      const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
        Effect.succeed(undefined),
      );
      await run(validPayload, { dispatch, routing });
      return dispatch.mock.calls[0]![0].text!;
    };

    it("names the holder and function title of the role's box", async () => {
      const text = await applicantText({
        ...base,
        contacts: {
          vrijwilliger: {
            functionTitle: "Voorzitter",
            holder: { firstName: "An", lastName: "Peeters" },
          },
        },
      });
      expect(text).toContain(
        "An Peeters (Voorzitter) neemt contact met je op.",
      );
      expect(text).not.toContain("binnenkort");
    });

    it.each([
      ["no config", undefined],
      ["no reference", {}],
      [
        "a reference without a holder",
        { vrijwilliger: { functionTitle: "Voorzitter", holder: null } },
      ],
      [
        "a holder without a name",
        {
          vrijwilliger: {
            functionTitle: "Voorzitter",
            holder: { firstName: null, lastName: " " },
          },
        },
      ],
      [
        "another role's box only",
        {
          trainer: {
            functionTitle: "T",
            holder: { firstName: "A", lastName: "B" },
          },
        },
      ],
    ])("keeps today's sentence for %s", async (_label, contacts) => {
      const text = await applicantText({ ...base, contacts });
      expect(text).toContain("Iemand van de club neemt binnenkort contact");
    });
  });
});
