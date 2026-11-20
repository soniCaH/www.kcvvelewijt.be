import { createClient } from "@sanity/client";
import { Effect, Layer, Schema as S } from "effect";
import type { WorkerEnv } from "../env";
import { WorkerEnvTag } from "../env";
import { EmailTransport, EmailTransportLive } from "../email/resend";
import { buildDartsPaidEmail } from "../forms/darts-emails";
import { sanityClientConfig } from "../sanity/config";
import { WebhookPayload } from "./schemas";
import { verifySanitySignature } from "./sanity-signature";

/**
 * Sanity webhook for EK Darts signups (#3812): sends mail 2 when `Betaald`
 * turns on, once.
 *
 * The hook only says "this document changed". The handler reads the published
 * document fresh and decides itself, so a replayed or reordered delivery can
 * never send on stale data. "Once" is the `paidMailSentAt` field: this handler
 * is its only writer, and it writes it after the mail went out. A failed send
 * writes nothing and answers 500, so Sanity retries the delivery; writing a
 * claim first and clearing it on failure would re-fire this very hook on every
 * clear and loop for as long as Resend is down.
 *
 * shortcut: two deliveries that read the document in the same instant can both
 * send. Sanity sends one delivery per mutation and the record write below drops
 * the document out of the hook's filter, so that needs a double toggle within
 * milliseconds; upgrade to a Durable Object lock if it ever shows.
 */

class WebhookParseError {
  readonly _tag = "WebhookParseError";
}
class WebhookAuthError {
  readonly _tag = "WebhookAuthError";
}
class WebhookServiceError {
  readonly _tag = "WebhookServiceError";
  constructor(readonly detail: string) {}
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

interface DartsSignupDoc {
  readonly _id: string;
  readonly teamName: string;
  readonly captainName: string;
  readonly captainEmail: string;
  readonly paid?: boolean | null;
  readonly waitlist?: boolean | null;
  readonly paidMailSentAt?: string | null;
}

const QUERY = `*[_id == $id && _type == "dartsSignup"][0]{
  _id, teamName, captainName, captainEmail, paid, waitlist, paidMailSentAt
}`;

const webhookEffect = (request: Request, env: WorkerEnv) =>
  Effect.gen(function* () {
    const transport = yield* EmailTransport;

    const rawBody = yield* Effect.tryPromise({
      try: () => request.text(),
      catch: () => new WebhookParseError(),
    });

    const valid = yield* Effect.tryPromise({
      try: () =>
        verifySanitySignature(
          request.headers,
          rawBody,
          env.SANITY_WEBHOOK_SECRET,
        ),
      catch: () => new WebhookAuthError(),
    });
    if (!valid) return yield* Effect.fail(new WebhookAuthError());

    const parsed = yield* Effect.try({
      try: () => JSON.parse(rawBody) as unknown,
      catch: () => new WebhookParseError(),
    });
    const { _id, _type } = yield* S.decodeUnknown(WebhookPayload)(parsed).pipe(
      Effect.mapError(() => new WebhookParseError()),
    );

    // The operation header is not covered by the signature; deletes and other
    // types need no mail, and the fresh read below decides everything else.
    if (
      _type !== "dartsSignup" ||
      request.headers.get("sanity-operation") === "delete"
    ) {
      return Response.json({ ok: true, action: "skipped_not_applicable" });
    }

    const client = createClient({ ...sanityClientConfig(env), useCdn: false });
    const doc = yield* Effect.tryPromise({
      try: () => client.fetch<DartsSignupDoc | null>(QUERY, { id: _id }),
      catch: (err) => new WebhookServiceError(errorMessage(err)),
    });

    // A draft id reads as null from the published perspective: nothing to do.
    if (!doc) return Response.json({ ok: true, action: "skipped_not_found" });
    if (doc.paid !== true || doc.waitlist === true || doc.paidMailSentAt) {
      return Response.json({ ok: true, action: "skipped_not_applicable" });
    }

    yield* transport
      .dispatchEmail(buildDartsPaidEmail(doc))
      .pipe(
        Effect.mapError((err) => new WebhookServiceError(errorMessage(err))),
      );

    // Recorded after the send, without a revision check: an unrelated edit in
    // between must not lose the record. A failed record is logged, not retried:
    // the mail is out, and failing the delivery would send it again.
    yield* Effect.tryPromise({
      try: () =>
        client
          .patch(doc._id)
          .setIfMissing({ paidMailSentAt: new Date().toISOString() })
          .commit(),
      catch: (err) => err,
    }).pipe(
      Effect.catchAll((err) =>
        Effect.logError(
          `[webhook:darts-paid] mail sent but paidMailSentAt not recorded on ${doc._id}: ${errorMessage(err)}`,
        ),
      ),
    );

    return Response.json({ ok: true, action: "sent" });
  });

export type DartsPaidWebhookLayer = Layer.Layer<EmailTransport>;

export async function handleDartsPaidWebhook(
  request: Request,
  env: WorkerEnv,
  layer?: DartsPaidWebhookLayer,
): Promise<Response> {
  const envLayer = Layer.succeed(WorkerEnvTag, env);
  const serviceLayer =
    layer ?? EmailTransportLive.pipe(Layer.provide(envLayer));

  return await Effect.runPromise(
    webhookEffect(request, env).pipe(
      Effect.provide(serviceLayer),
      Effect.provide(envLayer),
      Effect.tapError((error) =>
        Effect.sync(() => {
          if (error._tag === "WebhookServiceError") {
            console.error(`[webhook:darts-paid] ${error.detail}`);
          }
        }),
      ),
      Effect.catchAll((error) =>
        Effect.succeed(
          error._tag === "WebhookAuthError"
            ? new Response("Unauthorized", { status: 401 })
            : error._tag === "WebhookParseError"
              ? Response.json(
                  { ok: false, code: "parse_failed" },
                  { status: 400 },
                )
              : Response.json(
                  { ok: false, error: "Internal server error" },
                  { status: 500 },
                ),
        ),
      ),
      Effect.catchAllDefect(() =>
        Effect.succeed(
          Response.json({ ok: false, code: "internal" }, { status: 500 }),
        ),
      ),
    ),
  );
}
