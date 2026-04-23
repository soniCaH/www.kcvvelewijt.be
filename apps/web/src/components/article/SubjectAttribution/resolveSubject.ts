export interface SubjectPlayerRef {
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  /** Field position (e.g. "Middenvelder"). Used by the InterviewHero kicker. */
  position?: string | null;
  transparentImageUrl?: string | null;
  psdImageUrl?: string | null;
}

export interface SubjectStaffRef {
  firstName?: string | null;
  lastName?: string | null;
  functionTitle?: string | null;
  photoUrl?: string | null;
}

export interface SubjectValue {
  kind?: "player" | "staff" | "custom" | null;
  playerRef?: SubjectPlayerRef | null;
  staffRef?: SubjectStaffRef | null;
  customName?: string | null;
  customRole?: string | null;
  customPhotoUrl?: string | null;
}

/**
 * Array-item variant: carries the `_key` that Sanity auto-generates on
 * `article.subjects[]` entries. Used for matching `qaPair.respondentKey`
 * back to the subject that authored a given `key` or `quote` pair.
 */
export interface IndexedSubject extends SubjectValue {
  _key?: string | null;
}

/**
 * Resolve which subject a specific `qaPair` is attributed to. On
 * single-subject interviews, the lone subject always wins — even when the
 * editor never set `respondentKey`. On multi-subject interviews, the
 * Studio validator guarantees `respondentKey` is set on `key`/`quote`
 * pairs before publish; absent or unresolvable values here mean the
 * article was authored before the schema required it (or a subject was
 * removed after the fact) and the helper returns `null`.
 */
export function resolvePairRespondent(
  respondentKey: string | null | undefined,
  subjects: IndexedSubject[] | null | undefined,
): SubjectValue | null {
  const arr = Array.isArray(subjects) ? subjects : [];
  if (arr.length === 0) return null;
  if (respondentKey) {
    const match = arr.find((s) => s?._key === respondentKey);
    if (match) return match;
  }
  // Single-subject: the sole subject is always the respondent.
  if (arr.length === 1) return arr[0] ?? null;
  // Multi-subject with an unresolvable respondentKey. The schema validator
  // blocks publish in this state, so this branch is reached only by
  // legacy/pre-migration docs. Render without attribution rather than
  // guessing a respondent.
  return null;
}

export interface ResolvedSubject {
  name: string;
  role: string;
  photoUrl: string | null;
  /** Present only for `kind='player'`. Other kinds return null. */
  jerseyNumber: number | null;
  /** Present only for `kind='player'` when set on the player document. */
  position: string | null;
}

/**
 * Normalise the `subject` discriminated union from GROQ into a flat shape
 * any attribution-rendering component can consume. Returns `null` when the
 * referenced document is missing (e.g. player deleted) or when the editor
 * has not filled in the required branch fields — in that case the caller
 * should skip the attribution entirely rather than render a half-empty row.
 *
 * Player photo fallback: `transparentImage` is preferred when available, but
 * ~90% of players only have `psdImage`. Callers must treat the returned
 * `photoUrl` as a rectangular portrait by default (see the subject-photo
 * memory), not a silhouette cutout.
 */
export function resolveSubject(
  subject: SubjectValue | null | undefined,
): ResolvedSubject | null {
  if (!subject?.kind) return null;

  if (subject.kind === "player") {
    const p = subject.playerRef;
    if (!p) return null;
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    if (!name) return null;
    return {
      name,
      role: p.jerseyNumber != null ? `#${p.jerseyNumber}` : "",
      photoUrl: p.transparentImageUrl ?? p.psdImageUrl ?? null,
      jerseyNumber: p.jerseyNumber ?? null,
      position: p.position ?? null,
    };
  }

  if (subject.kind === "staff") {
    const s = subject.staffRef;
    if (!s) return null;
    const name = [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
    if (!name) return null;
    return {
      name,
      role: s.functionTitle ?? "",
      photoUrl: s.photoUrl ?? null,
      jerseyNumber: null,
      position: null,
    };
  }

  if (subject.kind === "custom") {
    const name = subject.customName?.trim() ?? "";
    if (!name) return null;
    return {
      name,
      role: subject.customRole ?? "",
      photoUrl: subject.customPhotoUrl ?? null,
      jerseyNumber: null,
      position: null,
    };
  }

  // Unknown discriminator (legacy data, failed migration, bad cast). Do not
  // silently fall through to a branch — the caller must handle null.
  return null;
}
