import { createClient } from "@sanity/client";
import { Either, Effect, Layer, Schema as S } from "effect";
import { EmailAddress } from "@kcvv/api-contract";
import type { WorkerEnv } from "../env";
import { WorkerEnvTag } from "../env";
import { EmailTransport, EmailTransportLive } from "../email/resend";
import { buildDartsPaidEmail } from "../forms/darts-emails";
import { parseErrorPaths } from "../parse-error-paths";
import { sanityClientConfig } from "../sanity/config";
import {
  WebhookAuthError,
  WebhookParseError,
  WebhookServiceError,
  errorMessage,
  toErrorResponse,
} from "./index-handler";
import { WebhookPayload } from "./schemas";
import { verifySanitySignature } from "./sanity-signature";

/**
 * Sanity webhook for EK Darts signups (#3812): sends mail 2 when `Betaald`
 * turns on, once.
 *
 * The hook only says "this document changed". The handler reads the published
 * document fresh and decides itself, so a replayed or reordered delivery can
 * never send on stale data. "Once" is two things working together:
 * - the `paidMailSentAt` field, written by this handler alone, after the mail
 *   went out (on the published document and on its draft, if one exists, so
 *   publishing an older draft later cannot erase it);
 * - an `Idempotency-Key` on the mail, so a retry of a delivery whose send
 *   succeeded but whose answer was lost (a timeout) does not mail twice.
 * A failed send writes nothing and answers 500, so Sanity retries the
 * delivery; writing a claim first and clearing it on failure would re-fire this
 * very hook on every clear and loop for as long as Resend is down.
 */

const DartsSignupDoc = S.Struct({
  _id: S.String,
  teamName: S.String,
  captainName: S.String,
  captainEmail: EmailAddress,
  paid: S.optional(S.NullOr(S.Boolean)),
  waitlist: S.optional(S.NullOr(S.Boolean)),
  paidMailSentAt: S.optional(S.NullOr(S.String)),
});

/** Resend's answer to a repeated `Idempotency-Key` carrying a different payload. */
const IDEMPOTENCY_CONFLICT = "invalid_idempotent_request";

const QUERY = `*[_id == $id && _type == "dartsSignup"][0]{
  _id, teamName, captainName, captainEmail, paid, waitlist, paidMailSentAt
}`;

const webhookEffect = (request: Request, env: WorkerEnv) =>
  Effect.gen(function* () {
    const transport = yield* EmailTransport;

    const rawBody = yield* Effect.tryPromise({
      try: () => request.text(),
      catch: () => new WebhookParseError("invalid_json", "failed to read body"),
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
      catch: () => new WebhookParseError("invalid_json", "malformed JSON body"),
    });
    const { _id, _type } = yield* S.decodeUnknown(WebhookPayload)(parsed).pipe(
      Effect.mapError(
        () =>
          new WebhookParseError("invalid_shape", "schema validation failed"),
      ),
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
    const raw = yield* Effect.tryPromise({
      try: () => client.fetch<unknown>(QUERY, { id: _id }),
      catch: (err) =>
        new WebhookServiceError("sanity_fetch_failed", errorMessage(err)),
    });

    // A document written past Studio validation must not reach Resend.
    const decoded = S.decodeUnknownEither(S.NullOr(DartsSignupDoc))(raw);
    if (Either.isLeft(decoded)) {
      // A retry cannot fix a bad document: answer 200 so Sanity stops.
      console.error(
        `[webhook:darts-paid] invalid_doc: ${_id}: ${parseErrorPaths(decoded.left)}`,
      );
      return Response.json({ ok: true, action: "skipped_invalid_doc" });
    }
    const doc = decoded.right;

    // A draft id reads as null from the published perspective: nothing to do.
    if (!doc) return Response.json({ ok: true, action: "skipped_not_found" });
    if (doc.paid !== true || doc.waitlist === true || doc.paidMailSentAt) {
      return Response.json({ ok: true, action: "skipped_not_applicable" });
    }

    yield* transport
      .dispatchEmail({
        ...buildDartsPaidEmail(doc),
        idempotencyKey: `darts-paid-${doc._id}`,
      })
      .pipe(
        Effect.catchAll((err) =>
          // Same key, different payload: an earlier attempt was accepted by
          // Resend (its answer got lost) and the team name changed since. The
          // mail is out, so only the record below is still owed.
          err.resend?.code === IDEMPOTENCY_CONFLICT
            ? Effect.void
            : Effect.fail(
                new WebhookServiceError("email_failed", errorMessage(err)),
              ),
        ),
      );

    // Recorded after the send, without a revision check: an unrelated edit in
    // between must not lose the record. A failed record answers 500 so Sanity
    // retries; the retry carries the same idempotency key, which Resend dedupes
    // for 24 hours, so only the record write is repeated.
    yield* Effect.tryPromise({
      try: async () => {
        const draftId = `drafts.${doc._id}`;
        const recorded = { paidMailSentAt: new Date().toISOString() };
        // A patch on a missing document fails the whole transaction, so the
        // draft is only patched when it exists.
        const hasDraft = (await client.getDocument(draftId)) != null;
        const transaction = client
          .transaction()
          .patch(doc._id, { setIfMissing: recorded });
        return (
          hasDraft
            ? transaction.patch(draftId, { setIfMissing: recorded })
            : transaction
        ).commit();
      },
      catch: (err) =>
        new WebhookServiceError(
          "record_failed",
          `mail sent but paidMailSentAt not recorded on ${doc._id}: ${errorMessage(err)}`,
        ),
    });

    return Response.json({ ok: true, action: "sent" });
  });

export type DartsPaidWebhookLayer = Layer.Layer<EmailTransport>;

export const handleDartsPaidWebhook = async (
  request: Request,
  env: WorkerEnv,
  layer?: DartsPaidWebhookLayer,
): Promise<Response> => {
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
            console.error(
              `[webhook:darts-paid] ${error.code}: ${error.detail}`,
            );
          }
        }),
      ),
      Effect.catchAll((error) => Effect.succeed(toErrorResponse(error))),
      Effect.catchAllDefect(() =>
        Effect.succeed(
          Response.json({ ok: false, code: "internal" }, { status: 500 }),
        ),
      ),
    ),
  );
};
