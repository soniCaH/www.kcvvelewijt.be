import {
  isMinorOn,
  isPlausibleBirthDate,
  MEDICAL_CERT_ROLES,
  type MembershipRequest,
} from "@kcvv/api-contract";

/**
 * Cross-field business rules that depend on the submit date (the Effect Schema
 * only covers shape). Returns a `{ field: message }` map — empty means valid.
 */
export function validateMembershipRules(
  payload: MembershipRequest,
  now: Date,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const plausible = isPlausibleBirthDate(payload.birthDate, now);

  if (!plausible) {
    // Skip the minor rules: an implausible date says nothing about age.
    errors.birthDate = "Vul een geldige geboortedatum in.";
  } else if (isMinorOn(payload.birthDate, now)) {
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
