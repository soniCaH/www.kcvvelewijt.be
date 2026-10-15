import { describe, it, expect, vi } from "vitest";
import { Cause, Effect, Exit, Layer, Option } from "effect";
import type { MembershipRequest } from "@kcvv/api-contract";
import {
  SanityMutation,
  type SanityMutationInterface,
} from "../sanity/mutation";
import {
  SanityProjection,
  type FormRoutingConfig,
  type SanityProjectionInterface,
} from "../sanity/projection";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import { EmailTransport, type EmailTransportInterface } from "../email/resend";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { handleMembership } from "./forms";

const validPayload: MembershipRequest = {
  role: "vrijwilliger",
  firstName: "Jan",
  lastName: "Peeters",
  birthDate: "1990-06-15",
  gender: "m",
  municipality: "Elewijt",
  email: "jan@example.com",
  privacyAccepted: true,
  turnstileToken: "tok",
} as MembershipRequest;

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
  };
}

const projectionMock: SanityProjectionInterface = {
  getPlayersImageState: () => Effect.succeed(new Map()),
  getStaffImageState: () => Effect.succeed(new Map()),
  getActivePlayerPsdIds: () => Effect.succeed([]),
  getActiveStaffPsdIds: () => Effect.succeed([]),
  getActiveTeamPsdIds: () => Effect.succeed([]),
  getTeamPlayerPsdIds: () => Effect.succeed([]),
  getVisibleTeamPsdIds: () => Effect.succeed([]),
  getProtectedStaffPsdIds: () => Effect.succeed([]),
  getFormRoutingConfig: () => Effect.succeed(null),
};

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
  durable: noopDurableKv,
};

function run(
  payload: MembershipRequest,
  opts: {
    write?: SanityMutationInterface["writeMembershipApplication"];
    dispatch?: EmailTransportInterface["dispatchEmail"];
    routing?: FormRoutingConfig;
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
    Layer.succeed(KvCacheService, cacheMock),
    Layer.succeed(EmailTransport, emailMock),
    makeTestEnvLayer(), // no TURNSTILE_SECRET → verification skipped
  );
  return Effect.runPromiseExit(
    Effect.provide(handleMembership(payload), layer),
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

  it("persists the remark", async () => {
    const write = vi.fn<SanityMutationInterface["writeMembershipApplication"]>(
      () => Effect.succeed(undefined),
    );
    await run({ ...validPayload, remark: "Mijn zoon is keeper." }, { write });

    expect(write.mock.calls[0]![0].remark).toBe("Mijn zoon is keeper.");
  });

  it("drops a honeypot submission without persisting", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(
      { ...validPayload, company: "spam-bot" } as MembershipRequest,
      { write },
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write).not.toHaveBeenCalled();
  });

  it("rejects a minor without parent fields (400 with field errors)", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(
      { ...validPayload, birthDate: "2012-01-01" } as MembershipRequest,
      { write },
    );

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
      {
        ...validPayload,
        birthDate: "2012-01-01",
        parentEmail: "ouder@example.com",
        parentalConsent: true,
      } as MembershipRequest,
      { dispatch },
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    // applicant + parent + admin
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it("rejects an implausible birth year with a birthDate field error", async () => {
    const write = vi.fn(() => Effect.succeed(undefined as void));
    const exit = await run(
      { ...validPayload, birthDate: "0010-05-01" } as MembershipRequest,
      { write },
    );

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
});
