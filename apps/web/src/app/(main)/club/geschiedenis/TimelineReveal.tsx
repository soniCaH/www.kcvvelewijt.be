"use client";

import { useEffect, useRef, type ReactNode } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const BASE_CLASS = "timeline-reveal";
const ITEM_SELECTOR = "[data-timeline-item]";
const ENTERED_CLASS = "timeline-item--entered";

/**
 * Scroll-triggered "fly in" for the `/club/geschiedenis` timeline. Wraps the
 * server-rendered chronicle and, on mount, hides every `[data-timeline-item]`
 * (cards + photos) then reveals each one as it crosses the viewport — cards
 * slide in directionally (`data-side`), centred photos fade up. The motion
 * vocabulary mirrors `<ArticleBodyMotion>` (§7.5).
 *
 * The base `timeline-reveal` class is applied on mount (not during SSR), so a
 * no-JS / pre-hydration render shows the timeline at its final state — content
 * is never permanently hidden. When `prefers-reduced-motion: reduce` is set the
 * component short-circuits before touching the DOM: no class, no observer.
 */
export function TimelineReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia(MOTION_QUERY).matches) return;

    node.classList.add(BASE_CLASS);
    const items = Array.from(node.querySelectorAll<HTMLElement>(ITEM_SELECTOR));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add(ENTERED_CLASS);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
