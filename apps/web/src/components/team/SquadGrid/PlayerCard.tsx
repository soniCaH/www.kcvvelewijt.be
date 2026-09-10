import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { TapedCard } from "@/components/design-system/TapedCard";
import {
  JerseyIllustration,
  playerFigureSeed,
  type JerseyIllustrationGarment,
} from "@/components/design-system/JerseyIllustration";

export interface PlayerCardProps {
  /**
   * Stable identity — e.g. the Sanity `_id`. Seeds the illustration
   * fallback via `playerFigureSeed` (#2635): never the display name, so a
   * spelling fix or a married name never redraws the figure, and two
   * players sharing a first+last name never draw identically.
   */
  id: string;
  firstName: string;
  lastName: string;
  /**
   * Resolved, sentence-case role/position label — a player's canonical
   * position (e.g. "Middenvelder"), or (since #2575) a staff member's
   * resolved function label (e.g. "Hoofdtrainer"). Absent when no editor
   * has authored one and PSD carries none either (#2567) — the label is
   * omitted rather than defaulted, so an unfilled position is
   * distinguishable from an authored one.
   */
  position?: string;
  jerseyNumber?: number;
  /** Resolved photo URL (transparentImageUrl ?? psdImageUrl). Missing → illustration. */
  photoUrl?: string;
  /** Detail-page href. When absent the card is not a link. */
  href?: string;
  /** Which garment the imageless-fallback figure wears (#2485): `"jersey"` (default) for a player, `"coat"` for a staff document. */
  garment?: JerseyIllustrationGarment;
  /**
   * Blend the photo onto the card's cream via `mix-blend-multiply` (#2633).
   * Default `true`, and now used by every consumer: a person photo on this site
   * is a studio cutout on white, so the matte is always there to erase. The
   * escape hatch stays for a surface that ever renders a genuinely free-form
   * upload — `<TeamStaff>` passed `false` until #2901, when PSD-synced staff
   * portraits made staff photos as standardised as players'.
   */
  blendPhoto?: boolean;
  /** Show a resting "Bekijk →" affordance under a linked card (BEST-1). Default `false`; `<TeamStaff>` passes `true` for its routinely-mixed linked/unlinked runs (#2575 review). */
  linkAffordance?: boolean;
  className?: string;
}

export function PlayerCard({
  id,
  firstName,
  lastName,
  position,
  jerseyNumber,
  photoUrl,
  href,
  garment,
  blendPhoto = true,
  linkAffordance = false,
  className,
}: PlayerCardProps) {
  const hasPhoto = photoUrl !== undefined && photoUrl !== "";
  const hasPosition = position !== undefined && position !== "";

  const inner = (
    <>
      {/* 3:4 photo / illustration with number disc overlay. `bg-cream` is the
          backdrop the photo multiplies against — the same token the card
          already paints, so nothing moves, but the blend stops depending
          silently on <TapedCard> painting cream two levels up. */}
      <div
        data-testid="player-card-figure"
        data-state={hasPhoto ? "photo" : "illustration"}
        className="border-paper-edge bg-cream relative aspect-[3/4] overflow-hidden border"
      >
        {hasPhoto ? (
          /* Multiply drops a studio cutout's white matte onto the card's
             cream (#2633, deciding #2590) — see `blendPhoto` for why a
             staff upload skips it. */
          <Image
            src={photoUrl!}
            alt=""
            width={300}
            height={400}
            unoptimized
            className={cn(
              "block h-full w-full object-cover",
              blendPhoto && "mix-blend-multiply",
            )}
            style={{ filter: "var(--filter-photo-newsprint)" }}
          />
        ) : (
          <JerseyIllustration
            variant="card"
            seed={playerFigureSeed({ id })}
            garment={garment}
            data-testid="player-card-illustration"
          />
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

      {/* Position — omitted, not defaulted, when unauthored (#2567). */}
      {hasPosition ? (
        <p className="text-ink-muted mt-1 font-mono text-[9px] tracking-[0.06em] uppercase">
          {position}
        </p>
      ) : null}

      {/* BEST-1: only a clickable card gets a visible resting affordance,
          so clickable vs non-clickable no longer read identically on a
          mixed run — see `linkAffordance`'s doc comment. */}
      {linkAffordance && href ? (
        <span
          data-testid="player-card-link-affordance"
          className="text-jersey-deep mt-1.5 font-mono text-[9px] font-semibold tracking-[0.1em] uppercase"
        >
          Bekijk →
        </span>
      ) : null}
    </>
  );

  const card = (
    <TapedCard
      bg="cream"
      shadow="sm"
      padding="none"
      interactive={href ? "press" : false}
      className={cn("h-full p-2 pb-3", className)}
      dataAttrs={href ? undefined : { "data-testid": "player-card" }}
    >
      {inner}
    </TapedCard>
  );

  if (href) {
    return (
      <Link
        href={href}
        data-testid="player-card"
        aria-label={
          hasPosition
            ? `${firstName} ${lastName} — ${position}`
            : `${firstName} ${lastName}`
        }
        className="block h-full"
      >
        {card}
      </Link>
    );
  }

  return card;
}
