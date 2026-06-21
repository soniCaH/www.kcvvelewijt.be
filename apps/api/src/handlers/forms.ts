import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  HttpBadRequest,
  HttpServiceUnavailable,
  type MembershipRequest,
  type MembershipRole,
} from "@kcvv/api-contract";
import { SanityMutation } from "../sanity/mutation";
import { SanityProjection, type FormRoutingConfig } from "../sanity/projection";
import { KvCacheService } from "../cache/kv-cache";
import { EmailTransport } from "../email/resend";
import { verifyTurnstile } from "../forms/turnstile";
import { isMinorOn, validateMembershipRules } from "../forms/membership-rules";
import { buildMembershipEmails } from "../forms/membership-emails";

const DEFAULT_ADMIN_RECIPIENT = "info@kcvvelewijt.be";
const ROUTING_CACHE_KEY = "forms:routing-config";
const ROUTING_CACHE_TTL = 60 * 60; // 1h — config changes rarely; submissions are sparse

/** Cached per-role admin recipient; falls back to info@ on any miss/error. */
const resolveAdminRecipient = (role: MembershipRole) =>
  Effect.gen(function* () {
    const cache = yield* KvCacheService;
    const projection = yield* SanityProjection;

    const cached = yield* cache.get(ROUTING_CACHE_KEY);
    let config: FormRoutingConfig | null = cached
      ? yield* Effect.try({
          try: () => JSON.parse(cached) as FormRoutingConfig,
          catch: () => new Error("parse"),
        }).pipe(Effect.orElseSucceed(() => null))
      : null;

    if (!config) {
      config = yield* projection
        .getFormRoutingConfig()
        .pipe(Effect.orElseSucceed(() => null));
      if (config) {
        yield* cache.set(
          ROUTING_CACHE_KEY,
          JSON.stringify(config),
          ROUTING_CACHE_TTL,
        );
      }
    }

    return config?.[role] ?? DEFAULT_ADMIN_RECIPIENT;
  });

/**
 * Handle a public membership-intake submission.
 *
 * Order: honeypot → Turnstile → business rules → persist (Sanity) → send
 * (Resend, best-effort). Persist-then-send means a captured application is
 * never lost to an email failure.
 */
export const handleMembership = (payload: MembershipRequest) =>
  Effect.gen(function* () {
    // 1. Honeypot — bots fill `company`. Pretend success, persist nothing.
    if (payload.company && payload.company.trim() !== "") {
      yield* Effect.logInfo(
        "[membership] honeypot tripped — dropping submission",
      );
      return { ok: true as const };
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

    // 3. Cross-field business rules (minor flow, medical cert).
    const now = new Date();
    const fieldErrors = validateMembershipRules(payload, now);
    if (Object.keys(fieldErrors).length > 0) {
      return yield* Effect.fail(
        new HttpBadRequest({
          error: "Sommige velden ontbreken of zijn ongeldig.",
          fields: fieldErrors,
        }),
      );
    }

    const isMinor = isMinorOn(payload.birthDate, now);

    // 4. Persist first — failure here is the only one that fails the request.
    const sanity = yield* SanityMutation;
    yield* sanity
      .writeMembershipApplication({
        role: payload.role,
        firstName: payload.firstName,
        lastName: payload.lastName,
        birthDate: payload.birthDate,
        gender: payload.gender,
        municipality: payload.municipality,
        email: payload.email,
        priorClub: payload.priorClub,
        isMinor,
        parentEmail: payload.parentEmail,
        parentalConsent: payload.parentalConsent ?? false,
        medicalCertAcknowledged: payload.medicalCertAcknowledged ?? false,
        privacyAccepted: payload.privacyAccepted,
        submittedAt: now.toISOString(),
      })
      .pipe(
        Effect.mapError(
          () =>
            new HttpServiceUnavailable({
              error:
                "Inschrijving kon niet worden opgeslagen. Probeer later opnieuw.",
            }),
        ),
      );

    // 5. Send acknowledgments + admin notification — best-effort.
    const adminRecipient = yield* resolveAdminRecipient(payload.role);
    const transport = yield* EmailTransport;
    const messages = buildMembershipEmails({
      payload,
      isMinor,
      adminRecipient,
    });
    yield* Effect.forEach(
      messages,
      (message) =>
        transport
          .dispatchEmail(message)
          .pipe(
            Effect.catchAll((err) =>
              Effect.logWarning(
                `[membership] email dispatch failed: ${String(err)}`,
              ),
            ),
          ),
      { discard: true },
    );

    return { ok: true as const };
  });

export const FormsApiLive = HttpApiBuilder.group(PsdApi, "forms", (handlers) =>
  handlers.handle("membershipForm", ({ payload }) => handleMembership(payload)),
);
