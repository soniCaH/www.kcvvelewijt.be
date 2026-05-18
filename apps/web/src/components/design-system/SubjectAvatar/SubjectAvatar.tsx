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
export type SubjectAvatarScale = "row" | "attribution";

export interface SubjectAvatarProps {
  /**
   * Used for both monogram derivation (first letter, uppercased) and
   * the photo path's accessible name (when `fullName` is omitted).
   * Custom subjects pass the value of `customName`; staff subjects pass
   * the value of `firstName`; player subjects pass `firstName`.
   */
  firstName: string;
  /**
   * Full display name for screen readers (defaults to `firstName`).
   * Pull-quote attribution renders the full name beside the avatar, so
   * the visible name is in the attribution row — the avatar's alt is
   * the same text repeated unless the consumer overrides.
   */
  fullName?: string;
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
  fullName,
  photoUrl,
  scale,
  className,
}: SubjectAvatarProps) {
  const tokens = SCALE[scale];
  const hasPhoto =
    scale === "attribution" &&
    typeof photoUrl === "string" &&
    photoUrl.length > 0;
  const accessibleName = (fullName ?? firstName).trim() || "Subject";

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
          src={photoUrl!}
          alt={accessibleName}
          fill
          sizes={tokens.sizes}
          className="object-cover"
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
      aria-label={accessibleName}
      role="img"
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
