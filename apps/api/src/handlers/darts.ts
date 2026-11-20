import { Effect } from "effect";
import {
  DARTS_TEAM_LIMIT,
  HttpBadRequest,
  HttpServiceUnavailable,
  isDartsSignupClosed,
  type DartsSignupRequest,
} from "@kcvv/api-contract";
// The event date lives in the web app's facts file; see forms/darts-emails.ts.
import darts from "../../../web/src/data/darts.json";
import { SanityMutation } from "../sanity/mutation";
import { SanityProjection } from "../sanity/projection";
import { EmailTransport } from "../email/resend";
import { verifyTurnstile } from "../forms/turnstile";
import { buildDartsSignupEmails } from "../forms/darts-emails";

const countsUnavailable = () =>
  new HttpServiceUnavailable({
    error:
      "De inschrijving kon niet worden gecontroleerd. Probeer later opnieuw.",
  });

/**
 * Spots left, counted live from Sanity on every call (#3812): never cached,
 * never stored, so a deleted signup frees its spot and a Studio-made one takes it.
 */
export const handleDartsSpots = () =>
  Effect.gen(function* () {
    const projection = yield* SanityProjection;
    const { teams } = yield* projection
      .getDartsCounts()
      .pipe(Effect.mapError(countsUnavailable));
    return { spotsLeft: Math.max(0, DARTS_TEAM_LIMIT - teams) };
  });

/**
 * Handle a public EK Darts signup.
 *
 * Order: honeypot → Turnstile → closed after the event day → fresh count (spot
 * or wachtlijst) → persist (Sanity) → send (Resend, best-effort). Persist-then-send
 * means a captured signup is never lost to an email failure.
 *
 * shortcut: count-then-write is not atomic, so two signups in the same moment can
 * both take spot 24. Fine at this volume; Kevin sees it in the Studio and moves one
 * to the wachtlijst by hand.
 */
export const handleDartsSignup = (
  payload: DartsSignupRequest,
  now = new Date(),
) =>
  Effect.gen(function* () {
    // 1. Honeypot — bots fill `company`. Pretend success, persist nothing.
    if (payload.company && payload.company.trim() !== "") {
      yield* Effect.logInfo("[darts] honeypot tripped — dropping submission");
      return { ok: true as const, waitlist: false };
    }

    // 2. Turnstile spam check.
    const human = yield* verifyTurnstile(payload.turnstileToken);
    if (!human) {
      return yield* Effect.fail(
        new HttpBadRequest({
          error: "Verificatie mislukt. Vernieuw de pagina en probeer opnieuw.",
        }),
      );
    }

    // 3. Closed after the event day — checked per request, never at build time.
    if (isDartsSignupClosed(darts.datum.iso, now)) {
      return yield* Effect.fail(
        new HttpBadRequest({ error: "De inschrijvingen zijn gesloten." }),
      );
    }

    // 4. Fresh count decides spot or wachtlijst.
    const projection = yield* SanityProjection;
    const counts = yield* projection
      .getDartsCounts()
      .pipe(Effect.mapError(countsUnavailable));
    const waitlist = counts.teams >= DARTS_TEAM_LIMIT;
    const number = waitlist ? counts.waitlist + 1 : counts.teams + 1;

    // 5. Persist first — failure here is the only one that fails the request.
    const sanity = yield* SanityMutation;
    yield* sanity
      .writeDartsSignup({
        teamName: payload.teamName,
        captainName: payload.captainName,
        captainEmail: payload.captainEmail,
        captainPhone: payload.captainPhone,
        remark: payload.remark,
        waitlist,
        submittedAt: now.toISOString(),
      })
      .pipe(
        Effect.mapError(
          () =>
            new HttpServiceUnavailable({
              error:
                "Je inschrijving kon niet worden opgeslagen. Probeer later opnieuw.",
            }),
        ),
      );

    // 6. Captain mail + club copy — best-effort.
    const transport = yield* EmailTransport;
    yield* Effect.forEach(
      buildDartsSignupEmails({ payload, waitlist, number }),
      (message) =>
        transport
          .dispatchEmail(message)
          .pipe(
            Effect.catchAll((err) =>
              Effect.logError(`[darts] email dispatch failed: ${String(err)}`),
            ),
          ),
      { discard: true },
    );

    return { ok: true as const, waitlist };
  });
