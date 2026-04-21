export interface SubjectPlayerRef {
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
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

export interface ResolvedSubject {
  name: string;
  role: string;
  photoUrl: string | null;
  /** Present only for `kind='player'`. Other kinds return null. */
  jerseyNumber: number | null;
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
    };
  }

  // Unknown discriminator (legacy data, failed migration, bad cast). Do not
  // silently fall through to a branch — the caller must handle null.
  return null;
}
