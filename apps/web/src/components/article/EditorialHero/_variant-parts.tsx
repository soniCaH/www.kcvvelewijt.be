/**
 * Co-located sub-components for the per-variant hero artefacts shipped
 * in #1749 (R1.5). Each part is tiny + tightly coupled to the
 * `<EditorialHero>` variant rendering, so they live next to the hero
 * rather than ballooning the design-system surface.
 *
 * Pieces:
 * - `<HeroCreditChip>` — 16 px subject thumbnail + name pill for the
 *   Interview credit row below the H1.
 * - `<HeroDayBlockOverlay>` — mono day stamp pinned to the lower-left
 *   of the Event cover photo (signature visual hook from R1.5b).
 * - `<HeroCompressedEventStrip>` — single-row strip below the Event
 *   hero card: `▸ ${location} · ${date} · ${start}–${end}`.
 * - `<HeroTransferDirChip>` — jersey-filled inline chip with arrow
 *   glyph + Dutch label (`↓ Inkomend` / `↑ Uitgaand` / `↻ Verlengd`).
 * - `<HeroTransferMetaLine>` — graceful-omit meta line below the
 *   Transfer H1 (`${age} jaar · ${position} · van ${otherClubName}`).
 *
 * Source-of-record: docs/design/mockups/phase-4-homepage/hero-flourishes-locked.md (R1.5).
 */
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { ResolvedSubject } from "@/components/article/SubjectAttribution";
import type {
  ResolvedTransfer,
  TransferFactValue,
} from "@/components/article/blocks/TransferFact/types";

// ─── Interview ───────────────────────────────────────────────────────────────

export interface HeroCreditChipProps {
  subject: ResolvedSubject;
}

/**
 * One credit chip per interviewee. 16 px square thumbnail (psdImage /
 * transparentImage when available, coloured initial-block fallback
 * otherwise) + the subject's display name. Reads as a byline-ish row
 * rather than a feature list.
 */
export function HeroCreditChip({ subject }: HeroCreditChipProps) {
  const initial = subject.name.trim().charAt(0).toUpperCase() || "?";
  // PR-review iteration (#1749): the original pill-with-border framing
  // produced visible radius mismatches between the avatar circle and
  // the pill cap. Dropping the chrome entirely sidesteps the problem
  // — `[avatar] Name` reads as a byline-ish row that doesn't compete
  // with the H1 above.
  return (
    <span
      className="inline-flex items-center gap-2"
      data-testid="hero-credit-chip"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full",
          "bg-jersey-deep text-cream text-xs font-semibold",
        )}
      >
        {subject.photoUrl ? (
          <Image
            src={subject.photoUrl}
            alt=""
            fill
            sizes="28px"
            className="object-cover"
          />
        ) : (
          initial
        )}
      </span>
      <span className="text-ink text-body-md font-display italic">
        {subject.name}
      </span>
    </span>
  );
}

// ─── Event ───────────────────────────────────────────────────────────────────

export interface HeroDayBlockOverlayProps {
  /** Day-of-week abbreviation, e.g. `ZA` (Dutch). */
  weekday: string;
  /** Day + short-month, e.g. `27/4` or `27 apr`. */
  date: string;
}

/**
 * Day-block overlay pinned to the lower-left of the Event cover photo.
 * Cream paper-stamp on cream-soft, ink ring, rotated -2°. Signature
 * visual hook locked at R1.5b — keeps the Event variant identifiable
 * without competing with the H1 typography.
 */
export function HeroDayBlockOverlay({
  weekday,
  date,
}: HeroDayBlockOverlayProps) {
  return (
    <div
      data-testid="hero-day-block"
      aria-hidden="true"
      className={cn(
        "absolute bottom-3 left-3 z-10 inline-flex flex-col items-center justify-center",
        "border-ink shadow-paper-sm bg-cream text-ink min-w-[3.5rem] border-2 px-2 py-1.5",
        "-rotate-2 transform font-mono leading-tight uppercase",
      )}
    >
      <span className="text-[10px] tracking-[0.1em] opacity-70">{weekday}</span>
      <span className="text-base font-semibold">{date}</span>
    </div>
  );
}

export interface HeroCompressedEventStripProps {
  location?: string | null;
  /** Pre-formatted Dutch date, e.g. `Zaterdag 15 juni` or `15 juni`. */
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Compressed event strip rendered below the hero card (inside the
 * click target, per the lock). Single mono-uppercase row with 1 px
 * ink rules top + bottom: `▸ ${location} · ${date} · ${start}–${end}`.
 * Each segment is graceful-omit so a partial event still reads.
 */
export function HeroCompressedEventStrip({
  location,
  date,
  startTime,
  endTime,
}: HeroCompressedEventStripProps) {
  const timeRange =
    startTime && endTime
      ? `${startTime}–${endTime}`
      : (startTime ?? endTime ?? null);

  const segments = [location, date, timeRange].filter(
    (segment): segment is string =>
      typeof segment === "string" && segment.length > 0,
  );

  if (segments.length === 0) return null;

  return (
    <div
      data-testid="hero-compressed-event-strip"
      // `border-y` so the strip owns both its top and bottom edges. The
      // shell no longer paints a bottom rule (#1866 fix-1) so the strip
      // can no longer borrow it as a top edge.
      className={cn(
        "border-ink flex items-center gap-2 border-y py-2",
        "text-mono-sm text-ink font-mono tracking-[0.06em] uppercase",
      )}
    >
      <span aria-hidden="true" className="text-jersey-deep">
        ▸
      </span>
      {segments.map((segment, idx) => (
        <span
          key={segment}
          className="flex items-center gap-2"
          data-segment-index={idx}
        >
          {idx > 0 ? (
            <span aria-hidden="true" className="text-ink-muted">
              ·
            </span>
          ) : null}
          {segment}
        </span>
      ))}
    </div>
  );
}

// ─── Transfer ────────────────────────────────────────────────────────────────

/**
 * Club row rendered below the Transfer H1: `[Other logo] OtherClub →
 * [KCVV logo] KCVV` for incoming, reversed for outgoing, single
 * `[KCVV] · Verlengd tot ${until}` row for extension. The visual
 * direction (left-to-right arrow) carries the functional intent the
 * earlier dirChip handled, with much higher information density —
 * readers see the clubs immediately, not just an abstract label.
 */
export interface HeroTransferClubRowProps {
  resolved: ResolvedTransfer;
}

function ClubBadge({
  logoUrl,
  name,
  isKcvv,
}: {
  logoUrl: string | null;
  name: string;
  isKcvv: boolean;
}) {
  return (
    <span
      data-testid="hero-transfer-club-badge"
      data-club={isKcvv ? "kcvv" : "other"}
      className="inline-flex items-center gap-2"
    >
      <span
        aria-hidden="true"
        className={cn(
          "border-paper-edge bg-cream relative inline-flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border",
        )}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            fill
            sizes="28px"
            className="object-contain p-0.5"
          />
        ) : (
          <span className="text-ink-muted font-mono text-[10px] font-bold uppercase">
            {name.charAt(0) || "?"}
          </span>
        )}
      </span>
      <span className="text-ink font-display text-body-md font-semibold italic">
        {name}
      </span>
    </span>
  );
}

export function HeroTransferClubRow({ resolved }: HeroTransferClubRowProps) {
  if (resolved.kind === "extension") {
    return (
      <div
        data-testid="hero-transfer-club-row"
        data-direction="extension"
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        <ClubBadge
          logoUrl={resolved.kcvvOnly.logoUrl}
          name={resolved.kcvvOnly.name}
          isKcvv={resolved.kcvvOnly.isKcvv}
        />
        {resolved.until ? (
          <span className="text-ink-soft text-body-md italic">
            · verlengd tot {resolved.until}
          </span>
        ) : null}
      </div>
    );
  }

  // Pair (incoming / outgoing) — left side is the source, right side
  // is the destination. Arrow glyph between them makes the direction
  // explicit without an abstract chip.
  return (
    <div
      data-testid="hero-transfer-club-row"
      data-direction={resolved.direction}
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      <ClubBadge
        logoUrl={resolved.from.logoUrl}
        name={resolved.from.name}
        isKcvv={resolved.from.isKcvv}
      />
      <span aria-hidden="true" className="text-jersey-deep text-lg font-bold">
        →
      </span>
      <ClubBadge
        logoUrl={resolved.to.logoUrl}
        name={resolved.to.name}
        isKcvv={resolved.to.isKcvv}
      />
    </div>
  );
}

export interface HeroTransferMetaLineProps {
  feature: TransferFactValue;
  resolved: ResolvedTransfer;
}

/**
 * Compact meta line below the Transfer H1: `${age} jaar · ${position}`.
 * The club tail (`van …` / `naar …` / `verlengd tot …`) used to live
 * here but was retired at PR review when the `<HeroTransferClubRow>`
 * with logos + direction arrow took over the club-direction signal.
 * Keeping the tail would duplicate the row's content.
 *
 * `resolved` is kept in the signature so future evolution can branch
 * on direction without churning callers; today only `feature` drives
 * the rendered segments.
 */
export function HeroTransferMetaLine({ feature }: HeroTransferMetaLineProps) {
  const segments: string[] = [];

  if (typeof feature.age === "number") segments.push(`${feature.age} jaar`);
  if (feature.position?.trim()) segments.push(feature.position.trim());

  if (segments.length === 0) return null;

  return (
    <p
      data-testid="hero-transfer-meta-line"
      className="text-ink-soft text-body-md mt-3"
    >
      {segments.map((segment, idx) => (
        <span key={`${idx}-${segment}`}>
          {idx > 0 ? (
            <span aria-hidden="true" className="text-ink-muted mx-2">
              ·
            </span>
          ) : null}
          {segment}
        </span>
      ))}
    </p>
  );
}

// ─── Interview kicker meta (ported from InterviewHero) ──────────────────────

/**
 * Post-#1358 InterviewHero kicker rule, ported for `<EditorialHero
 * variant="interview">`. Meta slot is populated only when N=1 and the
 * sole subject is a player; all other cases render bare kicker. Returns
 * the meta segments as an array so the caller can splice them into the
 * EditorialKicker `items` prop.
 */
export function buildInterviewKickerMeta(
  count: number,
  soleSubject: ResolvedSubject | undefined,
): string[] {
  if (count !== 1 || !soleSubject) return [];
  const meta: string[] = [];
  if (soleSubject.jerseyNumber != null) {
    meta.push(`#${soleSubject.jerseyNumber}`);
  }
  if (soleSubject.position) meta.push(soleSubject.position.toUpperCase());
  return meta;
}
