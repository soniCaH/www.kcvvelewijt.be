import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

/**
 * Form-agnostic transactional-email transport over Resend.
 *
 * Deliberately knows nothing about membership (or any specific form): it sends
 * one `{ to, subject, html }` message. Future intake forms (VIP-restaurant,
 * stage, sponsorship …) reuse this transport and supply their own template
 * builders — the membership-specific templates live in `forms/membership-emails.ts`.
 */

/** Verified sender — apex `kcvvelewijt.be` (see docs/prd/email-delivery.md). */
export const DEFAULT_FROM = "KCVV Elewijt <noreply@kcvvelewijt.be>";

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
            // Local/dev without the secret: no-op so persist-then-send still
            // completes. The application is already captured in Sanity.
            yield* Effect.logWarning(
              "[email] RESEND_API_KEY not set — skipping dispatch",
            );
            return;
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
