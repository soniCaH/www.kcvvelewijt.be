import Image from "next/image";

import { cn } from "@/lib/utils/cn";

export interface CrestProps {
  /** Club / team name — drives the initialled fallback disc. */
  name: string;
  /** Club logo URL. When present, rendered as an image; otherwise an initialled disc. */
  logo?: string;
  /** Square px size of the crest. Default `20`. */
  size?: number;
  className?: string;
}

/**
 * Small club crest — the club logo when a `logo` URL is present, else a
 * mono-initialled outline disc. Shared across the calendar, team, and match
 * surfaces (was hand-rolled three times before #2006).
 *
 * The fallback disc uses `border-current` (ink-muted) with a font-size derived
 * from `size`, so the glyph scales with the crest. Logo images are deliberately
 * `unoptimized`: the Vercel image optimizer is metered per source image and
 * saves negligible bytes for these tiny (16–20px) CDN crests across a full
 * division.
 */
export function Crest({ name, logo, size = 20, className }: CrestProps) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn("shrink-0 object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "text-ink-muted inline-flex shrink-0 items-center justify-center rounded-full border border-current font-mono leading-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.round(size * 0.5)),
      }}
    >
      {initial}
    </span>
  );
}
