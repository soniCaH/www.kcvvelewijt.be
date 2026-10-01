import type { MembershipRole } from "@kcvv/api-contract";

/**
 * Every visitor-filled field of the membership form — the **draft** (#3326).
 * The Turnstile token and the honeypot are deliberately not here: the token is
 * single-use and the widget issues a fresh one on mount, and a restored
 * honeypot hit would stick.
 */
export interface MembershipDraft {
  role: MembershipRole | "";
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  municipality: string;
  email: string;
  priorClub: string;
  parentEmail: string;
  parentalConsent: boolean;
  medicalCertAcknowledged: boolean;
  privacyAccepted: boolean;
}

export const EMPTY_DRAFT: MembershipDraft = {
  role: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "",
  municipality: "",
  email: "",
  priorClub: "",
  parentEmail: "",
  parentalConsent: false,
  medicalCertAcknowledged: false,
  privacyAccepted: false,
};

export const DRAFT_STORAGE_KEY = "kcvv:membership-draft";

/** Every reader and writer swallows a throwing accessor (private mode,
 * blocked site data): no storage means today's behaviour, never an error. */
function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isDraft(value: unknown): value is MembershipDraft {
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(EMPTY_DRAFT).every(
    ([key, empty]) =>
      typeof (value as Record<string, unknown>)[key] === typeof empty,
  );
}

/** The stored draft, or `null` when there is none, it is malformed, or storage is blocked. */
export function readDraft(): MembershipDraft | null {
  try {
    const raw = storage()?.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: MembershipDraft): void {
  try {
    storage()?.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota or blocked storage — the form keeps working without a draft.
  }
}

export function clearDraft(): void {
  try {
    storage()?.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Blocked storage — nothing to clear.
  }
}
