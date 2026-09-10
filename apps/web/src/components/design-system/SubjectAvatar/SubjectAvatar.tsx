import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * <SubjectAvatar> — net-new Phase 5 primitive (per 5.d2 lock).
 *
 * Two render paths picked by the consuming component:
 *
 * - `scale="row"` (~32px) — always renders an initial monogram on a
 *   jersey-deep disc. Used by `<QARow>` in the interview Q&A section
 *   (5.B.int, #1795). A photo at 32px is too small to identify a face;
 *   the monogram is at least a deterministic marker tied to the speaker.
 * - `scale="attribution"` (~64px) — renders a circular photo crop when
 *   `photoUrl` resolves, with Phase 4.5 R9 newsprint treatment (filter +
 *   paper-grain overlay + 1px ink border). Falls back to a 64px monogram
 *   on the same jersey-deep disc when no photo exists. Used by
 *   `<PullQuote>` attribution.
 *
 * Monogram derivation rule (locked in `avatar-locked.md`): first initial
 * of `firstName` only. Single uppercase letter, italic Freight Display
 * 900, full-opacity cream on jersey-deep.
 */
export type SubjectAvatarScale = "byline" | "row" | "attribution";

/*
 * The avatar never speaks (#2559 / #2548 rule 4). Both paths are silent: the
 * monogram is two letters and the photo sits beside the subject's own name in
 * the attribution row, so either would only repeat text the reader already
 * has. There was a `fullName` prop feeding an accessible name — it is gone,
 * because a slot that must stay silent has no use for one.
 */

export interface SubjectAvatarProps {
  /**
   * Monogram derivation only (first letter, uppercased). Custom subjects
   * pass the value of `customName`; staff subjects pass the value of
   * `firstName`; player subjects pass `firstName`.
   */
  firstName: string;
  /**
   * Source URL for the photo path. When `null`/empty/missing AND
   * `scale === "attribution"`, the avatar falls back to the monogram
   * render path. `scale === "row"` ignores `photoUrl` entirely (always
   * monogram).
   */
  photoUrl?: string | null;
  scale: SubjectAvatarScale;
  className?: string;
}

const SCALE: Record<
  SubjectAvatarScale,
  {
    box: string;
    monoText: string;
    sizes: string;
  }
> = {
  // Byline scale — the smallest variant, locked at 24px by 5.d-col for
  // the `<EditorialByline>` author monogram chip. Sits next to mono-caps
  // byline text so it has to read at a glance without dominating the row.
  byline: {
    box: "h-6 w-6",
    monoText: "text-[12px]",
    sizes: "24px",
  },
  row: {
    box: "h-8 w-8",
    monoText: "text-[15px]",
    sizes: "32px",
  },
  attribution: {
    box: "h-16 w-16",
    monoText: "text-[30px]",
    sizes: "64px",
  },
};

function deriveInitial(firstName: string): string {
  const trimmed = firstName.trim();
  if (trimmed.length === 0) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function SubjectAvatar({
  firstName,
  photoUrl,
  scale,
  className,
}: SubjectAvatarProps) {
  const tokens = SCALE[scale];
  // Trim before length-checking so whitespace-only photoUrl values
  // (e.g. `"   "` from a poorly-sanitised Sanity field) fall through to
  // the monogram path rather than feeding an invalid <img src>.
  const normalizedPhotoUrl =
    typeof photoUrl === "string" ? photoUrl.trim() : "";
  const hasPhoto = scale === "attribution" && normalizedPhotoUrl.length > 0;

  if (hasPhoto) {
    return (
      <div
        data-subject-avatar="photo"
        data-scale={scale}
        className={cn(
          "border-ink relative shrink-0 overflow-hidden rounded-full border",
          tokens.box,
          className,
        )}
      >
        <Image
          src={normalizedPhotoUrl}
          alt=""
          fill
          sizes={tokens.sizes}
          // Same source as the cards and heroes — `subjects[]` resolves
          // `transparentImageUrl ?? psdImageUrl` for a player and
          // `photoUrl ?? psdImageUrl` for staff — so a studio cutout would
          // otherwise render as a white disc beside surfaces that blend
          // (#2901 review). `bg-cream-soft` is the ground the matte lands on;
          // the wrapper paints none.
          className="bg-cream-soft object-cover mix-blend-multiply"
          style={{ filter: "var(--filter-photo-newsprint)" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
          style={{ backgroundImage: "var(--pattern-paper-grain)" }}
        />
      </div>
    );
  }

  const initial = deriveInitial(firstName);
  return (
    <div
      data-subject-avatar="monogram"
      data-scale={scale}
      aria-hidden="true"
      className={cn(
        "bg-jersey-deep inline-flex shrink-0 items-center justify-center rounded-full",
        tokens.box,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "font-display text-cream leading-none font-black italic",
          tokens.monoText,
        )}
      >
        {initial}
      </span>
    </div>
  );
}
