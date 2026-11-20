import { beforeEach, describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import { handleDartsPaidWebhook } from "./darts-paid-handler";
import {
  EmailDeliveryError,
  EmailTransport,
  type EmailMessage,
} from "../email/resend";
import { makeTestEnv } from "../test-helpers/env-layer";
import { TEST_SECRET, signPayload } from "../test-helpers/webhook-signing";

const mockFetch = vi.fn();
const mockCommit = vi.fn();
const mockSetIfMissing = vi.fn();
// A chainable patch builder over the commit spy.
const patchBuilder = {
  setIfMissing: (fields: unknown) => (mockSetIfMissing(fields), patchBuilder),
  commit: () => mockCommit(),
};
vi.mock("@sanity/client", () => ({
  createClient: () => ({ fetch: mockFetch, patch: () => patchBuilder }),
}));

const env = makeTestEnv({ SANITY_WEBHOOK_SECRET: TEST_SECRET });

const paidDoc = {
  _id: "abc123",
  teamName: "De Pijlenjagers",
  captainName: "Jan Peeters",
  captainEmail: "jan@example.com",
  paid: true,
  waitlist: false,
  paidMailSentAt: null,
};

const dispatch = vi.fn<(m: EmailMessage) => void>();
let dispatchFails = false;
const layer = Layer.succeed(EmailTransport, {
  dispatchEmail: (m: EmailMessage) =>
    dispatchFails
      ? Effect.fail(new EmailDeliveryError("Resend down"))
      : Effect.sync(() => dispatch(m)),
});

const call = async (
  payload: object = { _id: "abc123", _type: "dartsSignup", _rev: "rev1" },
  opts: { badSignature?: boolean; operation?: string } = {},
) => {
  const body = JSON.stringify(payload);
  const signature = opts.badSignature
    ? `t=${Date.now()},v1=nope`
    : await signPayload(body);
  return handleDartsPaidWebhook(
    new Request("https://kcvv-api.workers.dev/webhooks/darts-paid", {
      method: "POST",
      headers: {
        "sanity-webhook-signature": signature,
        ...(opts.operation ? { "sanity-operation": opts.operation } : {}),
      },
      body,
    }),
    env,
    layer,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  dispatchFails = false;
  mockFetch.mockResolvedValue(paidDoc);
  mockCommit.mockResolvedValue({});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("handleDartsPaidWebhook", () => {
  it("sends mail 2 to the captain when Betaald is on and no mail went out yet", async () => {
    const res = await call();

    expect(await res.json()).toEqual({ ok: true, action: "sent" });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]![0]).toMatchObject({
      to: "jan@example.com",
      subject: "EK Darts: De Pijlenjagers is er zeker bij",
    });
  });

  it("records the send after the mail went out", async () => {
    await call();

    expect(mockSetIfMissing).toHaveBeenCalledWith({
      paidMailSentAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it("sends nothing when the mail already went out", async () => {
    mockFetch.mockResolvedValue({
      ...paidDoc,
      paidMailSentAt: "2026-11-21T10:00:00Z",
    });

    const res = await call();

    expect(await res.json()).toEqual({
      ok: true,
      action: "skipped_not_applicable",
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("sends nothing while Betaald is off", async () => {
    mockFetch.mockResolvedValue({ ...paidDoc, paid: false });
    await call();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("sends nothing for a team on the wachtlijst", async () => {
    mockFetch.mockResolvedValue({ ...paidDoc, waitlist: true });
    await call();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("answers 500 and records nothing when the mail fails, so Sanity retries", async () => {
    dispatchFails = true;

    const res = await call();

    expect(res.status).toBe(500);
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("still answers ok when only the record write fails: the mail is out", async () => {
    mockCommit.mockRejectedValue(new Error("sanity down"));

    const res = await call();

    expect(await res.json()).toEqual({ ok: true, action: "sent" });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("skips a document that is gone (a draft id reads as null)", async () => {
    mockFetch.mockResolvedValue(null);
    const res = await call();
    expect(await res.json()).toEqual({ ok: true, action: "skipped_not_found" });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("skips another document type and a delete without reading Sanity", async () => {
    await call({ _id: "x", _type: "article" });
    await call(undefined, { operation: "delete" });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("answers 401 to an unsigned or wrongly signed request", async () => {
    const res = await call(undefined, { badSignature: true });
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("answers 400 to a body that is not a document", async () => {
    const res = await call({ nope: true });
    expect(res.status).toBe(400);
  });
});
