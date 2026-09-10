import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { MonoLabelTone } from "../MonoLabel";
import { MonoLabelRow, type MonoLabelRowItem } from "../MonoLabelRow";
import { QuoteMark, type QuoteMarkColor } from "../QuoteMark";
import { TapedCard, type TapedCardProps } from "../TapedCard";

type TapedCardInteractive = TapedCardProps["interactive"];

/**
 * Internal render tone — derived from `placement`, never authored by a
 * caller (#2515 rule 5). Module-private: not re-exported from either
 * `PullQuote/index.ts` or the design-system barrel, so there is no public
 * door back to authoring a tone directly.
 */
type PullQuoteTone = "cream" | "ink" | "jersey";

/**
 * Where the card sits relative to the page's reading flow. The component
 * derives its own tone from this — the test is structural, not chromatic:
 *   - "section" — the card is the SOLE content of its container, and that
 *     container is either framed by seams (e.g. `<StripedSeam>` on both
 *     sides) or introduced by a real heading element (an `<h2>`/
 *     `<EditorialHeading>`, not a mono kicker `<div>`) → ink. A card that
 *     shares its section with running prose (a paragraph before or after
 *     it) does not own the section, even under a heading — see `flow`.
 *   - "aside"   — a companion beside running text (a sticky column, a real
 *     `<aside>` element) → jersey (jersey-deep paper).
 *   - "flow"    — everything else: in the flow among paragraphs, sharing a
 *     section with prose, or centred below the text it echoes (the
 *     default) → cream.
 */
export type PullQuotePlacement = "section" | "aside" | "flow";

interface TonePalette {
  bg: TapedCardProps["bg"];
  shadow?: TapedCardProps["shadow"];
  body: string;
  name: string;
  metaText: string;
  quoteMark: QuoteMarkColor;
  labelTone: MonoLabelTone;
}

export interface PullQuoteAttribution {
  name: string;
  role?: string;
  source?: string;
}

/**
 * A card carries a named speaker OR context labels OR nothing — never
 * both. Encoded as a discriminated union rather than two independent
 * optionals so the "never both" rule is enforced by the type checker, not
 * documented and hoped for. `attribution`'s `| undefined` (rather than an
 * optional `?:`) is required so a caller's conditional attribution (e.g.
 * `{ name: playerName ?? "" }` — see `speaker` below for why the empty-name
 * case still needs no special-casing at the call site) still type-checks
 * without forcing `labels` into the same branch.
 */
type PullQuoteRow =
  | { attribution: PullQuoteAttribution | undefined; labels?: never }
  | { labels: MonoLabelRowItem[]; attribution?: never };

export type PullQuoteProps = {
  /** The quoted body — any Portable Text / rich content the caller builds. */
  children: ReactNode;
  /**
   * Where this card sits — the component derives its own tone from this.
   * Never pass a tone directly (#2515 rule 5). Defaults to "flow" (cream).
   */
  placement?: PullQuotePlacement;
  rotation?: TapedCardProps["rotation"];
  tape?: TapedCardProps["tape"];
  /**
   * Forwarded to the underlying `<TapedCard>`. Pass `"tilt"` (or `true`) for
   * the homepage-style rest rotation + 1° hover delta — used by the Phase 6.A
   * `<BioBlock>` right-column quote so a pinned-down newsprint clipping
   * tilts further when the reader hovers it.
   */
  interactive?: TapedCardInteractive;
  /**
   * Optional avatar slot rendered beside the attribution name. Typically
   * `<SubjectAvatar scale="attribution" />` resolved at the article-domain
   * layer (PullQuote stays in design-system and does not import Subject
   * resolution). When provided, the attribution row flips to a two-line
   * stack (italic display name on top, mono caps role/source below) per
   * the 5.d2 lock. When omitted, the attribution falls back to the
   * original inline mono caps row — suitable for external-source quotes
   * that don't reference a KCVV subject. Ignored when the row renders
   * `labels` instead of an `attribution`.
   */
  avatarSlot?: ReactNode;
  className?: string;
} & PullQuoteRow;

const TONE: Record<PullQuoteTone, TonePalette> = {
  cream: {
    bg: "cream",
    body: "text-ink",
    name: "text-ink",
    metaText: "text-ink-muted",
    quoteMark: "jersey",
    labelTone: "muted",
  },
  ink: {
    bg: "ink",
    // Black-on-black silhouette — the standard `--shadow-paper-md` is pure
    // ink and disappears against the ink card. Use the soft (ink-muted)
    // shadow for the same reason buttons do.
    shadow: "soft",
    body: "text-cream",
    // ink bg needs cream text for the name — MonoLabel variant=plain hard-codes
    // text-ink, so render the name in a directly-styled span instead.
    name: "text-cream",
    // Full-opacity cream per `feedback_monolabel_cream_full_opacity` —
    // 70% cream over jersey-deep / ink trips axe at ~2.86:1; full opacity
    // sits at the right contrast ratio.
    metaText: "text-cream",
    quoteMark: "jersey",
    labelTone: "cream",
  },
  jersey: {
    // Phase 3 redesign — bright `--color-jersey` is retired (per owner
    // direction). The "jersey" tone now renders as the dark jersey-deep
    // paper card with cream typography.
    bg: "jersey-deep",
    body: "text-cream",
    name: "text-cream",
    metaText: "text-cream",
    quoteMark: "cream",
    labelTone: "cream",
  },
};

const PLACEMENT_TONE: Record<PullQuotePlacement, PullQuoteTone> = {
  section: "ink",
  aside: "jersey",
  flow: "cream",
};

export function PullQuote({
  children,
  attribution,
  labels,
  placement = "flow",
  rotation,
  tape,
  interactive,
  avatarSlot,
  className,
}: PullQuoteProps) {
  const tone = PLACEMENT_TONE[placement];
  const palette = TONE[tone];
  // An authored-but-blank name (`{ name: "" }` — the shape a caller gets by
  // writing `{ name: playerName ?? "" }` rather than a ternary) is still a
  // nameless quote: the row must be omitted, not rendered empty (#2515
  // rule 1). Trimming here means every call site can pass its raw,
  // possibly-blank name straight through with no ternary of its own.
  const speaker = attribution?.name.trim() ? attribution : undefined;

  return (
    <TapedCard
      bg={palette.bg}
      shadow={palette.shadow}
      rotation={rotation}
      tape={tape}
      interactive={interactive}
      padding="lg"
      className={cn(className)}
    >
      <div
        data-pull-quote-tone={tone}
        data-pull-quote-placement={placement}
        className="flex flex-col gap-4"
      >
        {/* `hang` (D14/Y6, #2617) — opt-in: this card's own padding
            (`padding="lg"` above, `<TapedCard>`'s 32px) is what the
            mark's fixed pull is sized for; QuoteMark defaults it off so a
            tighter wrapper elsewhere doesn't inherit a hang it can't
            absorb. */}
        <QuoteMark color={palette.quoteMark} hang />
        <blockquote
          className={cn(
            "font-display block italic",
            "text-display-sm",
            palette.body,
          )}
        >
          {children}
        </blockquote>
        {speaker ? (
          <PullQuoteAttributionRow
            attribution={speaker}
            avatarSlot={avatarSlot}
            palette={palette}
          />
        ) : labels && labels.length > 0 ? (
          <MonoLabelRow items={labels} tone={palette.labelTone} />
        ) : null}
      </div>
    </TapedCard>
  );
}

interface PullQuoteAttributionRowProps {
  attribution: PullQuoteAttribution;
  avatarSlot?: ReactNode;
  palette: TonePalette;
}

function PullQuoteAttributionRow({
  attribution,
  avatarSlot,
  palette,
}: PullQuoteAttributionRowProps) {
  const meta = [attribution.role, attribution.source].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );

  if (!avatarSlot) {
    // Inline mono caps fallback — used by external-source quotes that
    // don't carry a KCVV subject (e.g. "uit Het Nieuwsblad").
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "text-label font-mono leading-none font-medium uppercase",
            palette.name,
          )}
        >
          {attribution.name}
        </span>
        {meta.map((value, i) => (
          // Index-qualified key — role and source can legitimately match
          // (e.g. both authored as the same uppercased token) and we
          // can't rely on `value` alone to be unique.
          <span key={`${i}-${value}`} className="flex items-center gap-x-2">
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-[3px] w-[3px] rounded-full bg-current",
                palette.metaText,
              )}
            />
            <span
              data-pull-quote-meta-index={i}
              className={cn(
                "text-label font-mono leading-none uppercase",
                palette.metaText,
              )}
            >
              {value}
            </span>
          </span>
        ))}
      </div>
    );
  }

  // Avatar layout (5.d2 lock) — circular avatar on the left, italic display
  // name on top right, mono caps role/source line beneath.
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{avatarSlot}</div>
      <div className="flex min-w-0 flex-col gap-1">
        <span
          data-pull-quote-name="display"
          className={cn(
            "font-display text-xl leading-tight italic",
            palette.name,
          )}
        >
          {attribution.name}
        </span>
        {meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {meta.map((value, i) => (
              // Index-qualified key — role and source can legitimately
              // match (e.g. both authored as the same uppercased token).
              <span key={`${i}-${value}`} className="flex items-center gap-x-2">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-block h-[3px] w-[3px] rounded-full bg-current",
                      palette.metaText,
                    )}
                  />
                )}
                <span
                  data-pull-quote-meta-index={i}
                  className={cn(
                    "text-label font-mono leading-none uppercase",
                    palette.metaText,
                  )}
                >
                  {value}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
