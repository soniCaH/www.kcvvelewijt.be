import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "../MonoLabel";
import { QuoteMark, type QuoteMarkColor } from "../QuoteMark";
import { TapedCard, type TapedCardProps } from "../TapedCard";

export type PullQuoteTone = "cream" | "ink" | "jersey";

export interface PullQuoteAttribution {
  name: string;
  role?: string;
  source?: string;
}

export interface PullQuoteProps {
  children: string;
  attribution: PullQuoteAttribution;
  tone?: PullQuoteTone;
  rotation?: TapedCardProps["rotation"];
  tape?: TapedCardProps["tape"];
  className?: string;
}

const TONE: Record<
  PullQuoteTone,
  {
    bg: TapedCardProps["bg"];
    body: string;
    quoteMark: QuoteMarkColor;
    metaText: string;
  }
> = {
  cream: {
    bg: "cream",
    body: "text-ink",
    quoteMark: "jersey",
    metaText: "text-ink-muted",
  },
  ink: {
    bg: "ink",
    body: "text-cream",
    quoteMark: "jersey",
    metaText: "text-cream/70",
  },
  jersey: {
    bg: "jersey",
    body: "text-ink",
    quoteMark: "cream",
    metaText: "text-ink-muted",
  },
};

export function PullQuote({
  children,
  attribution,
  tone = "cream",
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
        <QuoteMark color={palette.quoteMark} />
        <q
          className={cn(
            "font-display block italic",
            "text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)]",
            palette.body,
          )}
        >
          {children}
        </q>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MonoLabel variant="plain">{attribution.name}</MonoLabel>
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
