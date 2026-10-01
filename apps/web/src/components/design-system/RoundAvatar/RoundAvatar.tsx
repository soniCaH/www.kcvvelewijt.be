import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/initials";

/**
 * <RoundAvatar> — the one round avatar (#3331, decision #3304).
 *
 * A person is a circle on a three-step ramp (24 / 40 / 64) with one ring rule
 * (1px ink at 24, 2px ink at 40 and 64) and one no-photo answer: a monogram,
 * jersey-deep glyph on cream-soft. **Never the drawn figure** — at 24-64px a
 * `<JerseyIllustration>` reads as a blob, initials stay legible. Cards and
 * heroes draw the figure; round avatars set initials. That split is the round
 * family's rule, not an exception to it.
 *
 * Domain-free: it takes a `name` and a `photoUrl`, never a staff / player /
 * organigram shape. The letters come from `initials()` — first + last token
 * for a full name, one letter for a first name only.
 *
 * `glyph` replaces the initials with explicit text for the two circles that
 * are not a person but sit among people: a "+N" count and a "+" vacancy
 * (`dashed`). They take the ring, fill and size of the avatar beside them.
 *
 * The avatar never speaks: the person's name always sits beside it, so both
 * paths are `aria-hidden` and the photo carries an empty `alt`.
 */
export const ROUND_AVATAR_SIZES = [24, 40, 64] as const;
export type RoundAvatarSize = (typeof ROUND_AVATAR_SIZES)[number];

export interface RoundAvatarProps {
  size: RoundAvatarSize;
  /** The person's name — letters are derived from it when there is no photo. */
  name?: string;
  /** Photo source. Null / empty / whitespace → the monogram. */
  photoUrl?: string | null;
  /** Explicit text instead of initials (a "+N" count, a "+" vacancy). Never a photo. */
  glyph?: string;
  /** Dashed ring — a vacancy, not a person. */
  dashed?: boolean;
  className?: string;
}

// Literal class strings so Tailwind sees them. The ring is 1px at 24, 2px above.
const STEP: Record<RoundAvatarSize, { box: string; glyph: string }> = {
  24: { box: "h-6 w-6 border", glyph: "text-label" },
  40: { box: "h-10 w-10 border-2", glyph: "text-sm" },
  64: { box: "h-16 w-16 border-2", glyph: "text-2xl" },
};

export function RoundAvatar({
  size,
  name,
  photoUrl,
  glyph,
  dashed = false,
  className,
}: RoundAvatarProps) {
  const step = STEP[size];
  const src = glyph === undefined ? (photoUrl?.trim() ?? "") : "";
  const hasPhoto = src !== "";

  return (
    <span
      aria-hidden="true"
      data-round-avatar={hasPhoto ? "photo" : "monogram"}
      data-size={size}
      className={cn(
        "border-ink bg-cream-soft inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        step.box,
        dashed && "border-dashed",
        className,
      )}
    >
      {hasPhoto ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          // Metered optimizer, 24-64px thumbnails — same call as <Crest> and
          // the organigram avatars this replaces.
          unoptimized
          className="h-full w-full object-cover mix-blend-multiply"
          style={{ filter: "var(--filter-photo-newsprint)" }}
        />
      ) : (
        <span
          className={cn(
            "text-jersey-deep font-display-big font-black",
            step.glyph,
          )}
        >
          {glyph ?? (initials(name) || "·")}
        </span>
      )}
    </span>
  );
}
