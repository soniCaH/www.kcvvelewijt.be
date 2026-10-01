import { RoundAvatar, type RoundAvatarSize } from "../RoundAvatar";

/**
 * <SubjectAvatar> — the article's person avatar, one scale prop over the round
 * avatar family (`<RoundAvatar>`, #3331; joined in #3332, decision #3304).
 *
 * The scale picks a step of the family's 24 / 40 / 64 ramp, and the ring, the
 * monogram fill (jersey-deep glyph on cream-soft) and the initials all come
 * from the primitive. What stays here is the one choice the primitive does not
 * make — which scale may show a photo (`avatar-locked.md`, scale-conditional):
 *
 * - `byline` (24) — `<EditorialByline>` author monogram. Never a photo.
 * - `row` (40) — `<QARow>` / rapid-fire speaker strip. Never a photo: a face is
 *   not identifiable that small, a monogram is a deterministic marker.
 * - `attribution` (64) — `<PullQuote>` attribution. The photo when `photoUrl`
 *   resolves, the monogram otherwise.
 *
 * Letters come from the family's `initials()` (#3304): one letter for the first
 * name an article subject carries — compound first names included — and two for
 * the full author name the byline passes ("Tom Janssens" -> "TJ").
 */
export type SubjectAvatarScale = "byline" | "row" | "attribution";

/*
 * The avatar never speaks (#2559 / #2548 rule 4) — the primitive is silent, so
 * there is no accessible-name prop to feed.
 */

export interface SubjectAvatarProps {
  /**
   * The name the monogram is derived from. Player and staff subjects pass
   * `firstName`, custom subjects the first token of `customName`: one letter,
   * whatever the first name's length (only its first token is used). The byline
   * passes the author's full name: two.
   */
  firstName: string;
  /** Photo source, used at `attribution` scale only; the other scales ignore it. */
  photoUrl?: string | null;
  scale: SubjectAvatarScale;
  className?: string;
}

export const SUBJECT_AVATAR_SIZE: Record<SubjectAvatarScale, RoundAvatarSize> =
  {
    byline: 24,
    row: 40,
    attribution: 64,
  };

/**
 * An article subject is known by a first name, and a compound one ("Jan
 * Willem", "Mohamed Amine") is still ONE first name: one letter. Only the byline
 * carries a full author name, and that one gets the helper's two.
 */
function monogramName(name: string, scale: SubjectAvatarScale): string {
  return scale === "byline" ? name : (name.trim().split(/\s+/)[0] ?? "");
}

export function SubjectAvatar({
  firstName,
  photoUrl,
  scale,
  className,
}: SubjectAvatarProps) {
  return (
    <RoundAvatar
      size={SUBJECT_AVATAR_SIZE[scale]}
      name={monogramName(firstName, scale)}
      photoUrl={scale === "attribution" ? photoUrl : null}
      className={className}
    />
  );
}
