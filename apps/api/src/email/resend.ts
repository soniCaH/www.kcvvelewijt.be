import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

/**
 * Form-agnostic transactional-email transport over Resend.
 *
 * Deliberately knows nothing about membership (or any specific form): it sends
 * one `{ to, subject, html, text }` message. Future intake forms (VIP-restaurant,
 * stage, sponsorship …) reuse this transport and supply their own template
 * builders — the membership-specific templates live in `forms/membership-emails.ts`.
 */

/** Verified sender — apex `kcvvelewijt.be` (see docs/prd/email-delivery.md). */
const DEFAULT_FROM = "KCVV Elewijt <noreply@kcvvelewijt.be>";

export class EmailDeliveryError extends Error {
  readonly _tag = "EmailDeliveryError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export interface EmailMessage {
  readonly to: string | string[];
  readonly subject: string;
  readonly html: string;
  /** Explicit plain-text part — Resend's HTML-derived text glues table cells together. */
  readonly text: string;
  /** Defaults to {@link DEFAULT_FROM}. */
  readonly from?: string;
  readonly replyTo?: string;
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

export const EmailTransportLive = Layer.effect(
  EmailTransport,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;

    return {
      dispatchEmail: (msg) =>
        Effect.gen(function* () {
          if (!env.RESEND_API_KEY) {
            // Fail closed: a missing key in a deployed worker must be loud,
            // not a silent "success". Only the local dev flag may skip (#3464).
            if (env.ALLOW_MISSING_FORM_SECRETS === "true") {
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
                  Authorization: `Bearer ${env.RESEND_API_KEY}`,
                  "Content-Type": "application/json",
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
              ),
            );
          }
        }),
    };
  }),
);
