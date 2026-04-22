"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// External-store hooks for `useSyncExternalStore`. They keep the component
// SSR-safe (server snapshot is always `false`) and let us read the OS
// preference without a `setState` inside an effect.
const subscribeReducedMotion = (onChange: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

const getReducedMotionSnapshot = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOTION_QUERY).matches;
};

const getReducedMotionServerSnapshot = (): boolean => false;

export const QaPairQuote = ({ answer, subject }: QaPairQuoteProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  // Observer-driven flag. Derive the visible `entered` state in render so
  // we never need a `setState` inside the effect body (which would trip
  // react-hooks/set-state-in-effect). The observer callback still flips
  // the flag — that's a platform callback, not effect-body setState.
  const [observerFired, setObserverFired] = useState(false);
  const entered = reducedMotion || observerFired;

  useEffect(() => {
    if (reducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setObserverFired(true);
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
      // `my-10` matches the breathing zone used by the `key` breakout so the
      // top and bottom margins around full-bleed cream bands are symmetric
      // with the standard-pair rhythm.
      className="full-bleed relative my-10 overflow-hidden bg-[var(--color-foundation-gray-light)] py-20 md:py-40"
    >
      <span
        aria-hidden="true"
        data-testid="qa-pair-quote-glyph"
        className="font-title text-kcvv-green-bright pointer-events-none absolute top-1/2 left-1/2 text-[12rem] leading-none font-bold md:text-[24rem]"
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
          className="font-title text-kcvv-gray-blue text-[clamp(2rem,4vw,3rem)] leading-[1.2] font-medium"
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
