import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { HighlighterStroke } from "../HighlighterStroke";
import { QuoteMark, type QuoteMarkColor } from "../QuoteMark";
import { TapedCard, type TapedCardProps } from "../TapedCard";

type TapedCardInteractive = TapedCardProps["interactive"];

export type PullQuoteTone = "cream" | "ink" | "jersey";

interface TonePalette {
  bg: TapedCardProps["bg"];
  shadow?: TapedCardProps["shadow"];
  body: string;
  name: string;
  metaText: string;
  quoteMark: QuoteMarkColor;
}

export interface PullQuoteAttribution {
  name: string;
  role?: string;
  source?: string;
}

export interface PullQuoteEmphasis {
  /** substring of the body to accentuate via <HighlighterStroke> — no font change */
  text: string;
}

export interface PullQuoteProps {
  children: string;
  attribution: PullQuoteAttribution;
  tone?: PullQuoteTone;
  emphasis?: PullQuoteEmphasis;
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
   * that don't reference a KCVV subject.
   */
  avatarSlot?: ReactNode;
  className?: string;
}

const TONE: Record<PullQuoteTone, TonePalette> = {
  cream: {
    bg: "cream",
    body: "text-ink",
    name: "text-ink",
    metaText: "text-ink-muted",
    quoteMark: "jersey",
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
  },
};

function renderBodyWithEmphasis(
  body: string,
  emphasis: PullQuoteEmphasis | undefined,
) {
  if (!emphasis) return body;
  const idx = body.indexOf(emphasis.text);
  if (idx < 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[PullQuote] emphasis.text "${emphasis.text}" not found in quote body`,
      );
    }
    return body;
  }
  const before = body.slice(0, idx);
  const match = body.slice(idx, idx + emphasis.text.length);
  const after = body.slice(idx + emphasis.text.length);
  // No font change — the emphasis is the highlighter pass alone, so the
  // quote reads as one continuous italic display sentence with a marker
  // pulled across the accentuated phrase.
  return (
    <>
      {before}
      <HighlighterStroke>{match}</HighlighterStroke>
      {after}
    </>
  );
}

export function PullQuote({
  children,
  attribution,
  tone = "cream",
  emphasis,
  rotation,
  tape,
  interactive,
  avatarSlot,
  className,
}: PullQuoteProps) {
  const palette = TONE[tone];
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
      <div data-pull-quote-tone={tone} className="flex flex-col gap-4">
        <QuoteMark color={palette.quoteMark} />
        <q
          className={cn(
            "font-display block italic",
            "text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)]",
            palette.body,
          )}
        >
          {renderBodyWithEmphasis(children, emphasis)}
        </q>
        <PullQuoteAttributionRow
          attribution={attribution}
          avatarSlot={avatarSlot}
          palette={palette}
        />
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
            "font-mono text-[length:var(--text-label)] leading-none font-medium tracking-[var(--text-label--tracking)] uppercase",
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
                "font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase",
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
                    "font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase",
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
