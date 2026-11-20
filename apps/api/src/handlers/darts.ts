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

type Counts = { teams: number; waitlist: number };

/**
 * Wachtlijst first (Kevin, 2026-11-20): while anyone is on the wachtlijst a
 * spot is not free, even when fewer than 24 teams hold one. Kevin moves
 * wachtlijst teams up by hand.
 */
const hasFreeSpot = (counts: Counts): boolean =>
  counts.teams < DARTS_TEAM_LIMIT && counts.waitlist === 0;

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
    const counts = yield* projection
      .getDartsCounts()
      .pipe(Effect.mapError(countsUnavailable));
    return {
      spotsLeft: hasFreeSpot(counts) ? DARTS_TEAM_LIMIT - counts.teams : 0,
    };
  });

/**
 * Handle a public EK Darts signup.
 *
 * Order: honeypot → Turnstile → closed after the event day → resubmit check →
 * fresh count (spot or wachtlijst) → persist (Sanity) → send (Resend, best-effort). Persist-then-send
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

    // 4. The same team signed up by the same captain already: the earlier
    // request was saved but its answer never arrived (the web proxy gives up
    // after 10 s, the mails take longer). Answer with that signup's status and
    // write and mail nothing, or a resubmit would take a second place.
    const projection = yield* SanityProjection;
    const existing = yield* projection
      .findDartsSignup({
        teamName: payload.teamName,
        captainEmail: payload.captainEmail,
      })
      .pipe(Effect.mapError(countsUnavailable));
    if (existing) {
      yield* Effect.logInfo(
        `[darts] resubmit of a saved signup, no write (${existing.waitlist ? "wachtlijst" : "spot"} ${existing.number})`,
      );
      return { ok: true as const, waitlist: existing.waitlist };
    }

    // 5. Fresh count decides spot or wachtlijst.
    const counts = yield* projection
      .getDartsCounts()
      .pipe(Effect.mapError(countsUnavailable));
    const waitlist = !hasFreeSpot(counts);
    const number = waitlist ? counts.waitlist + 1 : counts.teams + 1;

    // 6. Persist first — failure here is the only one that fails the request.
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

    // 7. Captain mail + club copy — best-effort.
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
