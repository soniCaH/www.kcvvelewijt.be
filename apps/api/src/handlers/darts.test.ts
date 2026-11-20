import { describe, it, expect, vi } from "vitest";
import { Cause, Effect, Exit, Layer, Option, Schema as S } from "effect";
import { DartsSignupRequest } from "@kcvv/api-contract";
import {
  SanityMutation,
  SanityMutationError,
  type SanityMutationInterface,
} from "../sanity/mutation";
import { SanityProjection, SanityQueryError } from "../sanity/projection";
import {
  EmailDeliveryError,
  EmailTransport,
  type EmailTransportInterface,
} from "../email/resend";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { makeSanityProjectionStub } from "../test-helpers/sanity-projection-stub";
import { handleDartsSignup, handleDartsSpots } from "./darts";

const payload = S.decodeUnknownSync(DartsSignupRequest)({
  teamName: "De Pijlenjagers",
  captainName: "Jan Peeters",
  captainEmail: "jan@example.com",
  captainPhone: "0470 12 34 56",
  rulesAccepted: true,
  paymentAccepted: true,
  turnstileToken: "tok",
});

type Counts = { teams: number; waitlist: number };

const BEFORE_EVENT = new Date("2026-11-25T10:00:00Z");

const layerFor = (opts: {
  counts?: Counts;
  countsFail?: boolean;
  existing?: { waitlist: boolean; number: number } | null;
  find?: (input: { teamName: string; captainEmail: string }) => void;
  write?: SanityMutationInterface["writeDartsSignup"];
  dispatch?: EmailTransportInterface["dispatchEmail"];
}) =>
  Layer.mergeAll(
    Layer.succeed(SanityMutation, {
      writeDartsSignup: opts.write ?? (() => Effect.succeed(undefined)),
    } as unknown as SanityMutationInterface),
    Layer.succeed(
      SanityProjection,
      makeSanityProjectionStub({
        findDartsSignup: (input) =>
          Effect.sync(() => {
            opts.find?.(input);
            return opts.existing ?? null;
          }),
        getDartsCounts: () =>
          opts.countsFail
            ? Effect.fail(new SanityQueryError("boom"))
            : Effect.succeed(opts.counts ?? { teams: 0, waitlist: 0 }),
      }),
    ),
    Layer.succeed(EmailTransport, {
      dispatchEmail: opts.dispatch ?? (() => Effect.succeed(undefined)),
    }),
    makeTestEnvLayer({ ALLOW_MISSING_FORM_SECRETS: "true" }),
  );

const signup = (
  opts: Parameters<typeof layerFor>[0] & {
    now?: Date;
    payload?: DartsSignupRequest;
  } = {},
) =>
  Effect.runPromiseExit(
    handleDartsSignup(opts.payload ?? payload, opts.now ?? BEFORE_EVENT).pipe(
      Effect.provide(layerFor(opts)),
    ),
  );

describe("handleDartsSignup", () => {
  it("saves a team with a spot, not on the wachtlijst, and sends mail 1 plus the club copy", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await signup({
      counts: { teams: 3, waitlist: 0 },
      write,
      dispatch,
    });

    expect(exit).toEqual(Exit.succeed({ ok: true, waitlist: false }));
    expect(write.mock.calls[0]![0]).toMatchObject({
      teamName: "De Pijlenjagers",
      waitlist: false,
      submittedAt: BEFORE_EVENT.toISOString(),
    });
    expect(dispatch.mock.calls.map(([m]) => m.subject)).toEqual([
      "EK Darts: De Pijlenjagers is ingeschreven — nog even betalen",
      "EK Darts: De Pijlenjagers — ploeg 4/24",
    ]);
  });

  it("puts a new signup on the wachtlijst while anyone is already there, even with a spot free", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await signup({
      counts: { teams: 23, waitlist: 1 },
      write,
      dispatch,
    });

    expect(exit).toEqual(Exit.succeed({ ok: true, waitlist: true }));
    expect(write.mock.calls[0]![0].waitlist).toBe(true);
    expect(dispatch.mock.calls.map(([m]) => m.subject)).toEqual([
      "EK Darts: De Pijlenjagers staat op de wachtlijst",
      "EK Darts: De Pijlenjagers — wachtlijst 2",
    ]);
  });

  it("still gives spot 24 to the 24th team", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
      Effect.succeed(undefined),
    );
    await signup({ counts: { teams: 23, waitlist: 0 }, write, dispatch });
    expect(write.mock.calls[0]![0].waitlist).toBe(false);
    expect(dispatch.mock.calls[1]![0].subject).toBe(
      "EK Darts: De Pijlenjagers — ploeg 24/24",
    );
  });

  it("saves team 25 as wachtlijst and sends mail 3 with its place", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await signup({
      counts: { teams: 24, waitlist: 1 },
      write,
      dispatch,
    });

    expect(exit).toEqual(Exit.succeed({ ok: true, waitlist: true }));
    expect(write.mock.calls[0]![0].waitlist).toBe(true);
    expect(dispatch.mock.calls.map(([m]) => m.subject)).toEqual([
      "EK Darts: De Pijlenjagers staat op de wachtlijst",
      "EK Darts: De Pijlenjagers — wachtlijst 2",
    ]);
    expect(dispatch.mock.calls[0]![0].text).toContain(
      "als 2e op de wachtlijst",
    );
  });

  it("still answers ok when email dispatch fails — the signup is saved", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await signup({
      write,
      dispatch: () => Effect.fail(new EmailDeliveryError("Resend down")),
    });
    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("answers 503 when Sanity cannot save", async () => {
    const exit = await signup({
      write: () => Effect.fail(new SanityMutationError("down")),
    });
    expect(Exit.isFailure(exit) && Cause.failureOption(exit.cause)).toEqual(
      Option.some(expect.objectContaining({ _tag: "HttpServiceUnavailable" })),
    );
  });

  it("answers 503 and saves nothing when the count cannot be read", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await signup({ countsFail: true, write });
    expect(Exit.isFailure(exit)).toBe(true);
    expect(write).not.toHaveBeenCalled();
  });

  it("answers a resubmit of a saved signup with its status and writes and mails nothing", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const dispatch = vi.fn<EmailTransportInterface["dispatchEmail"]>(() =>
      Effect.succeed(undefined),
    );
    const find = vi.fn();
    const exit = await signup({
      existing: { waitlist: true, number: 3 },
      find,
      write,
      dispatch,
    });

    expect(exit).toEqual(Exit.succeed({ ok: true, waitlist: true }));
    expect(find).toHaveBeenCalledWith({
      teamName: "De Pijlenjagers",
      captainEmail: "jan@example.com",
    });
    expect(write).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("takes a signup from the same captain under another team name as a normal one", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    // The lookup matches on team name and captain together: no match here.
    const exit = await signup({ existing: null, write });

    expect(exit).toEqual(Exit.succeed({ ok: true, waitlist: false }));
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("refuses a signup after the event day, saving nothing", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await signup({ write, now: new Date("2026-12-20T09:00:00Z") });
    expect(Exit.isFailure(exit) && Cause.failureOption(exit.cause)).toEqual(
      Option.some(expect.objectContaining({ _tag: "HttpBadRequest" })),
    );
    expect(write).not.toHaveBeenCalled();
  });

  it("still takes a signup on the event day itself", async () => {
    const exit = await signup({ now: new Date("2026-12-19T20:00:00Z") });
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it("drops a honeypot submission without saving", async () => {
    const write = vi.fn<SanityMutationInterface["writeDartsSignup"]>(() =>
      Effect.succeed(undefined),
    );
    const exit = await signup({
      write,
      payload: { ...payload, company: "bot" },
    });
    expect(Exit.isSuccess(exit)).toBe(true);
    expect(write).not.toHaveBeenCalled();
  });
});

describe("handleDartsSpots", () => {
  const spots = (counts: Counts) =>
    Effect.runPromise(
      handleDartsSpots().pipe(Effect.provide(layerFor({ counts }))),
    );

  it("is 24 minus the teams holding a spot", async () => {
    expect(await spots({ teams: 5, waitlist: 0 })).toEqual({ spotsLeft: 19 });
  });

  it("is 0 while anyone is on the wachtlijst, even with a spot free", async () => {
    expect(await spots({ teams: 23, waitlist: 1 })).toEqual({ spotsLeft: 0 });
  });

  it("never goes below zero", async () => {
    expect(await spots({ teams: 26, waitlist: 2 })).toEqual({ spotsLeft: 0 });
  });
});
