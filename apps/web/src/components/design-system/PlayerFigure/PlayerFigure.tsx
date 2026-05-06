/**
 * <PlayerFigure> — Tier C primitive (Phase 3).
 *
 * Two mutually-exclusive states picked at runtime by `photoUrl`:
 *
 * - **Photo** (`photoUrl` present) — polaroid `<TapedCard>` wrapping the
 *   rectangular `psdImage`, no surrounding illustration. Static club
 *   chrome caption: `★ KCVV ELEWIJT · SEIZOEN 25–26`.
 * - **Illustration** (`photoUrl` missing) — the canonical drawn figure
 *   (jersey-deep underprint + ink overprint outline + V-collar + 4
 *   stripes) on a desaturated cream-soft panel inside the same polaroid
 *   frame. Caption renders the player's own data.
 *
 * The two states never combine. Hybrid figures (photo face on a drawn
 * body, drawn jersey behind a photo, etc.) are explicitly rejected — see
 * `feedback_playerfigure_no_hybrid` ("Mickey Mouse"). The side meta
 * column renders identically in both states so players without a photo
 * are not second-class.
 *
 * Spec: `docs/design/mockups/phase-3-a-tier-c-figures/playerfigure-locked.md`.
 *
 * **Spec deviation — prop shape.** The locked spec types props as
 * `player: Pick<Player, "psdImage" | ...>`, but `psdImage` is a Sanity
 * image asset reference (not a URL). Pulling Sanity's image-url builder
 * into `apps/web/components/design-system/` would couple this primitive
 * to the CMS layer and complicate Storybook authoring. Following the
 * `resolveSubject.ts` pattern, this component takes a flat already-
 * resolved `photoUrl` instead — the calling page (PlayerHero, etc.)
 * resolves the URL upstream.
 */
import Image from "next/image";
import { MonoLabel, type MonoLabelVariant } from "../MonoLabel/MonoLabel";
import { TapedCard } from "../TapedCard/TapedCard";
import {
  JERSEY_FIGURE_VIEWBOX,
  JERSEY_HEAD_ELLIPSE,
  JERSEY_SHOULDER_BUMP_LEFT_PATH,
  JERSEY_SHOULDER_BUMP_RIGHT_PATH,
  JERSEY_TORSO_FILL_PATH,
  JERSEY_TORSO_OUTLINE_PATH,
  JERSEY_V_COLLAR_PATH,
  JERSEY_VERTICAL_STRIPE_PATHS,
} from "../_jersey-paths";

type TagTone = "default" | "jersey" | "ink";

export type PlayerFigureTag = string | { text: string; tone: TagTone };

export interface PlayerFigureProps {
  firstName: string;
  lastName: string;
  /** Editorial position (sentence-case, e.g. "Middenvelder"); falls back to positionPsd. UI uppercases via CSS. */
  position?: string;
  /** PSD-synced position; only used when `position` is empty. */
  positionPsd?: string;
  jerseyNumber?: number;
  /**
   * Resolved player photo URL (typically `transparentImageUrl ?? psdImageUrl`).
   * Missing → component renders the illustration state.
   */
  photoUrl?: string;
  /** First paragraph of `player.bio`, already plain-text. Empty → drop. */
  bio?: string;
  /** Optional context badge (e.g. "SPELER VAN DE WEEK", "NIEUW"). */
  tag?: PlayerFigureTag;
  /** Optional team label, e.g. "A-PLOEG". Page-supplied — never derived inside the component. */
  teamLabel?: string;
  /** Photo crop variant. `tight` shifts object-position for head-only source images. */
  crop?: "default" | "tight";
}

const STATIC_PHOTO_CAPTION = "★ KCVV ELEWIJT · SEIZOEN 25–26";
const BIO_MAX_CHARS = 120;
const STRIPE_STROKE_WIDTH = 2;
const OUTLINE_STROKE_WIDTH = 3;

const TAG_TONE_TO_VARIANT: Record<TagTone, MonoLabelVariant> = {
  default: "plain",
  jersey: "pill-jersey",
  ink: "pill-ink",
};

function normaliseTag(
  tag: PlayerFigureTag | undefined,
): { text: string; variant: MonoLabelVariant } | undefined {
  if (tag === undefined) return undefined;
  if (typeof tag === "string") {
    return { text: tag, variant: "plain" };
  }
  return { text: tag.text, variant: TAG_TONE_TO_VARIANT[tag.tone] };
}

function truncateBio(bio: string): string {
  if (bio.length <= BIO_MAX_CHARS) return bio;
  return `${bio.slice(0, BIO_MAX_CHARS - 1).trimEnd()}…`;
}

function PlayerMeta({
  firstName,
  lastName,
  position,
  positionPsd,
  jerseyNumber,
  bio,
  tag,
  teamLabel,
}: Pick<
  PlayerFigureProps,
  | "firstName"
  | "lastName"
  | "position"
  | "positionPsd"
  | "jerseyNumber"
  | "bio"
  | "tag"
  | "teamLabel"
>) {
  const resolvedPosition = position ?? positionPsd;
  const normalisedTag = normaliseTag(tag);
  const trimmedBio = bio?.trim();
  return (
    <div data-playerfigure="meta" className="flex flex-col gap-2">
      {resolvedPosition !== undefined && resolvedPosition !== "" ? (
        <span className="uppercase">
          <MonoLabel variant="pill-cream">
            {teamLabel !== undefined && teamLabel !== ""
              ? `${teamLabel} · ${resolvedPosition}`
              : resolvedPosition}
          </MonoLabel>
        </span>
      ) : null}
      <p className="text-ink font-serif text-3xl leading-tight">
        <span className="font-semibold">{firstName}</span>{" "}
        <em className="font-light italic">{lastName}</em>
      </p>
      {jerseyNumber !== undefined ? (
        <p className="text-jersey-deep font-serif text-2xl leading-none font-black">
          #{jerseyNumber}
        </p>
      ) : null}
      {trimmedBio !== undefined && trimmedBio !== "" ? (
        <p className="text-ink-soft max-w-[32ch] font-serif text-base italic">
          {truncateBio(trimmedBio)}
        </p>
      ) : null}
      {normalisedTag !== undefined ? (
        <span>
          <MonoLabel variant={normalisedTag.variant}>
            {normalisedTag.text}
          </MonoLabel>
        </span>
      ) : null}
    </div>
  );
}

const PHOTO_CROP_CLASS: Record<
  NonNullable<PlayerFigureProps["crop"]>,
  string
> = {
  default: "object-[center_18%] h-[380px]",
  tight: "object-[center_32%] h-[320px]",
};

function PhotoState({
  firstName,
  lastName,
  photoUrl,
  crop = "default",
}: {
  firstName: string;
  lastName: string;
  photoUrl: string;
  crop?: PlayerFigureProps["crop"];
}) {
  return (
    <TapedCard
      rotation="a"
      tape={[{ color: "jersey", length: "md" }]}
      bg="cream"
      padding="sm"
      as="div"
    >
      <div className="border-paper-edge bg-cream-soft border">
        <Image
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          width={400}
          height={520}
          unoptimized
          className={`block w-full ${PHOTO_CROP_CLASS[crop]} contrast-[1.04] saturate-[0.9]`}
          style={{ objectFit: "cover" }}
        />
      </div>
      <p
        data-playerfigure="caption"
        className="text-ink-muted mt-3 text-center font-mono text-[10px] tracking-[0.1em] uppercase"
      >
        {STATIC_PHOTO_CAPTION}
      </p>
    </TapedCard>
  );
}

function IllustrationState({
  firstName,
  lastName,
  jerseyNumber,
  teamLabel,
}: Pick<
  PlayerFigureProps,
  "firstName" | "lastName" | "jerseyNumber" | "teamLabel"
>) {
  return (
    <TapedCard
      rotation="b"
      tape={[{ color: "jersey", length: "md" }]}
      bg="cream"
      padding="sm"
      as="div"
    >
      <div className="bg-cream-soft border-paper-edge relative h-[380px] w-full overflow-hidden border">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-95 mix-blend-multiply"
        >
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
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[3px] translate-y-[2px]"
        >
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
      <p
        data-playerfigure="caption"
        className="text-ink-muted mt-3 text-center font-mono text-[10px] tracking-[0.1em] uppercase"
      >
        {jerseyNumber !== undefined ? (
          <b className="text-jersey-deep">#{jerseyNumber}</b>
        ) : null}
        {jerseyNumber !== undefined ? " " : null}
        {firstName} {lastName}
        {teamLabel !== undefined && teamLabel !== "" ? ` · ${teamLabel}` : null}
      </p>
    </TapedCard>
  );
}

export function PlayerFigure(props: PlayerFigureProps) {
  const {
    firstName,
    lastName,
    position,
    positionPsd,
    jerseyNumber,
    photoUrl,
    bio,
    tag,
    teamLabel,
    crop,
  } = props;
  const hasPhoto = photoUrl !== undefined && photoUrl !== "";
  return (
    <figure
      data-playerfigure-state={hasPhoto ? "photo" : "illustration"}
      className="grid grid-cols-1 items-start gap-x-10 gap-y-6 sm:grid-cols-[minmax(220px,auto)_1fr]"
    >
      <div className="max-w-[280px]">
        {hasPhoto ? (
          <PhotoState
            firstName={firstName}
            lastName={lastName}
            photoUrl={photoUrl}
            crop={crop}
          />
        ) : (
          <IllustrationState
            firstName={firstName}
            lastName={lastName}
            jerseyNumber={jerseyNumber}
            teamLabel={teamLabel}
          />
        )}
      </div>
      <PlayerMeta
        firstName={firstName}
        lastName={lastName}
        position={position}
        positionPsd={positionPsd}
        jerseyNumber={jerseyNumber}
        bio={bio}
        tag={tag}
        teamLabel={teamLabel}
      />
    </figure>
  );
}
