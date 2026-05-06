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
import {
  EditorialByline,
  EditorialHeroShell,
  EditorialKicker,
  EditorialLead,
  type EditorialKickerProps,
} from "@/components/design-system";
import { TapedFigure } from "@/components/design-system/TapedFigure";

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

interface EditorialHeroBaseProps {
  /** Article title rendered as the H1. */
  title: string;
  /** Editor-supplied lead, or a body-derived fallback truncated via `truncateLead`. */
  lead?: string;
  /** Editorial chrome row (article type, date, read time, etc.). */
  kicker?: EditorialKickerProps["items"];
  /** Author display name (e.g. "Tom Janssens"). Falls back to "redactie". */
  author?: string;
  /** Cover image artefact rendered in the right column (40fr). */
  coverImage?: EditorialHeroCoverImage;
  /** `"detail"` (default) or `"homepage"`. Variant rendering for `"homepage"` lands in #1638. */
  placement?: EditorialHeroPlacement;
}

interface AnnouncementProps extends EditorialHeroBaseProps {
  variant: "announcement";
}

interface TransferProps extends EditorialHeroBaseProps {
  variant: "transfer";
}

interface EventProps extends EditorialHeroBaseProps {
  variant: "event";
}

interface InterviewProps extends EditorialHeroBaseProps {
  variant: "interview";
}

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
  const { title, lead, kicker, author, coverImage } = props;
  const editorial = (
    <>
      {kicker !== undefined && kicker.length > 0 ? (
        <EditorialKicker items={kicker} />
      ) : null}
      <h1 className="text-ink font-serif text-4xl leading-[0.95] font-black italic md:text-5xl lg:text-6xl">
        {title}
      </h1>
      {lead !== undefined && lead.trim() !== "" ? (
        <EditorialLead>{lead}</EditorialLead>
      ) : null}
      <EditorialByline author={author} />
    </>
  );
  return (
    <EditorialHeroShell
      editorial={editorial}
      cover={
        coverImage !== undefined ? (
          <EditorialHeroCover coverImage={coverImage} />
        ) : undefined
      }
    />
  );
}
