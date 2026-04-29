import { cn } from "@/lib/utils/cn";
import {
  HighlighterStroke,
  type HighlighterStrokeVariant,
} from "../HighlighterStroke";
import { TapedCard, type TapedCardProps } from "../TapedCard";

export type PullQuoteTone = "cream" | "ink" | "jersey";

export interface PullQuoteAttribution {
  name: string;
  role?: string;
  source?: string;
}

export interface PullQuoteEmphasis {
  text: string;
  highlight?: boolean;
  highlightVariant?: HighlighterStrokeVariant;
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

const TONE: Record<
  PullQuoteTone,
  {
    bg: TapedCardProps["bg"];
    body: string;
    name: string;
    metaText: string;
  }
> = {
  cream: {
    bg: "cream",
    body: "text-ink",
    name: "text-ink",
    metaText: "text-ink-muted",
  },
  ink: {
    bg: "ink",
    body: "text-cream",
    // ink bg needs cream text for the name — MonoLabel variant=plain hard-codes
    // text-ink, so render the name in a directly-styled span instead.
    name: "text-cream",
    metaText: "text-cream/70",
  },
  jersey: {
    bg: "jersey",
    body: "text-ink",
    name: "text-ink",
    metaText: "text-ink-muted",
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
  const emEl = (
    <em className="font-display font-semibold not-italic">{match}</em>
  );
  return (
    <>
      {before}
      {emphasis.highlight ? (
        <HighlighterStroke variant={emphasis.highlightVariant ?? "a"}>
          {emEl}
        </HighlighterStroke>
      ) : (
        emEl
      )}
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
      rotation={rotation}
      tape={tape}
      padding="lg"
      className={cn(className)}
    >
      <div data-pull-quote-tone={tone} className="flex flex-col gap-4">
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
