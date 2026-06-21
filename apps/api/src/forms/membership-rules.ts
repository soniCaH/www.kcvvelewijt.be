import { MEDICAL_CERT_ROLES, type MembershipRequest } from "@kcvv/api-contract";

/**
 * Age in whole years on `on` for a `YYYY-MM-DD` birth date.
 *
 * ponytail: UTC date arithmetic, no tz library. A one-day timezone edge is
 * immaterial to an 18-year membership threshold.
 */
export function ageOn(birthDate: string, on: Date): number {
  const parts = birthDate.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  let age = on.getUTCFullYear() - year;
  const monthDiff = on.getUTCMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && on.getUTCDate() < day)) {
    age -= 1;
  }
  return age;
}

export function isMinorOn(birthDate: string, on: Date): boolean {
  return ageOn(birthDate, on) < 18;
}

/**
 * Cross-field business rules that depend on the submit date (the Effect Schema
 * only covers shape). Returns a `{ field: message }` map — empty means valid.
 */
export function validateMembershipRules(
  payload: MembershipRequest,
  now: Date,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const minor = isMinorOn(payload.birthDate, now);

  if (minor) {
    if (!payload.parentEmail) {
      errors.parentEmail =
        "Verplicht voor minderjarigen: vul het e-mailadres van een ouder of voogd in.";
    }
    if (payload.parentalConsent !== true) {
      errors.parentalConsent =
        "Verplicht voor minderjarigen: de ouder/voogd moet toestemming geven.";
    }
  }

  if (
    MEDICAL_CERT_ROLES.includes(payload.role) &&
    payload.medicalCertAcknowledged !== true
  ) {
    errors.medicalCertAcknowledged =
      "Bevestig dat je een medisch attest van geneeskundige geschiktheid zal voorleggen.";
  }

  return errors;
}
