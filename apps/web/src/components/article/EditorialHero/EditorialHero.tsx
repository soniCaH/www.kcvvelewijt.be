/**
 * <EditorialHero> — Phase 3 article hero shell + per-articleType
 * variant rendering. R1.5 (#1749) fills in the variant-specific
 * artefacts that the shell staged at Phase 3 (#1637, #1638). Every
 * variant now contributes:
 *
 * - Variant-specific kicker construction (e.g. transfer dirChip,
 *   interview jerseyNumber/position, event ageGroup/competitionTag).
 * - Variant-specific below-H1 element (credit chips for interview,
 *   transfer meta line for transfer).
 * - Variant-specific cover overlay (day-block for event).
 * - Variant-specific below-hero strip (compressed event strip for
 *   event, inside the click target on `placement="homepage"`).
 *
 * The union is extensible: when #1470 ships the `matchPreview` and
 * `matchRecap` article types, two more variant branches drop in
 * here without touching the shell.
 *
 * Spec: docs/design/mockups/phase-4-homepage/hero-flourishes-locked.md
 * (R1.5). Image constraint: landscape only (audit §I1).
 */
import Image from "next/image";
import Link from "next/link";
import type { PortableTextBlock } from "@portabletext/react";
import {
  EditorialByline,
  EditorialHeading,
  EditorialHeroShell,
  EditorialKicker,
  EditorialLead,
  type MonoLabelRowItem,
} from "@/components/design-system";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import {
  resolveSubject,
  type IndexedSubject,
  type ResolvedSubject,
} from "@/components/article/SubjectAttribution";
import {
  resolveTransfer,
  type TransferFactValue,
} from "@/components/article/blocks/TransferFact/types";
import type { EventFactValue } from "@/components/article/blocks/EventFact/types";
import { serializeTitle } from "@/lib/utils/serialize-title";
import { formatArticleDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import {
  HeroCompressedEventStrip,
  HeroCreditChip,
  HeroDayBlockOverlay,
  HeroMatchScoreBar,
  HeroTransferClubRow,
  HeroTransferMetaLine,
  buildInterviewKickerMeta,
  type HeroMatchData,
} from "./_variant-parts";

export type { HeroMatchData } from "./_variant-parts";

export type EditorialHeroVariant =
  | "announcement"
  | "transfer"
  | "event"
  | "interview"
  | "matchPreview"
  | "matchRecap";

export type EditorialHeroPlacement = "detail" | "homepage";

export interface EditorialHeroCoverImage {
  url: string;
  alt: string;
}

// ─── Shared editorial slot props ────────────────────────────────────────────

interface EditorialHeroSharedProps {
  /**
   * Article title rendered as the H1. Plain string (legacy) OR a
   * single-block constrained Portable Text array with the `accent`
   * decorator (post Ask 9). PT spans tagged `accent` render italic +
   * jersey-deep via <EditorialHeading>.
   */
  title: string | PortableTextBlock[];
  /** Editor-supplied lead, or a body-derived fallback truncated via `truncateLead`. */
  lead?: string;
  /** Author display name (e.g. "Tom Janssens"). Falls back to "redactie". */
  author?: string;
  /** Cover image artefact rendered in the right column (40fr). */
  coverImage?: EditorialHeroCoverImage;
  /**
   * Optional pre-formatted Dutch date string appended to the kicker
   * (e.g. `"15 mei 2026"`). Per variant the kicker reads:
   * - announcement → `Aankondiging · ${category} · ${date}`
   * - interview    → `Interview` (+ optional jersey/position) `· ${date}`
   * - event        → `Event | ${ageGroup||competitionTag} · ${date}`
   * - transfer     → `Transfer | <dirChip> · ${date}`
   */
  date?: string;
}

// `placement` discriminated union — homepage requires `slug` for the
// link target, detail (default) does not.
interface DetailPlacementProps {
  placement?: "detail";
  slug?: never;
}

interface HomepagePlacementProps {
  placement: "homepage";
  /** Required for homepage placement — builds the link target. */
  slug: string;
  /**
   * Hover treatment on the wrapping link.
   *
   * - `"press"` (default) — paper-stamp press-down: translate by 2px +
   *   shadow shift on the whole hero. Used by the (retired)
   *   `<HomepageHeroCarousel>` where each slide is a small card; the
   *   press registers without feeling oversized.
   * - `"tilt-photo"` — keep the link affordance + the "★ Lees verder →"
   *   reveal at the bottom-right, but skip the whole-block translate.
   *   Instead, the cover `<TapedFigure>` tilts a fraction of a degree
   *   and scales up by ~2% — the framed photo gets "noticed" without
   *   the giant editorial column twitching. Used by the Phase 4.5.C.1
   *   static homepage hero (#1754).
   */
  hoverStyle?: "press" | "tilt-photo";
}

type PlacementProps = DetailPlacementProps | HomepagePlacementProps;

// ─── Per-variant data props ────────────────────────────────────────────────

type AnnouncementProps = EditorialHeroSharedProps &
  PlacementProps & {
    variant: "announcement";
    /** Single category label (e.g. `article.tags[0]`). Falls into the
     *  kicker as `Aankondiging · ${category} · ${date}`. */
    category?: string;
  };

type InterviewProps = EditorialHeroSharedProps &
  PlacementProps & {
    variant: "interview";
    /** Article-level subjects (1..4). The Interview hero renders a
     *  credit-chip row below the H1 (one chip per subject) and pulls
     *  optional `#jersey · POSITION` kicker meta when N=1 and the
     *  sole subject is a player. */
    subjects?: IndexedSubject[] | null;
  };

type EventProps = EditorialHeroSharedProps &
  PlacementProps & {
    variant: "event";
    /** First eventFact in the article body. Drives the kicker
     *  ageGroup/competitionTag, the day-block overlay weekday/date,
     *  and the compressed event strip below the hero. */
    feature?: EventFactValue | null;
  };

type TransferProps = EditorialHeroSharedProps &
  PlacementProps & {
    variant: "transfer";
    /** First transferFact in the article body. Drives the dirChip in
     *  the kicker, the H1 (playerName takes precedence over `title`),
     *  and the meta line below the H1. */
    feature?: TransferFactValue | null;
  };

// matchPreview / matchRecap share one shape — the score-forward H3 hero
// (5.d-mat lock). When `match` data is supplied (detail page, fed by the
// article's `linkedMatch` PSD id), the cover gains a `crest · score · crest`
// score bar straddling its lower edge and the kicker carries the competition
// + match date. When `match` is null/absent (homepage hero, or a 404'd match
// on the detail page) the hero degrades gracefully to the kicker-only shell.
type MatchProps = EditorialHeroSharedProps &
  PlacementProps & {
    variant: "matchPreview" | "matchRecap";
    /** PSD match facts for the score bar + kicker. Null → no bar (graceful). */
    match?: HeroMatchData | null;
  };

export type EditorialHeroProps =
  | AnnouncementProps
  | InterviewProps
  | EventProps
  | TransferProps
  | MatchProps;

// ─── Cover ───────────────────────────────────────────────────────────────────

interface EditorialHeroCoverProps {
  coverImage: EditorialHeroCoverImage;
  aspect: "landscape-16-9" | "landscape-3-2";
  /** Optional overlay node anchored inside the figure (e.g. the Event
   *  day-block stamp, or the match score bar in the cover's lower third).
   *  `position: relative` is already set on the inner figure container;
   *  consumers position themselves. */
  overlay?: React.ReactNode;
  /** When `true`, the figure adds a `group-hover` rotate + scale so
   *  the framed photo tilts on hover. Only used by the homepage
   *  placement when `hoverStyle === "tilt-photo"`. The wrapping
   *  `<Link>` already carries the `group` class. */
  tiltOnHover?: boolean;
}

function EditorialHeroCover({
  coverImage,
  aspect,
  overlay,
  tiltOnHover,
}: EditorialHeroCoverProps) {
  return (
    <TapedFigure
      aspect={aspect}
      rotation="b"
      tape={{ color: "jersey", length: "md" }}
      className={cn(
        "relative max-w-[440px]",
        tiltOnHover &&
          "transition-transform duration-300 group-hover:scale-[1.02] group-hover:-rotate-1 group-focus-visible:scale-[1.02] group-focus-visible:-rotate-1 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 motion-reduce:group-focus-visible:scale-100 motion-reduce:group-focus-visible:rotate-0",
      )}
    >
      <Image
        src={coverImage.url}
        alt={coverImage.alt}
        fill
        sizes="(min-width: 1024px) 440px, 100vw"
        className="object-cover"
      />
      {overlay}
    </TapedFigure>
  );
}

// ─── Kicker helpers ──────────────────────────────────────────────────────────

/**
 * Build the plain-label items for `<EditorialKicker>`. The transfer
 * variant has a JSX dirChip that the EditorialKicker plain-items API
 * can't carry — that variant renders its kicker manually instead
 * (see `renderTransferKicker`).
 */
function buildPlainKickerItems(
  type: string,
  meta: string[],
  date: string | undefined,
): MonoLabelRowItem[] {
  const items: MonoLabelRowItem[] = [{ label: type }];
  for (const segment of meta) items.push({ label: segment });
  if (date) items.push({ label: date });
  return items;
}

// ─── Variant editorial renderers ────────────────────────────────────────────

function renderAnnouncementEditorial(
  title: EditorialHeroSharedProps["title"],
  lead: string | undefined,
  author: string | undefined,
  category: string | undefined,
  date: string | undefined,
) {
  const meta = category?.trim() ? [category.trim()] : [];
  const items = buildPlainKickerItems("Aankondiging", meta, date);
  return (
    <>
      <EditorialKicker items={items} />
      <EditorialHeading level={1} size="display-xl">
        {title}
      </EditorialHeading>
      {lead && lead.trim() ? <EditorialLead>{lead}</EditorialLead> : null}
      <EditorialByline author={author} />
    </>
  );
}

function renderInterviewEditorial(
  title: EditorialHeroSharedProps["title"],
  lead: string | undefined,
  author: string | undefined,
  subjects: IndexedSubject[] | null | undefined,
  date: string | undefined,
) {
  const resolvedSubjects = (subjects ?? [])
    .map((s) => resolveSubject(s))
    .filter((r): r is ResolvedSubject => r !== null);
  const meta = buildInterviewKickerMeta(
    resolvedSubjects.length,
    resolvedSubjects[0],
  );
  const items = buildPlainKickerItems("Interview", meta, date);
  return (
    <>
      <EditorialKicker items={items} />
      <EditorialHeading level={1} size="display-xl">
        {title}
      </EditorialHeading>
      {resolvedSubjects.length > 0 ? (
        <div
          data-testid="hero-credit-chip-row"
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {resolvedSubjects.map((subject, idx) => (
            <HeroCreditChip key={`${idx}-${subject.name}`} subject={subject} />
          ))}
        </div>
      ) : null}
      {lead && lead.trim() ? <EditorialLead>{lead}</EditorialLead> : null}
      <EditorialByline author={author} />
    </>
  );
}

function renderEventEditorial(
  title: EditorialHeroSharedProps["title"],
  lead: string | undefined,
  author: string | undefined,
  feature: EventFactValue | null | undefined,
  date: string | undefined,
) {
  // ageGroup wins, else competitionTag — the kicker secondary slot.
  const kickerMeta =
    feature?.ageGroup?.trim() || feature?.competitionTag?.trim();
  const meta = kickerMeta ? [kickerMeta] : [];
  const items = buildPlainKickerItems("Event", meta, date);
  return (
    <>
      <EditorialKicker items={items} />
      <EditorialHeading level={1} size="display-xl">
        {title}
      </EditorialHeading>
      {lead && lead.trim() ? <EditorialLead>{lead}</EditorialLead> : null}
      <EditorialByline author={author} />
    </>
  );
}

function renderTransferEditorial(
  fallbackTitle: EditorialHeroSharedProps["title"],
  lead: string | undefined,
  author: string | undefined,
  feature: TransferFactValue | null | undefined,
  date: string | undefined,
) {
  const resolved = feature ? resolveTransfer(feature) : null;

  // R1.5 PR-review revision (#1749): the dirChip + meta line were
  // replaced with a richer club row showing the two clubs' logos +
  // names with a direction arrow between them. The visual layout
  // carries the direction signal that the abstract chip used to
  // encode, plus immediately surfaces the destination/origin club.
  // The kicker collapses to `Transfer · ${date}`.
  const kickerItems = buildPlainKickerItems("Transfer", [], date);

  // The transfer H1 prefers the structured `playerName` over the
  // article title (the article title is usually descriptive prose;
  // the player name is the headline).
  const h1: EditorialHeroSharedProps["title"] =
    feature?.playerName?.trim() ?? fallbackTitle;

  return (
    <>
      <EditorialKicker items={kickerItems} />
      <EditorialHeading level={1} size="display-xl">
        {h1}
      </EditorialHeading>
      {resolved ? <HeroTransferClubRow resolved={resolved} /> : null}
      {feature && resolved ? (
        <HeroTransferMetaLine feature={feature} resolved={resolved} />
      ) : null}
      {lead && lead.trim() ? <EditorialLead>{lead}</EditorialLead> : null}
      <EditorialByline author={author} />
    </>
  );
}

function renderMatchEditorial(
  title: EditorialHeroSharedProps["title"],
  lead: string | undefined,
  author: string | undefined,
  variant: "matchPreview" | "matchRecap",
  date: string | undefined,
) {
  // Kicker mirrors the match-page status vocabulary (<MatchHero>): preview →
  // VOORBESCHOUWING, recap → MATCHVERSLAG. When the cover score bar is present
  // it carries the competition + match date (so `date` is passed undefined);
  // when the match 404s the bar is gone, so the kicker keeps the article date.
  const label = variant === "matchPreview" ? "Voorbeschouwing" : "Matchverslag";
  const items = buildPlainKickerItems(label, [], date);
  return (
    <>
      <EditorialKicker items={items} />
      <EditorialHeading level={1} size="display-xl">
        {title}
      </EditorialHeading>
      {lead && lead.trim() ? <EditorialLead>{lead}</EditorialLead> : null}
      <EditorialByline author={author} />
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditorialHero(props: EditorialHeroProps) {
  const { title, lead, author, coverImage, placement, slug, date } = props;

  // Variant-specific editorial slot, cover aspect, cover overlay, and
  // below-hero strip. All branches share the placement + link wrapper
  // logic below.
  let editorial: React.ReactNode;
  let coverAspect: "landscape-16-9" | "landscape-3-2" = "landscape-16-9";
  let coverOverlay: React.ReactNode = null;
  let belowHero: React.ReactNode = null;
  // Match hero stacks the cover above the editorial on mobile so the score
  // bar is read first (5.d-mat lock). Other variants keep editorial-first.
  let coverFirstOnMobile = false;

  if (props.variant === "announcement") {
    editorial = renderAnnouncementEditorial(
      title,
      lead,
      author,
      props.category,
      date,
    );
  } else if (props.variant === "interview") {
    coverAspect = "landscape-3-2";
    editorial = renderInterviewEditorial(
      title,
      lead,
      author,
      props.subjects,
      date,
    );
  } else if (props.variant === "event") {
    editorial = renderEventEditorial(title, lead, author, props.feature, date);
    // Day-block overlay — derived from feature.date when present.
    if (props.feature?.date) {
      const dayBlock = deriveEventDayBlock(props.feature.date);
      if (dayBlock) {
        coverOverlay = (
          <HeroDayBlockOverlay
            weekday={dayBlock.weekday}
            date={dayBlock.date}
          />
        );
      }
    }
    // The compressed strip's date comes from the event's own
    // `feature.date` (the day the event happens), NOT from the
    // article's publishedAt. Format the ISO date into Dutch when
    // present; fall back to the article-level `date` only when no
    // structured event date is set (rare partial-content case).
    const eventStripDate = props.feature?.date
      ? formatArticleDate(props.feature.date)
      : (date ?? null);
    belowHero = (
      <HeroCompressedEventStrip
        location={props.feature?.location ?? null}
        date={eventStripDate}
        startTime={props.feature?.startTime ?? null}
        endTime={props.feature?.endTime ?? null}
      />
    );
  } else if (props.variant === "transfer") {
    coverAspect = "landscape-3-2";
    editorial = renderTransferEditorial(
      title,
      lead,
      author,
      props.feature,
      date,
    );
  } else {
    // matchPreview | matchRecap — score-forward hero. The two-tier score bar
    // sits in the cover's lower third (5.d-mat-refine D@P3) and carries the
    // competition + match date, so the kicker stays a clean type label and
    // only falls back to the article date when the bar is absent (404).
    const match = props.match;
    const kickerDate = match ? undefined : date;
    editorial = renderMatchEditorial(
      title,
      lead,
      author,
      props.variant,
      kickerDate,
    );
    if (match) {
      coverFirstOnMobile = true;
      coverOverlay = (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
          <HeroMatchScoreBar variant={props.variant} {...match} />
        </div>
      );
    }
  }

  const tiltOnHover =
    placement === "homepage" && (props.hoverStyle ?? "press") === "tilt-photo";

  const shell = (
    <EditorialHeroShell
      editorial={editorial}
      coverFirstOnMobile={coverFirstOnMobile}
      cover={
        coverImage !== undefined ? (
          <EditorialHeroCover
            coverImage={coverImage}
            aspect={coverAspect}
            overlay={coverOverlay}
            tiltOnHover={tiltOnHover}
          />
        ) : undefined
      }
    />
  );

  const body = (
    <>
      {shell}
      {belowHero}
    </>
  );

  if (placement === "homepage") {
    // `slug` is enforced by the discriminated union — TypeScript
    // guarantees it's a non-empty string here. No runtime guard needed.
    // Below-hero strips (Event) render inside the click target so the
    // whole composition reads as one tappable card.
    const hoverStyle = props.hoverStyle ?? "press";
    const pressClasses =
      "transition-all duration-300 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:[--editorial-hover-shadow:8px_8px_0_0_var(--color-ink)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0";
    // The tilt-photo treatment moves only the cover figure (handled
    // inside `<EditorialHeroCover tiltOnHover />`); the outer Link stays
    // still apart from the bottom-right "Lees verder" reveal.
    const tiltPhotoClasses = "transition-colors duration-300";
    return (
      <Link
        href={`/nieuws/${slug}`}
        className={`group block ${hoverStyle === "press" ? pressClasses : tiltPhotoClasses}`}
        aria-label={serializeTitle(title)}
      >
        {body}
        {/* The shell renders an `mx-auto max-w-[var(--container-wide)]` <section> with
            a bottom divider line; pin "Lees verder" inside the same inner
            container so it aligns flush with the divider's right edge
            rather than the outer link's wrapper-padded edge. */}
        <div className="mx-auto mt-2 flex max-w-[var(--container-wide)] justify-end px-4 md:px-8">
          <span
            aria-hidden="true"
            className="text-jersey-deep pointer-events-none font-mono text-xs leading-none font-bold uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            ★ Lees verder →
          </span>
        </div>
      </Link>
    );
  }
  // Detail placement — wrap in a marker span so the e2e fixture-discovery
  // helper at `apps/web/test/e2e/helpers/fixtures.ts` can detect the
  // articleType of a live article page. Inherits the legacy
  // `data-testid="<type>-hero"` contract from the (now-superseded) per-
  // variant Hero components so the discovery probe keeps working without
  // touching the helper.
  return (
    <div data-testid={`${props.variant}-hero`} className="contents">
      {body}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DUTCH_WEEKDAY_SHORT = ["ZO", "MA", "DI", "WO", "DO", "VR", "ZA"] as const;

/**
 * Pull weekday + `D/M` from a Sanity `date` string (`YYYY-MM-DD`).
 * Returns null on unparseable input so the overlay simply doesn't
 * render — better than a placeholder stamp that misleads.
 */
function deriveEventDayBlock(
  isoDate: string,
): { weekday: string; date: string } | null {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const weekday = DUTCH_WEEKDAY_SHORT[parsed.getDay()] ?? "";
  return {
    weekday,
    date: `${parsed.getDate()}/${parsed.getMonth() + 1}`,
  };
}
