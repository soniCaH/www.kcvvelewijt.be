import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  JERSEY_FIGURE_VIEWBOX,
  JERSEY_HEAD_ELLIPSE,
  JERSEY_SHOULDER_BUMP_LEFT_PATH,
  JERSEY_SHOULDER_BUMP_RIGHT_PATH,
  JERSEY_TORSO_FILL_PATH,
  JERSEY_TORSO_OUTLINE_PATH,
  JERSEY_V_COLLAR_PATH,
  JERSEY_VERTICAL_STRIPE_PATHS,
} from "@/components/design-system/_jersey-paths";

const STRIPE_STROKE_WIDTH = 2;
const OUTLINE_STROKE_WIDTH = 3;

export interface PlayerCardProps {
  firstName: string;
  lastName: string;
  /** Resolved, sentence-case position label (e.g. "Middenvelder"). */
  position: string;
  jerseyNumber?: number;
  /** Resolved photo URL (transparentImageUrl ?? psdImageUrl). Missing → illustration. */
  photoUrl?: string;
  /** Detail-page href. When absent the card is not a link. */
  href?: string;
  className?: string;
}

/** Canonical jersey illustration fill — shared with <PlayerHero> / <PlayerFigure>. */
function CardIllustration() {
  return (
    <div
      data-testid="player-card-illustration"
      aria-hidden="true"
      className="bg-cream-soft absolute inset-0"
    >
      <div className="absolute inset-0 opacity-95 mix-blend-multiply">
        <svg
          viewBox={JERSEY_FIGURE_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          <g fill="var(--color-jersey-deep)">
            <ellipse {...JERSEY_HEAD_ELLIPSE} />
            <path d={JERSEY_TORSO_FILL_PATH} />
            <path d={JERSEY_SHOULDER_BUMP_LEFT_PATH} />
            <path d={JERSEY_SHOULDER_BUMP_RIGHT_PATH} />
          </g>
        </svg>
      </div>
      <div className="absolute inset-0 translate-x-[2px] translate-y-[1px]">
        <svg
          viewBox={JERSEY_FIGURE_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          <g
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={OUTLINE_STROKE_WIDTH}
            strokeLinejoin="miter"
            strokeLinecap="square"
          >
            <ellipse {...JERSEY_HEAD_ELLIPSE} />
            <path d={JERSEY_TORSO_OUTLINE_PATH} />
            <path d={JERSEY_V_COLLAR_PATH} />
            {JERSEY_VERTICAL_STRIPE_PATHS.map((d) => (
              <path key={d} d={d} strokeWidth={STRIPE_STROKE_WIDTH} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

export function PlayerCard({
  firstName,
  lastName,
  position,
  jerseyNumber,
  photoUrl,
  href,
  className,
}: PlayerCardProps) {
  const hasPhoto = photoUrl !== undefined && photoUrl !== "";

  const cardClass = cn(
    "border-ink bg-cream block border-2 p-2 pb-3 shadow-[4px_4px_0_0_var(--color-ink)]",
    "transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
    className,
  );

  const inner = (
    <>
      {/* 3:4 photo / illustration with number disc overlay */}
      <div
        data-testid="player-card-figure"
        data-state={hasPhoto ? "photo" : "illustration"}
        className="border-paper-edge relative aspect-[3/4] overflow-hidden border"
      >
        {hasPhoto ? (
          <Image
            src={photoUrl!}
            alt={`${firstName} ${lastName}`}
            width={300}
            height={400}
            unoptimized
            className="block h-full w-full object-cover"
            style={{ filter: "var(--filter-photo-newsprint)" }}
          />
        ) : (
          <CardIllustration />
        )}

        {jerseyNumber !== undefined ? (
          <span
            data-testid="player-card-number"
            aria-hidden="true"
            className="bg-jersey-deep text-cream border-ink font-display-big absolute top-1.5 left-1.5 grid h-[26px] w-[26px] place-items-center border-[1.5px] text-sm font-black tabular-nums"
          >
            {jerseyNumber}
          </span>
        ) : null}
      </div>

      {/* Name — first semibold + last italic (6.A rhythm) */}
      <p className="font-display text-ink mt-2 leading-[1.05]">
        <span className="font-semibold">{firstName}</span>{" "}
        <em className="font-normal italic">{lastName}</em>
      </p>

      {/* Position */}
      <p className="text-ink-muted mt-1 font-mono text-[9px] tracking-[0.06em] uppercase">
        {position}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        data-testid="player-card"
        aria-label={`${firstName} ${lastName} — ${position}`}
        className={cardClass}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div data-testid="player-card" className={cardClass}>
      {inner}
    </div>
  );
}
