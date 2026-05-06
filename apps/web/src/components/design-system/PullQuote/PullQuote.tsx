import { cn } from "@/lib/utils/cn";
import { HighlighterStroke } from "../HighlighterStroke";
import { QuoteMark, type QuoteMarkColor } from "../QuoteMark";
import { TapedCard, type TapedCardProps } from "../TapedCard";

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
    metaText: "text-cream/70",
    quoteMark: "jersey",
  },
  jersey: {
    // Phase 3 redesign — bright `--color-jersey` is retired (per owner
    // direction). The "jersey" tone now renders as the dark jersey-deep
    // paper card with cream typography.
    bg: "jersey-deep",
    body: "text-cream",
    name: "text-cream",
    metaText: "text-cream/70",
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
  className,
}: PullQuoteProps) {
  const palette = TONE[tone];
  return (
    <TapedCard
      bg={palette.bg}
      shadow={palette.shadow}
      rotation={rotation}
      tape={tape}
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "font-mono text-[length:var(--text-label)] leading-none font-medium tracking-[var(--text-label--tracking)] uppercase",
              palette.name,
            )}
          >
            {attribution.name}
          </span>
          {attribution.role && (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block h-[3px] w-[3px] rounded-full bg-current",
                  palette.metaText,
                )}
              />
              <span
                className={cn(
                  "font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase",
                  palette.metaText,
                )}
              >
                {attribution.role}
              </span>
            </>
          )}
          {attribution.source && (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block h-[3px] w-[3px] rounded-full bg-current",
                  palette.metaText,
                )}
              />
              <span
                className={cn(
                  "font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase",
                  palette.metaText,
                )}
              >
                {attribution.source}
              </span>
            </>
          )}
        </div>
      </div>
    </TapedCard>
  );
}
