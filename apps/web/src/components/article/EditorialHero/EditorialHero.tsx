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
import {
  HeroCompressedEventStrip,
  HeroCreditChip,
  HeroDayBlockOverlay,
  HeroTransferClubRow,
  HeroTransferMetaLine,
  buildInterviewKickerMeta,
} from "./_variant-parts";

export type EditorialHeroVariant =
  | "announcement"
  | "transfer"
  | "event"
  | "interview";

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

export type EditorialHeroProps =
  | AnnouncementProps
  | InterviewProps
  | EventProps
  | TransferProps;

// ─── Cover ───────────────────────────────────────────────────────────────────

interface EditorialHeroCoverProps {
  coverImage: EditorialHeroCoverImage;
  aspect: "landscape-16-9" | "landscape-3-2";
  /** Optional overlay node anchored inside the figure (e.g. the
   *  Event day-block stamp). `position: relative` is already set on
   *  the inner figure container; consumers position themselves. */
  overlay?: React.ReactNode;
}

function EditorialHeroCover({
  coverImage,
  aspect,
  overlay,
}: EditorialHeroCoverProps) {
  return (
    <TapedFigure
      aspect={aspect}
      rotation="b"
      tape={{ color: "jersey", length: "md" }}
      className="relative max-w-[440px]"
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
    belowHero = (
      <HeroCompressedEventStrip
        location={props.feature?.location ?? null}
        date={date ?? null}
        startTime={props.feature?.startTime ?? null}
        endTime={props.feature?.endTime ?? null}
      />
    );
  } else {
    // Transfer
    coverAspect = "landscape-3-2";
    editorial = renderTransferEditorial(
      title,
      lead,
      author,
      props.feature,
      date,
    );
  }

  const shell = (
    <EditorialHeroShell
      editorial={editorial}
      cover={
        coverImage !== undefined ? (
          <EditorialHeroCover
            coverImage={coverImage}
            aspect={coverAspect}
            overlay={coverOverlay}
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
    return (
      <Link
        href={`/nieuws/${slug}`}
        className="group relative block pb-8 transition-all duration-300 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:[--editorial-hover-shadow:8px_8px_0_0_var(--color-ink)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
        aria-label={serializeTitle(title)}
      >
        {body}
        <span
          aria-hidden="true"
          className="text-jersey-deep pointer-events-none absolute right-2 bottom-1 font-mono text-xs leading-none font-bold uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          ★ Lees verder →
        </span>
      </Link>
    );
  }
  return body;
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
