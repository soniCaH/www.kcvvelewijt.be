import { Context, Effect, Layer, Redacted } from "effect";
import {
  allowMissingFormSecrets,
  resendApiKey,
  dieOnConfigError,
} from "../config";

/**
 * Form-agnostic transactional-email transport over Resend.
 *
 * Deliberately knows nothing about membership (or any specific form): it sends
 * one `{ to, subject, html, text }` message. Future intake forms (VIP-restaurant,
 * stage, sponsorship …) reuse this transport and supply their own template
 * builders — the membership-specific templates live in `forms/membership-emails.ts`.
 */

/** Verified sender — apex `kcvvelewijt.be` (see docs/prd/archive/2026/email-delivery.md). */
const DEFAULT_FROM = "KCVV Elewijt <noreply@kcvvelewijt.be>";

export class EmailDeliveryError extends Error {
  readonly _tag = "EmailDeliveryError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
    /** Resend's HTTP status and error `name`, when it answered with an error. */
    readonly resend?: { readonly status: number; readonly code?: string },
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

/** Resend's error `name` (e.g. `invalid_idempotent_request`) out of an error body. */
const errorName = (body: string): string | undefined => {
  try {
    const name = (JSON.parse(body) as { name?: unknown }).name;
    return typeof name === "string" ? name : undefined;
  } catch {
    return undefined;
  }
};

export interface EmailMessage {
  readonly to: string | string[];
  readonly subject: string;
  readonly html: string;
  /** Explicit plain-text part — Resend's HTML-derived text glues table cells together. */
  readonly text: string;
  /** Defaults to {@link DEFAULT_FROM}. */
  readonly from?: string;
  readonly replyTo?: string;
  /** Sent as Resend's `Idempotency-Key`: a retry of the same key never mails twice. */
  readonly idempotencyKey?: string;
}

export interface EmailTransportInterface {
  readonly dispatchEmail: (
    msg: EmailMessage,
  ) => Effect.Effect<void, EmailDeliveryError>;
}

export class EmailTransport extends Context.Tag("EmailTransport")<
  EmailTransport,
  EmailTransportInterface
>() {}

export const EmailTransportLive = Layer.succeed(EmailTransport, {
  dispatchEmail: (msg) =>
    Effect.gen(function* () {
      const apiKey = yield* resendApiKey.pipe(dieOnConfigError);
      if (!apiKey) {
        // Fail closed: a missing key in a deployed worker must be loud,
        // not a silent "success". Only the local dev flag may skip (#3464).
        if (yield* allowMissingFormSecrets.pipe(dieOnConfigError)) {
          yield* Effect.logWarning(
            "[email] RESEND_API_KEY not set — skipping dispatch (ALLOW_MISSING_FORM_SECRETS)",
          );
          return;
        }
        yield* Effect.logError(
          "[email] RESEND_API_KEY not set — cannot dispatch",
        );
        return yield* Effect.fail(
          new EmailDeliveryError("RESEND_API_KEY not set"),
        );
      }

      const response = yield* Effect.tryPromise({
        try: () =>
          fetch("https://api.resend.com/emails", {
            method: "POST",
            signal: AbortSignal.timeout(8000),
            headers: {
              Authorization: `Bearer ${Redacted.value(apiKey)}`,
              "Content-Type": "application/json",
              ...(msg.idempotencyKey
                ? { "Idempotency-Key": msg.idempotencyKey }
                : {}),
            },
            body: JSON.stringify({
              from: msg.from ?? DEFAULT_FROM,
              to: Array.isArray(msg.to) ? msg.to : [msg.to],
              subject: msg.subject,
              html: msg.html,
              text: msg.text,
              ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
            }),
          }),
        catch: (cause) =>
          new EmailDeliveryError("Resend request failed", cause),
      });

      if (!response.ok) {
        const body = yield* Effect.promise(() =>
          response.text().catch(() => ""),
        );
        return yield* Effect.fail(
          new EmailDeliveryError(
            `Resend responded ${response.status}: ${body}`,
            undefined,
            { status: response.status, code: errorName(body) },
          ),
        );
      }
    }),
});
