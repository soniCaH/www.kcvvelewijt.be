/**
 * SearchAnswerCard — the `/zoeken` "Slim antwoord" card (8s5, variant C LOCKED).
 *
 * A fanzine memo: a taped paper card (warm tape strip) with a decorative
 * circular brick `✦ SLIM` postmark, the LLM `answer` as a Fraunces-italic
 * pull-quote, a footnote row of real source links, and a brick disclaimer.
 * Leans on the existing TapedCard / postmark vocabulary (8s3 / #2106).
 *
 * A11y (mandatory — the card wraps model-written prose):
 *  - The postmark + tape strip are decorative → `aria-hidden`, kept out of the
 *    accessible name (TapeStrip is aria-hidden by default; the postmark too).
 *  - The italic pull-quote keeps AA contrast (ink on cream); the card's −0.5°
 *    rotation is cosmetic only — it never reorders the DOM, and the answer is
 *    length-clamped so it wraps gracefully instead of clipping at narrow widths.
 *  - The disclaimer stays legible (ink-soft, not rotated).
 *  - Sources are real, keyboard-focusable links with a visible focus ring.
 */

import Link from "next/link";
import { TapedCard } from "@/components/design-system";
import { Sparkle, Warning } from "@/lib/icons.redesign";

export interface SearchAnswerSource {
  /** Result title — the visible, clickable link text. */
  title: string;
  /** Derived destination (e.g. `/nieuws/{slug}`). */
  href: string;
}

export interface SearchAnswerCardProps {
  /** The LLM-generated answer (rendered as the italic pull-quote). */
  answer: string;
  /** Source results behind the answer — rendered as the footnote link row. */
  sources: SearchAnswerSource[];
}

const DISCLAIMER =
  "Door AI samengevat uit onze pagina's — controleer altijd de bron.";

/** Keep the pull-quote short so the −0.5° rotation never clips at narrow
 *  widths. Backend answers are already 2–4 sentences; this is a safety net. */
const MAX_ANSWER_CHARS = 320;

function clampAnswer(answer: string): string {
  const trimmed = answer.trim();
  if (trimmed.length <= MAX_ANSWER_CHARS) return trimmed;
  const cut = trimmed.slice(0, MAX_ANSWER_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function SearchAnswerCard({ answer, sources }: SearchAnswerCardProps) {
  return (
    <TapedCard
      as="section"
      rotation={-0.5}
      shadow="md"
      bg="cream"
      padding="md"
      tape={{ color: "warm", length: "md" }}
      className="overflow-hidden"
    >
      {/* Decorative ✦ SLIM postmark (variant C circular brick stamp) —
          aria-hidden, kept out of the accessible name. */}
      <span
        aria-hidden="true"
        className="border-alert text-alert absolute top-3 right-3 flex h-[52px] w-[52px] -rotate-[9deg] flex-col items-center justify-center rounded-full border-2 font-mono text-[8px] font-semibold tracking-[0.06em] uppercase opacity-90"
      >
        <Sparkle size={14} aria-hidden className="mb-0.5" />
        Slim
      </span>

      <span className="text-jersey-deep flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
        <Sparkle size={12} aria-hidden />
        Slim antwoord
      </span>

      <p className="text-ink font-display mt-2.5 mr-10 text-[16.5px] leading-relaxed font-medium break-words italic">
        {clampAnswer(answer)}
      </p>

      {sources.length > 0 && (
        <ul className="border-paper-edge mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-2.5">
          {sources.map((source, index) => (
            <li key={`${source.href}-${index}`}>
              <Link
                href={source.href}
                className="text-jersey-deep focus-visible:outline-jersey-deep font-mono text-[11px] font-semibold underline-offset-2 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {source.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-ink-soft mt-2.5 flex items-center gap-1.5 font-mono text-[10px] leading-snug">
        <Warning size={12} aria-hidden className="text-alert flex-shrink-0" />
        {DISCLAIMER}
      </p>
    </TapedCard>
  );
}
