"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import type { PortableTextBlock } from "@portabletext/react";
import {
  EditorialHero,
  type EditorialHeroVariant,
  type EditorialHeroCoverImage,
} from "@/components/article/EditorialHero";
import type { EditorialKickerProps } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { serializeTitle } from "@/lib/utils/serialize-title";

export interface HomepageHeroArticle {
  slug: string;
  variant: EditorialHeroVariant;
  title: string | PortableTextBlock[];
  lead?: string;
  kicker?: EditorialKickerProps["items"];
  author?: string;
  coverImage?: EditorialHeroCoverImage;
  /** Short label used in the thumb strip (e.g. "Interview"). Falls back to
   *  the variant when omitted. */
  thumbLabel?: string;
}

export interface HomepageHeroCarouselProps {
  articles: HomepageHeroArticle[];
  /** Auto-advance interval in ms. Default 5000. */
  autoRotateInterval?: number;
  /** Storybook hook — render in the paused state initially. */
  initialPaused?: boolean;
  /** Storybook hook — start on this slide instead of 0. */
  initialIndex?: number;
}

const DEFAULT_INTERVAL = 5000;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

export const HomepageHeroCarousel = ({
  articles,
  autoRotateInterval = DEFAULT_INTERVAL,
  initialPaused = false,
  initialIndex = 0,
}: HomepageHeroCarouselProps) => {
  const safeArticles = articles.slice(0, 3);
  const total = safeArticles.length;
  const maxIndex = Math.max(0, total - 1);
  const reducedMotion = usePrefersReducedMotion();

  const [activeIndex, setActiveIndex] = useState(
    Math.min(Math.max(0, initialIndex), maxIndex),
  );
  const [userPaused, setUserPaused] = useState(initialPaused);
  const [progressKey, setProgressKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotation only stops on explicit user pause or
  // `prefers-reduced-motion: reduce`. Hover- and focus-pause used to
  // hang here too, but the carousel section spans the full viewport
  // width — the cursor is "always hovering" — so hover-pause made
  // auto-advance effectively never fire.
  const isAutoPlaying = total > 1 && !userPaused && !reducedMotion;

  // Auto-advance
  useEffect(() => {
    if (!isAutoPlaying) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % total);
      setProgressKey((k) => k + 1);
    }, autoRotateInterval);
    return () => window.clearInterval(id);
  }, [isAutoPlaying, autoRotateInterval, total]);

  const goTo = useCallback(
    (i: number) => {
      setActiveIndex(((i % total) + total) % total);
      setProgressKey((k) => k + 1);
    },
    [total],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  };

  if (total === 0) return null;

  const active = safeArticles[activeIndex]!;

  // Single-article placement: no carousel chrome.
  if (total === 1) {
    return (
      <section
        aria-label="Uitgelicht artikel"
        className="bg-cream py-4 md:py-6"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <EditorialHero
            variant={active.variant}
            placement="homepage"
            slug={active.slug}
            title={active.title}
            lead={active.lead}
            kicker={active.kicker}
            author={active.author}
            coverImage={active.coverImage}
          />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Uitgelichte artikels"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="bg-cream focus-visible:outline-jersey-deep py-4 focus-visible:outline-2 focus-visible:outline-offset-2 md:py-6"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div aria-live="polite" aria-atomic="true">
          <EditorialHero
            variant={active.variant}
            placement="homepage"
            slug={active.slug}
            title={active.title}
            lead={active.lead}
            kicker={active.kicker}
            author={active.author}
            coverImage={active.coverImage}
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <ProgressBar
              key={progressKey}
              total={total}
              activeIndex={activeIndex}
              durationMs={autoRotateInterval}
              running={isAutoPlaying}
            />
            <PausePlayButton
              paused={userPaused || reducedMotion}
              reducedMotion={reducedMotion}
              onToggle={() => setUserPaused((p) => !p)}
            />
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-3 md:gap-4">
            {safeArticles.map((article, i) => (
              <li key={article.slug}>
                <ThumbButton
                  index={i}
                  total={total}
                  article={article}
                  active={i === activeIndex}
                  onClick={() => goTo(i)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

interface ProgressBarProps {
  total: number;
  activeIndex: number;
  durationMs: number;
  running: boolean;
}

const ProgressBar = ({
  total,
  activeIndex,
  durationMs,
  running,
}: ProgressBarProps) => (
  <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className="bg-ink/10 relative h-[3px] flex-1 overflow-hidden"
      >
        <div
          className={cn(
            "bg-ink absolute inset-y-0 left-0 w-full",
            i < activeIndex && "scale-x-100",
            i === activeIndex &&
              (running ? "carousel-progress-fill" : "scale-x-0"),
            i > activeIndex && "scale-x-0",
          )}
          style={
            i === activeIndex && running
              ? { animationDuration: `${durationMs}ms` }
              : undefined
          }
        />
      </div>
    ))}
  </div>
);

interface PausePlayButtonProps {
  paused: boolean;
  reducedMotion: boolean;
  onToggle: () => void;
}

const PausePlayButton = ({
  paused,
  reducedMotion,
  onToggle,
}: PausePlayButtonProps) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={reducedMotion}
    aria-label={paused ? "Auto-rotatie hervatten" : "Auto-rotatie pauzeren"}
    aria-pressed={paused}
    className="border-ink bg-cream-soft text-ink shadow-paper-sm focus-visible:outline-ink disabled:hover:shadow-paper-sm flex h-9 w-9 shrink-0 items-center justify-center border-2 transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
  >
    <span aria-hidden="true" className="font-mono text-xs leading-none">
      {paused ? "▶" : "❚❚"}
    </span>
  </button>
);

interface ThumbButtonProps {
  index: number;
  total: number;
  article: HomepageHeroArticle;
  active: boolean;
  onClick: () => void;
}

const ThumbButton = ({
  index,
  total,
  article,
  active,
  onClick,
}: ThumbButtonProps) => {
  const titleText = serializeTitle(article.title);
  const label = article.thumbLabel ?? article.variant;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Slide ${index + 1} van ${total}: ${titleText}`}
      aria-pressed={active}
      className={cn(
        "focus-visible:outline-jersey-deep group flex w-full items-start gap-3 text-left transition-opacity duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none",
        active ? "opacity-100" : "opacity-60 hover:opacity-90",
      )}
    >
      <span
        className={cn(
          "border-paper-edge relative block aspect-[4/3] w-20 shrink-0 overflow-hidden border",
          active && "outline outline-2 outline-offset-2 outline-[#f0c264]",
        )}
      >
        {article.coverImage ? (
          <Image
            src={article.coverImage.url}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="bg-cream-soft block h-full w-full" />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-ink/60 font-mono text-[10px] leading-none font-bold tracking-wide uppercase">
          {String(index + 1).padStart(2, "0")} · {label}
        </span>
        <span className="text-ink line-clamp-2 text-sm leading-snug font-medium">
          {titleText}
        </span>
      </span>
    </button>
  );
};
