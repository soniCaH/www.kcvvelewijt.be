"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface ArticleBodyMotionProps {
  children: ReactNode;
  className?: string;
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const BASE_CLASS = "article-body-motion";
const ENTERED_CLASS = "article-body-motion--entered";

/**
 * Design §7.5 — body fade-up on scroll. Observes every `<p>`, `<h2>` and
 * `<h3>` under the container (the prose tree rendered by PortableText) and
 * reveals them one-by-one with a 24px rise + opacity transition as they
 * cross the viewport.
 *
 * Client-only component. Wraps server-rendered body prose so the
 * `AnnouncementTemplate` (and, later, the transfer + event templates) can
 * stay on the server side of the boundary.
 *
 * When `prefers-reduced-motion: reduce` is set the component short-circuits
 * before mutating any DOM — the base `.article-body-motion` class is never
 * applied, so the children render at their natural final state. There is no
 * observer and nothing to tear down.
 *
 * Known trade-off — brief hydration flash: the `.article-body-motion` class
 * is only added on mount, so there is a very short window between SSR paint
 * and observer-ready state where paragraphs are fully visible. The observer
 * fires next-frame for already-visible elements, so the visible flicker is
 * sub-perceptual in practice. Fixing this fully requires moving the initial
 * opacity to an SSR-applied class (couples this component to the PortableText
 * serializers in `SanityArticleBody`) — tracked as a follow-up. For now the
 * behaviour mirrors `QaPairQuote`'s pattern.
 */
export const ArticleBodyMotion = ({
  children,
  className,
}: ArticleBodyMotionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Bail out under reduced motion — elements keep their natural final
    // state. matchMedia is guarded because the effect only runs in the
    // browser, but keep the null check for test environments.
    if (
      typeof window !== "undefined" &&
      window.matchMedia(MOTION_QUERY).matches
    ) {
      return;
    }

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("p, h2, h3"),
    );
    for (const el of elements) el.classList.add(BASE_CLASS);

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).classList.add(ENTERED_CLASS);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    for (const el of elements) observer.observe(el);

    return () => observer.disconnect();
    // `children` intentionally omitted from deps: the article body is
    // rendered once per page load (`revalidate = 3600` re-renders the
    // whole route on the server, not the client). Re-running the effect
    // on every React re-render would re-tag elements already carrying
    // the --entered class and reset their state.
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};
