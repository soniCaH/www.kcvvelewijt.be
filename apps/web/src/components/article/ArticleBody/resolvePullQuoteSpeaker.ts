import { resolvePersonPhotoUrl } from "@/components/article/SubjectAttribution";

/**
 * Resolves a `pullQuote.speaker` reference (dereferenced by the article
 * repository GROQ projection) into the flat shape `<PullQuote>`'s
 * attribution row needs. Mirrors `resolveSubject`'s player/staff branches
 * (`components/article/SubjectAttribution/resolveSubject.ts`) — same shared
 * `resolvePersonPhotoUrl` fallback — but discriminates on the dereferenced
 * `_type` directly rather than a `subject`-union `kind` field, because
 * `pullQuote.speaker` is a plain reference to `player` | `staffMember`, not
 * the `subject` object type the interview flow uses.
 *
 * `role` deliberately reads `position` for a player, not `resolveSubject`'s
 * `#{jerseyNumber}` — the brief is explicit that a Citaat's role comes from
 * the referenced document, and a jersey number is a match-lineup caption,
 * not an attribution for something someone said (#2517 review).
 */

export interface PullQuoteSpeakerRef {
  _type?: "player" | "staffMember" | string;
  firstName?: string | null;
  lastName?: string | null;
  /** `player` only. */
  position?: string | null;
  /** `player` only — preferred over `psdImageUrl` when present. */
  transparentImageUrl?: string | null;
  /** `player` and `staffMember` — the sync-owned fallback photo. */
  psdImageUrl?: string | null;
  /** `staffMember` only — editorial photo, preferred over `psdImageUrl`. */
  photoUrl?: string | null;
  /** `staffMember` only. */
  functionTitle?: string | null;
}

export interface ResolvedPullQuoteSpeaker {
  name: string;
  /** First name only — the `<SubjectAvatar>` monogram/alt-text input. */
  firstName: string;
  role: string;
  photoUrl: string | null;
}

/**
 * Returns `null` when the reference didn't resolve (deleted document) or
 * carries no name — the caller falls through to the external-attribution
 * path, exactly like `resolveSubject`.
 */
export function resolvePullQuoteSpeaker(
  speaker: PullQuoteSpeakerRef | null | undefined,
): ResolvedPullQuoteSpeaker | null {
  if (!speaker?._type) return null;

  const firstName = speaker.firstName?.trim() ?? "";
  const name = [speaker.firstName, speaker.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!name) return null;

  if (speaker._type === "player") {
    return {
      name,
      firstName: firstName || name,
      role: speaker.position ?? "",
      photoUrl: resolvePersonPhotoUrl(
        speaker.transparentImageUrl,
        speaker.psdImageUrl,
      ),
    };
  }

  if (speaker._type === "staffMember") {
    return {
      name,
      firstName: firstName || name,
      role: speaker.functionTitle ?? "",
      photoUrl: resolvePersonPhotoUrl(speaker.photoUrl, speaker.psdImageUrl),
    };
  }

  // Unknown discriminator (legacy data, failed migration) — do not guess.
  return null;
}
