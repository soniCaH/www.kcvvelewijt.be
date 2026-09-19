import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { TapedCard } from "@/components/design-system/TapedCard";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import {
  EditorialHeading,
  type EditorialHeadingEmphasis,
  type EditorialHeadingSize,
} from "@/components/design-system/EditorialHeading";
import { DottedDivider } from "@/components/design-system/Divider";
import { LinkButton } from "@/components/design-system/LinkButton";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { UpLink, type UpLinkProps } from "@/components/design-system/UpLink";
import {
  PageContainer,
  type PageContainerWidth,
} from "@/components/design-system/PageContainer";

/**
 * `<PageHero>` — **the shared page opening**, of which `band` is one register.
 *
 * The name is the one it shipped under and it keeps it (#2555): the primitive
 * keeps its 10h5 design lock, its Storybook id and its VR baselines, and a
 * rename would have churned thirteen routes for a word.
 *
 * ## When a page may depart from it (#2426)
 *
 * A page uses this opening **unless its opening carries something only that
 * page has**:
 *
 *   - **a control** — the opening *is* the tool (a search field, a structure index)
 *   - **live domain data** — a score, a crest, a jersey number, a ticket, or a
 *     live content module
 *   - **a composition this opening cannot express** — a full-bleed background
 *     photo under a jersey-stripe overlay, say
 *
 * **Re-skinning kicker + headline + lead + photo is not a reason.** That is
 * exactly what the retired `<BoardHero>` and `<JeugdHero>` did, and why eight
 * further routes each hand-rolled a ninth variation of the same thing.
 *
 * The eleven routes that qualify are enumerated on #2426, deliberately not
 * here: a component list in a docblock is a cross-reference no compiler holds,
 * and this very refactor had to hand-correct one that had gone stale.
 *
 * ## Three registers
 *
 * | `register` · `tone` | Gets it | Shell |
 * | --- | --- | --- |
 * | `band` · `cream` | a section's front door — the page you arrive at | cream `<TapedCard>`, wrapped by the caller's `<PageContainer>` |
 * | `band` · `dark` | a front door whose opening carries **a group portrait of the people the page is about** | full-bleed `jersey-deep-dark` field — owns its own container, never wrap it |
 * | `minimal` | a listing you scroll, or a text / legal page | no band at all; content starts immediately |
 *
 * "Of the people the page is about" is load-bearing: `/kalender` shows a people
 * photo too, but it is decorative stock, so `/kalender` stays cream.
 *
 * `tone` follows the field, and the kicker follows the tone — jersey-deep mono
 * on cream, cream `<MonoLabel>` on dark. `minimal` inherits the page's own
 * field rather than painting one, which is how `/evenementen` keeps its opening
 * and its listing inside a single dark section (#2479).
 *
 * **The hero image is decorative and takes `alt=""`. This is a decision, not a
 * default** (#2559 / #2548 rule 1): the image sits in the same section as the
 * `<h1>` this opening renders, so the heading already names the subject and the
 * photograph would only repeat it. The opening therefore takes no alt parameter
 * — there is nothing a caller could correctly pass.
 *
 * Composes existing retro-terrace-fanzine primitives only — no new vocabulary:
 *   - Shell  → `<TapedCard bg="cream">` + one warm `<TapeStrip>` (band · cream).
 *   - Kicker → jersey-deep raw label-token mono span (MonoLabel plain only
 *     renders ink/cream — see `reference_jersey_deep_kicker_pattern`).
 *   - Headline → `<EditorialHeading level={1}>` Freight upright with an
 *     optional one-word italic `accent`; a warm "." terminator when no accent
 *     word is present.
 *   - Lead → italic `font-display`, auto-hides when absent.
 *   - Image → `<TapedFigure>` newsprint (colour) beside the words on desktop,
 *     stacked below them on mobile. Absent (or `size="compact"`, or
 *     `register="minimal"`) → typographic state.
 *   - CTA → optional `<LinkButton>` slot (legacy parity).
 *
 * Design lock: `docs/design/mockups/phase-10-page-hero/10h5-locked.html` (#2120).
 */

export type PageHeroSize = "default" | "compact";
export type PageHeroRegister = "band" | "minimal";
export type PageHeroTone = "cream" | "dark";

export interface PageHeroProps {
  /**
   * Mono kicker above the headline. Optional — omit it where an up-link
   * chip above/inside this opening already names the same parent, so the
   * page doesn't say the parent's name twice (#2442 rule 6, e.g.
   * `/club/[slug]`'s `kicker="Club"` vs its `‹ De club` up-link).
   */
  kicker?: string;
  /** Headline text. Rendered upright Freight via `<EditorialHeading>`. */
  headline: string;
  /**
   * Optional one-word (or short phrase) accent rendered italic and coloured —
   * jersey-deep on a cream field, warm on a dark one, because jersey-deep
   * italic on `jersey-deep-dark` is the one pairing that disappears. Must be a
   * substring of `headline`. When present, the "." terminator is dropped in
   * favour of the accent emphasis (a single EditorialHeading emphasis span can
   * carry one or the other, not both).
   */
  accent?: string;
  /** Optional italic display lead. Auto-hides when empty. */
  lead?: string;
  /**
   * Optional hero photograph. Suppressed by `size="compact"` and by
   * `register="minimal"` — the quiet register is words only.
   */
  image?: string;
  /**
   * Which shell the opening wears. `"band"` (default) is a front door;
   * `"minimal"` is a listing you scroll or a text page.
   */
  register?: PageHeroRegister;
  /**
   * Which field the opening sits on. `"cream"` (default) is ink on paper;
   * `"dark"` is cream on `jersey-deep-dark`. `band` paints the field itself,
   * `minimal` inherits the page's.
   */
  tone?: PageHeroTone;
  /**
   * Body width. **`band` · `dark` only** — it is the one register that owns its
   * own container, so it is the one register that has a width to set. The board
   * pages are detail surfaces at the 1040 default; `/jeugd` is an index page and
   * passes `"index"` so its opening lines up with the grids below it.
   */
  width?: PageContainerWidth;
  /**
   * Trailing opening content — a published date, a sibling link, an intro
   * paragraph. `minimal` only: the band registers are a locked composition.
   */
  children?: ReactNode;
  /** Optional CTA rendered as a primary `<LinkButton>`. Band · cream only. */
  cta?: { label: string; href: string };
  /**
   * Optional adornment rendered beside the kicker + headline (e.g. an opponent
   * `<Crest>` on the `/tegenstander` hero). Sits left of the heading block in a
   * centred flex row; the lead and divider stay full-width below. Primarily for
   * the typographic state — pairs uneasily with an `image` and no consumer
   * combines the two. Band · cream only.
   */
  adornment?: ReactNode;
  /**
   * `"default"` — full hero with optional image.
   * `"compact"` — tighter padding, smaller headline, image suppressed.
   *   Used by loading skeletons and bare utility pages. Band · cream only.
   */
  size?: PageHeroSize;
  className?: string;
  /**
   * The up-link to this route's structural parent (#2428/#2442). `PageHero`
   * owns its placement on every register, so a caller never hand-places its
   * own `<UpLink>` or invents container padding to host one: `band` ·
   * `cream` and `minimal` render it as its own element above the opening,
   * tone `ink`; `band` · `dark` has no cream strip for one to live in, so it
   * renders *inside* the field instead, tone-swapped to `cream` (#2442 rule
   * 2). The opening owns the gap either way, the same reasoning that put
   * `mb-10` here instead of at nine call sites.
   */
  upLink?: Pick<UpLinkProps, "href" | "label">;
}

/**
 * A single EditorialHeading emphasis span carries either the accent word OR the
 * "." terminator — not both. Accent wins when it is actually present in the
 * headline; otherwise the period gets the warm tone.
 *
 * The period rides on EditorialHeading's appended terminator, matched via
 * `indexOf(".")` — so suppress it when the headline already contains a period
 * (e.g. an un-curated CMS title like "3de Prov. B"), otherwise the warm styling
 * would land on the internal period rather than the terminator.
 *
 * On a dark field the accent goes warm too: jersey-deep italic on
 * `jersey-deep-dark` is the one pairing that disappears.
 */
function headlineEmphasis(
  headline: string,
  accent: string | undefined,
  tone: PageHeroTone,
): EditorialHeadingEmphasis | undefined {
  if (accent && headline.includes(accent)) {
    return { text: accent, tone: tone === "dark" ? "warm" : "jersey-deep" };
  }
  // Ask the same question `ensureTrailingPeriod` asks: a headline already ended
  // by sentence punctuation gets no terminator appended, so there is nothing for
  // the emphasis to match and EditorialHeading warns on every render. A CMS
  // gallery title ending in "?" is the live path.
  const terminated = /[.?!]$/.test(headline.trimEnd());
  return terminated || headline.includes(".")
    ? undefined
    : { text: ".", tone: "warm" };
}

/**
 * The kicker follows the field: a jersey-deep raw label-token span on cream
 * (MonoLabel's plain variant only renders ink/cream tone), a cream `<MonoLabel>`
 * on dark. `tracking-[0.18em]` is the 10h5 lock value, intentionally wider than
 * the `--text-label--tracking` (0.08em) token used by inline label rows.
 */
function Kicker({ children, tone }: { children: string; tone: PageHeroTone }) {
  if (tone === "dark") {
    return (
      <span data-testid="page-hero-kicker">
        <MonoLabel variant="plain" tone="cream">
          {children}
        </MonoLabel>
      </span>
    );
  }
  return (
    <span
      data-testid="page-hero-kicker"
      className="text-jersey-deep text-label font-mono font-semibold tracking-[0.18em] uppercase"
    >
      {children}
    </span>
  );
}

/**
 * The lead's colour follows the field, and both registers that can sit on dark
 * read it from here — two definitions of `text-cream/85` is how a tone drifts.
 */
const LEAD_TONE_CLASS: Record<PageHeroTone, string> = {
  cream: "text-ink-soft",
  dark: "text-cream/85",
};

/** `register="minimal"` — no band, no photo. Content starts immediately. */
function MinimalOpening({
  kicker,
  headline,
  accent,
  lead,
  tone,
  children,
  className,
  upLink,
}: Pick<
  PageHeroProps,
  | "kicker"
  | "headline"
  | "accent"
  | "lead"
  | "children"
  | "className"
  | "upLink"
> & {
  tone: PageHeroTone;
}) {
  return (
    <>
      {/* Its own element above the opening, not inside the <header> — the
          up-link names the parent, the header opens this page (#2428 §5).
          The opening owns the gap below it, same reasoning as `mb-10` below.
          The gap *above* it is `<UpLink>`'s own now (#2877) — a caller must
          not also wrap this in a padded container, or the two stack. */}
      {upLink ? (
        <UpLink
          href={upLink.href}
          label={upLink.label}
          tone={tone === "dark" ? "cream" : "ink"}
          className="mb-6"
        />
      ) : null}
      <header
        data-testid="page-hero"
        data-register="minimal"
        data-tone={tone}
        // The opening owns its own bottom air. Putting it here rather than at nine
        // call sites is the whole point of the register — that gap is exactly what
        // drifted (mb-10 / mb-8 / pb-8 / mt-10) while every route hand-rolled it.
        className={cn("mb-10 flex flex-col", className)}
      >
        {kicker ? <Kicker tone={tone}>{kicker}</Kicker> : null}

        {/* `hyphens-auto` because this register is the one that runs in a prose
            column: "Privacyverklaring" is 17 characters and needs ~400px at
            display-xl, while `width="prose"` offers 328px on a 360px screen — it
            overflowed and pushed horizontal scroll. `globals.css` already tunes
            `hyphenate-limit-chars` for it. Alone, never with `break-words`. */}
        <EditorialHeading
          level={1}
          size="display-xl"
          tone={tone === "dark" ? "cream" : "ink"}
          emphasis={headlineEmphasis(headline, accent, tone)}
          // The kicker→headline gap only exists when there is a kicker to
          // clear — otherwise it strands the h1 8px below the card's own
          // padding for nothing (a gap the kicker's absence should not
          // leave behind).
          className={cn(kicker ? "mt-2" : undefined, "mb-0 hyphens-auto")}
        >
          {headline}
        </EditorialHeading>

        {lead ? (
          // The reading measure is `--container-prose`, never a hand-picked `ch`
          // value — an opening that invents its own is how the site ended up with
          // several.
          <p
            className={cn(
              "font-display text-display-sm mt-4 max-w-[var(--container-prose)] italic",
              LEAD_TONE_CLASS[tone],
            )}
          >
            {lead}
          </p>
        ) : null}

        {children}
      </header>
    </>
  );
}

/**
 * `register="band"` · `tone="dark"` — the group-portrait front door. Full-bleed
 * by nature (it paints the field), so it owns its `<PageContainer>` and must
 * NOT be wrapped in one. Ported from the retired `<BoardHero>` unchanged, which
 * is why the three board routes are a pixel-stable component swap.
 */
function DarkBand({
  kicker,
  headline,
  accent,
  lead,
  image,
  width,
  className,
  upLink,
}: Pick<
  PageHeroProps,
  | "kicker"
  | "headline"
  | "accent"
  | "lead"
  | "image"
  | "width"
  | "className"
  | "upLink"
>) {
  return (
    <header
      data-testid="page-hero"
      data-register="band"
      data-tone="dark"
      data-state={image ? "image" : "typographic"}
      className={cn("bg-jersey-deep-dark", className)}
    >
      <PageContainer
        width={width}
        className="flex flex-col gap-6 py-14 sm:py-20"
      >
        {/* Rendered *inside* the band, tone-swapped to cream — the dark
            routes have no cream strip above the header for a page-owned
            `<UpLink>` to live in, and one would turn the flush arrival into
            a section (#2442 rule 2). Always the container's left edge. */}
        {upLink ? (
          <UpLink href={upLink.href} label={upLink.label} tone="cream" />
        ) : null}

        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-col gap-4">
            {kicker ? <Kicker tone="dark">{kicker}</Kicker> : null}
            <EditorialHeading
              level={1}
              size="display-2xl"
              tone="cream"
              emphasis={headlineEmphasis(headline, accent, "dark")}
              className="mb-0"
            >
              {headline}
            </EditorialHeading>
            {lead ? (
              <p
                className={cn(
                  "font-display text-display-sm italic",
                  LEAD_TONE_CLASS.dark,
                )}
              >
                {lead}
              </p>
            ) : null}
          </div>

          {image ? (
            <TapedFigure
              aspect="landscape-3-2"
              bg="cream-soft"
              tint="newsprint"
              rotation="b"
              tape={{
                color: "warm",
                length: "md",
                position: "left",
                rotation: "a",
              }}
              className="w-full md:w-[24rem]"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 768px) 24rem, 100vw"
                className="object-cover"
              />
            </TapedFigure>
          ) : null}
        </div>
      </PageContainer>
    </header>
  );
}

export function PageHero(props: PageHeroProps) {
  const { register = "band", tone = "cream" } = props;

  // Each register takes the whole prop bag and reads the slice its `Pick<>`
  // names — forwarding by hand meant three lists to keep in step every time a
  // prop was added.
  if (register === "minimal") return <MinimalOpening {...props} tone={tone} />;
  if (tone === "dark") return <DarkBand {...props} />;

  const {
    kicker,
    headline,
    accent,
    lead,
    image,
    cta,
    adornment,
    size = "default",
    className,
    upLink,
  } = props;

  const isCompact = size === "compact";
  // Compact suppresses the image regardless of whether one was supplied.
  const showImage = Boolean(image) && !isCompact;
  const showLead = Boolean(lead);

  const headingSize: EditorialHeadingSize = isCompact
    ? "display-md"
    : showImage
      ? "display-lg"
      : "display-xl";

  const headingBlock = (
    <div>
      {kicker ? <Kicker tone="cream">{kicker}</Kicker> : null}

      {/* `mb-0` neutralises the global base `h1–h6 { margin-bottom: 1em }`,
          which at display-xl is ~72px of dead space — the hero owns its own
          rhythm (the lead's `mt-3.5` / the divider's `mt-4`). `mt-2` only
          applies when a kicker actually rendered above — otherwise it is a
          gap clearing nothing. */}
      <EditorialHeading
        level={1}
        size={headingSize}
        emphasis={headlineEmphasis(headline, accent, "cream")}
        className={cn(kicker ? "mt-2" : undefined, "mb-0")}
      >
        {headline}
      </EditorialHeading>
    </div>
  );

  const textColumn = (
    <div>
      {adornment ? (
        <div className="flex items-center gap-4">
          {adornment}
          {headingBlock}
        </div>
      ) : (
        headingBlock
      )}

      {showLead ? (
        <p
          className={cn(
            "font-display text-ink-soft mt-3.5 leading-[1.38] italic",
            showImage
              ? "text-[1.05rem]"
              : "max-w-[var(--container-prose)] text-[1.25rem]",
          )}
        >
          {lead}
        </p>
      ) : null}

      {/* Typographic state only — a short dotted rule for texture (no image). */}
      {!showImage ? (
        <div className="mt-4 w-[120px]">
          <DottedDivider />
        </div>
      ) : null}

      {cta ? (
        <div className="mt-4">
          <LinkButton href={cta.href} variant="primary" withArrow>
            {cta.label}
          </LinkButton>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Its own element above the card, not inside it — the up-link names
          the parent, the card is this page's own front door (#2428 §5). The
          gap above it is `<UpLink tone="ink">`'s own now (#2877). */}
      {upLink ? (
        <UpLink
          href={upLink.href}
          label={upLink.label}
          tone="ink"
          className="mb-6"
        />
      ) : null}
      <TapedCard
        as="section"
        bg="cream"
        padding={isCompact ? "md" : "lg"}
        tape={{ color: "warm", position: "left", length: "lg" }}
        dataAttrs={{
          "data-testid": "page-hero",
          "data-register": "band",
          "data-tone": "cream",
          "data-size": size,
          "data-state": showImage ? "image" : "typographic",
        }}
        className={className}
      >
        {showImage ? (
          // Words first in the DOM so mobile stacks text → photo (m1); desktop
          // grid places the wider words column left and the photo right.
          <div className="grid items-center gap-6 md:grid-cols-[1.3fr_1fr]">
            {textColumn}
            <TapedFigure
              aspect="landscape-16-9"
              tape={{ color: "warm", position: "right", length: "md" }}
            >
              <Image
                src={image!}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </TapedFigure>
          </div>
        ) : (
          textColumn
        )}
      </TapedCard>
    </>
  );
}
