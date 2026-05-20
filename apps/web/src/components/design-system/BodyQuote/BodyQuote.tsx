import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DottedDivider } from "../Divider";

export interface BodyQuoteProps {
  children: ReactNode;
  className?: string;
}

/**
 * `<BodyQuote>` — editor-authored body pull-out (Portable Text `blockquote`
 * style). Retro-terrace voice: italic Freight Display, dotted dividers
 * framing the quote on top + bottom, centered prose. No attribution row —
 * for quoted speech with an attribution, use `<PullQuote>` instead.
 *
 * Why a sibling to `<PullQuote>`: editor blockquotes from Sanity's `style`
 * decorator don't carry structured attribution, and forcing them through
 * `<PullQuote>` (which requires `attribution.name`) reads as a half-set
 * card. This primitive is the lightweight prose-pull-out version.
 */
export function BodyQuote({ children, className }: BodyQuoteProps) {
  return (
    <figure
      data-body-quote="true"
      className={cn("not-prose mx-auto my-10 max-w-[40rem]", className)}
    >
      <DottedDivider />
      <blockquote className="font-display text-ink py-6 text-center text-2xl leading-snug italic">
        {children}
      </blockquote>
      <DottedDivider />
    </figure>
  );
}
