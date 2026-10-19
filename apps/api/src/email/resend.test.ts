import { afterEach, describe, expect, it, vi } from "vitest";
import { Cause, Effect, Logger } from "effect";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import type { WorkerEnv } from "../env";
import {
  EmailTransport,
  EmailTransportLive,
  type EmailMessage,
} from "./resend";

const message: EmailMessage = {
  to: "jan@example.com",
  subject: "Welkom",
  html: "<p>Hallo</p>",
  text: "Hallo",
  replyTo: "info@kcvvelewijt.be",
};

function dispatch(env: Partial<WorkerEnv>) {
  const logs: { level: string; message: string }[] = [];
  const logger = Logger.replace(
    Logger.defaultLogger,
    Logger.make(({ logLevel, message }) => {
      logs.push({ level: logLevel._tag, message: String(message) });
    }),
  );
  const exit = Effect.runPromiseExit(
    Effect.flatMap(EmailTransport, (t) => t.dispatchEmail(message)).pipe(
      Effect.provide(EmailTransportLive),
      Effect.provide(makeTestEnvLayer(env)),
      Effect.provide(logger),
    ),
  );
  return { exit, logs };
}

const withKey = { RESEND_API_KEY: "re_test" };

function failure(exit: Awaited<ReturnType<typeof dispatch>["exit"]>) {
  expect(exit._tag).toBe("Failure");
  const error = exit._tag === "Failure" ? Cause.squash(exit.cause) : null;
  return `${(error as { _tag?: string })._tag}: ${(error as Error).message}`;
}

describe("EmailTransportLive.dispatchEmail (#3464)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fails with EmailDeliveryError and logs an error when the key is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { exit, logs } = dispatch({});

    const result = await exit;
    expect(failure(result)).toContain("EmailDeliveryError");
    expect(logs.filter((l) => l.level === "Error")).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("only the exact string 'true' enables the dev flag", async () => {
    const { exit } = dispatch({ ALLOW_MISSING_FORM_SECRETS: "yes" });
    expect(failure(await exit)).toContain("EmailDeliveryError");
  });

  it("no-ops with a warning when the key is missing and the dev flag is on", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { exit, logs } = dispatch({ ALLOW_MISSING_FORM_SECRETS: "true" });

    expect((await exit)._tag).toBe("Success");
    expect(logs.map((l) => l.level)).toEqual(["Warning"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the message to Resend and succeeds on 2xx", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "1" }));
    vi.stubGlobal("fetch", fetchMock);
    const { exit } = dispatch(withKey);

    expect((await exit)._tag).toBe("Success");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_test" });
    expect(JSON.parse(init.body as string)).toMatchObject({
      to: ["jan@example.com"],
      subject: "Welkom",
      html: "<p>Hallo</p>",
      text: "Hallo",
      reply_to: "info@kcvvelewijt.be",
    });
  });

  it("fails with EmailDeliveryError on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bad key", { status: 401 })),
    );
    const { exit } = dispatch(withKey);

    const text = failure(await exit);
    expect(text).toContain("EmailDeliveryError");
    expect(text).toContain("401");
  });

  it("fails with EmailDeliveryError on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const { exit } = dispatch(withKey);

    expect(failure(await exit)).toContain("EmailDeliveryError");
  });
});
