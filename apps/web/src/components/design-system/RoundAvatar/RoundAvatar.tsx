import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/initials";

/**
 * <RoundAvatar> — the round avatar family (#3331, decision #3304).
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
 * `<SubjectAvatar>` and `<SubjectAvatarCluster>` (the article's people) render
 * through it (#3332).
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
  /**
   * Show the photo as-is — no newsprint filter, no multiply blend. For the one
   * image that is not a portrait: the club crest on the help search's club row.
   */
  plainPhoto?: boolean;
  className?: string;
}

// Literal class strings so Tailwind sees them. The ring is 1px at 24, 2px above.
const STEP: Record<RoundAvatarSize, { box: string; glyph: string }> = {
  24: { box: "h-6 w-6 border", glyph: "text-label" },
  40: { box: "h-10 w-10 border-2", glyph: "text-sm" },
  64: { box: "h-16 w-16 border-2", glyph: "text-2xl" },
};

const SANITY_CDN = "https://cdn.sanity.io/";

/**
 * The photo is `unoptimized` (see below), so the browser fetches exactly the URL
 * it is given — and the queries project avatars at `w=400` / `w=600`, ten times
 * the pixels a 24-64px disc shows. Ask Sanity's CDN for twice the step (retina)
 * instead: the cap lives here so every caller benefits. A smaller `w=` is kept,
 * and a URL that is not Sanity's is none of this component's business.
 */
function thumbnailSrc(src: string, size: RoundAvatarSize): string {
  if (!src.startsWith(SANITY_CDN)) return src;
  const url = new URL(src);
  const w = Number(url.searchParams.get("w")) || Infinity;
  url.searchParams.set("w", String(Math.min(w, size * 2)));
  return url.toString();
}

export function RoundAvatar({
  size,
  name,
  photoUrl,
  glyph,
  dashed = false,
  plainPhoto = false,
  className,
}: RoundAvatarProps) {
  const step = STEP[size];
  const src = glyph === undefined ? (photoUrl?.trim() ?? "") : "";
  const hasPhoto = src !== "";

  return (
    <span
      aria-hidden="true"
      data-round-avatar={
        hasPhoto ? "photo" : glyph === undefined ? "monogram" : "glyph"
      }
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
          src={thumbnailSrc(src, size)}
          alt=""
          width={size}
          height={size}
          // Metered optimizer, 24-64px thumbnails — same call as <Crest> and
          // the organigram avatars this replaces.
          unoptimized
          className={cn(
            "h-full w-full object-cover",
            !plainPhoto && "mix-blend-multiply",
          )}
          style={
            plainPhoto ? undefined : { filter: "var(--filter-photo-newsprint)" }
          }
        />
      ) : (
        <span
          className={cn(
            "text-jersey-deep",
            // Letters are the display face; a "+N" / "+" is a sign, and the
            // display face draws its plus too small to read at 40px.
            glyph === undefined
              ? "font-display-big font-black"
              : "font-mono font-semibold",
            step.glyph,
          )}
        >
          {glyph ?? (initials(name) || "·")}
        </span>
      )}
    </span>
  );
}
