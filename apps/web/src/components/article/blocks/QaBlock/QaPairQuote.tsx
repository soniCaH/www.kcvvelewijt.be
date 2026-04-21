"use client";

import { useEffect, useRef, useState } from "react";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import {
  SubjectAttribution,
  type SubjectValue,
} from "@/components/article/SubjectAttribution";

export interface QaPairQuoteProps {
  answer: PortableTextBlock[];
  subject: SubjectValue | null | undefined;
}

const FINAL_OPACITY = 0.12;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION_MS = 700;

/**
 * Design §6.3 — the dramatic moment. Oversized `"` glyph (U+201C) softened
 * to 12% `kcvv-green-bright`, revealed via scroll-triggered motion, with
 * the quote text sitting on top at `z-10`. Full-bleed cream band.
 *
 * The question is intentionally not rendered — the glyph + quote + subject
 * attribution carry the meaning.
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const QaPairQuote = ({ answer, subject }: QaPairQuoteProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Resolve reduced-motion once per mount so `reducedMotion` and the initial
  // value of `entered` cannot disagree, and to avoid the
  // react-hooks/set-state-in-effect warning that a lazy effect-based read
  // would trigger.
  const [reducedMotion] = useState<boolean>(() => prefersReducedMotion());
  const [entered, setEntered] = useState<boolean>(() => reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section
      ref={containerRef}
      data-testid="qa-pair-quote"
      className="full-bleed bg-[var(--color-foundation-gray-light)] py-20 md:py-40 relative overflow-hidden"
    >
      <span
        aria-hidden="true"
        data-testid="qa-pair-quote-glyph"
        className="pointer-events-none absolute left-1/2 top-1/2 font-title font-bold leading-none text-kcvv-green-bright text-[12rem] md:text-[24rem]"
        style={{
          opacity: entered ? FINAL_OPACITY : 0,
          transform: `translate(-50%, -50%) scale(${entered ? 1 : 0.85})`,
          transition: reducedMotion
            ? "none"
            : `opacity ${DURATION_MS}ms ${EASING}, transform ${DURATION_MS}ms ${EASING}`,
        }}
      >
        {"“"}
      </span>

      <div className="relative z-10 mx-auto max-w-[42ch] px-6 text-center">
        <div
          data-testid="qa-pair-quote-text"
          className="font-title font-medium text-kcvv-gray-blue leading-[1.2] text-[clamp(2rem,4vw,3rem)]"
        >
          <PortableText value={answer} />
        </div>
        <div className="mt-8">
          <SubjectAttribution subject={subject} variant="quote" />
        </div>
      </div>
    </section>
  );
};
