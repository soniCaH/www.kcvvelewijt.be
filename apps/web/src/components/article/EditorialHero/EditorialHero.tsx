/**
 * <EditorialHero> — Phase 3 article hero shell + discriminated union.
 *
 * This issue (#1637) ships **only the shell**. The discriminated union
 * over `variant: "announcement" | "transfer" | "event" | "interview"`
 * stages the type surface that #1638 fills in with per-variant artefacts
 * (announcement cover image, transfer/event factStrips, interview
 * SubjectsStrip + Q&A divider + EndMark). Today every variant renders
 * the same shell content — kicker + headline + lead + byline + optional
 * cover artefact. `placement="homepage"` does not yet wrap the hero in
 * a link (also #1638).
 *
 * The union is intentionally extensible: when #1470 adds the
 * `matchPreview` and `matchRecap` article types, two more variant
 * branches drop in without touching consumers.
 *
 * Spec: PRD redesign-phase-3 §5.B.1.
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
  type EditorialKickerProps,
} from "@/components/design-system";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { serializeTitle } from "@/lib/utils/serialize-title";

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
  /** Editorial chrome row (article type, date, read time, etc.). */
  kicker?: EditorialKickerProps["items"];
  /** Author display name (e.g. "Tom Janssens"). Falls back to "redactie". */
  author?: string;
  /** Cover image artefact rendered in the right column (40fr). */
  coverImage?: EditorialHeroCoverImage;
}

// Discriminated union over `placement`: `"homepage"` requires a `slug`
// (the link target /nieuws/{slug}); `"detail"` (default) doesn't.
// TypeScript enforces this at every call site without a runtime check.
interface DetailPlacementProps extends EditorialHeroSharedProps {
  placement?: "detail";
  slug?: never;
}

interface HomepagePlacementProps extends EditorialHeroSharedProps {
  placement: "homepage";
  /** Required for homepage placement — builds the link target. */
  slug: string;
}

type EditorialHeroPlacementProps =
  | DetailPlacementProps
  | HomepagePlacementProps;

type AnnouncementProps = EditorialHeroPlacementProps & {
  variant: "announcement";
};
type TransferProps = EditorialHeroPlacementProps & { variant: "transfer" };
type EventProps = EditorialHeroPlacementProps & { variant: "event" };
type InterviewProps = EditorialHeroPlacementProps & { variant: "interview" };

export type EditorialHeroProps =
  | AnnouncementProps
  | TransferProps
  | EventProps
  | InterviewProps;

function EditorialHeroCover({
  coverImage,
}: {
  coverImage: EditorialHeroCoverImage;
}) {
  return (
    <TapedFigure
      aspect="landscape-16-9"
      rotation="b"
      tape={[{ color: "jersey", length: "md" }]}
      className="max-w-[440px]"
    >
      <Image
        src={coverImage.url}
        alt={coverImage.alt}
        fill
        sizes="(min-width: 1024px) 440px, 100vw"
        className="object-cover"
      />
    </TapedFigure>
  );
}

export function EditorialHero(props: EditorialHeroProps) {
  const { title, lead, kicker, author, coverImage, placement, slug } = props;
  const editorial = (
    <>
      {kicker !== undefined && kicker.length > 0 ? (
        <EditorialKicker items={kicker} />
      ) : null}
      <EditorialHeading level={1} size="display-xl">
        {title}
      </EditorialHeading>
      {lead !== undefined && lead.trim() !== "" ? (
        <EditorialLead>{lead}</EditorialLead>
      ) : null}
      <EditorialByline author={author} />
    </>
  );
  const shell = (
    <EditorialHeroShell
      editorial={editorial}
      cover={
        coverImage !== undefined ? (
          <EditorialHeroCover coverImage={coverImage} />
        ) : undefined
      }
    />
  );

  if (placement === "homepage") {
    // `slug` is enforced by the discriminated union — TypeScript
    // guarantees it's a non-empty string here. No runtime guard needed.
    // Press-up hover: inverse of the canonical press-down on paper-stamped
    // primitives. Body content (factStrips, Q&A, EndMark) does not render in
    // homepage placement — the call site is responsible for that gate.
    return (
      <Link
        href={`/nieuws/${slug}`}
        className="group relative block pb-8 transition-all duration-300 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:[--editorial-hover-shadow:8px_8px_0_0_var(--color-ink)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
        aria-label={serializeTitle(title)}
      >
        {shell}
        <span
          aria-hidden="true"
          className="text-jersey-deep pointer-events-none absolute right-2 bottom-1 font-mono text-xs leading-none font-bold uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          ★ Lees verder →
        </span>
      </Link>
    );
  }
  return shell;
}
