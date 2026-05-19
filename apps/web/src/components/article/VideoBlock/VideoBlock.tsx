"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import type { TapeStripProps } from "@/components/design-system/TapeStrip/TapeStrip";
import { parseEmbedUrl, type VideoProvider } from "./parseEmbedUrl";

export interface VideoBlockValue {
  _type: "videoBlock";
  videoAsset?: {
    url?: string | null;
    size?: number | null;
    mimeType?: string | null;
    originalFilename?: string | null;
  } | null;
  embedUrl?: string | null;
  videoPosterUrl?: string | null;
  caption?: string | null;
  /**
   * Phase 5 width enum (#1843). Pre-#1843 articles ship as
   * `width: undefined` + `fullBleed?: boolean`; migrated articles ship
   * as `width: 'prose' | 'wide' | 'bleed'` + `fullBleed: undefined`.
   * This renderer reads both via a one-release fallback.
   */
  width?: "prose" | "wide" | "bleed" | null;
  /** Legacy boolean — replaced by `width` in #1843. */
  fullBleed?: boolean | null;
}

export interface VideoBlockProps {
  value: VideoBlockValue;
  className?: string;
  /**
   * Article slug for `article_video_play` / `article_video_complete`
   * analytics events. Omit on non-article surfaces (staff bio, club page)
   * — analytics is suppressed when either `articleSlug` or `videoPosition`
   * is missing.
   */
  articleSlug?: string;
  /** 1-indexed position of this block within the article body. */
  videoPosition?: number;
}

interface AnalyticsContext {
  articleSlug: string;
  videoPosition: number;
}

function resolveAnalyticsContext(
  articleSlug: string | undefined,
  videoPosition: number | undefined,
): AnalyticsContext | null {
  if (typeof articleSlug !== "string" || articleSlug.length === 0) return null;
  if (typeof videoPosition !== "number" || videoPosition <= 0) return null;
  return { articleSlug, videoPosition };
}

type ResolvedWidth = "prose" | "wide" | "bleed";

function resolveWidth(value: VideoBlockValue): ResolvedWidth {
  // One-release fallback (#1843): prefer the new `width` enum, fall back
  // to the legacy `fullBleed` boolean for un-migrated content.
  if (value.width === "wide" || value.width === "bleed") return value.width;
  if (value.fullBleed === true) return "bleed";
  return "prose";
}

// Width → container styling. Mobile (< 640px) collapses `wide` → `prose`
// per the articleImage R3b lock (inherited).
const WIDTH_STYLE: Record<ResolvedWidth, CSSProperties> = {
  prose: { maxWidth: "var(--container-prose)" },
  wide: { maxWidth: "var(--container-wide)" },
  bleed: {},
};

const WIDTH_WRAPPER_CLASS: Record<ResolvedWidth, string> = {
  prose: "mx-auto w-full px-3 sm:px-0",
  wide: "mx-auto w-full px-3 sm:px-0",
  // `full-bleed` breaks out of the prose column to 100vw via globals.css.
  bleed: "full-bleed",
};

// Per videoblock-locked R1, all video frames carry a single ochre tape
// strip top-center. Bleed suppresses the tape (per width-rules table).
const VIDEO_TAPE: TapeStripProps = {
  color: "warm",
  length: "sm",
};

function trimmedCaption(value: VideoBlockValue): string | null {
  if (typeof value.caption !== "string") return null;
  const trimmed = value.caption.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Phase 5 (#1849) re-frames the renderer around `<TapedFigure>` — same
 * polaroid frame as `<articleImage>` plus a `▶ Afspelen` press-down pill
 * on the upload path. The Phase 1-4 contract is preserved: upload path,
 * embed allowlist, poster, caption, width enum, analytics.
 *
 * Exactly one of `videoAsset` / `embedUrl` is ever populated (enforced
 * by the Sanity XOR validator). `embedUrl` takes precedence if both
 * happened to arrive somehow.
 *
 * Unknown-host guard: `parseEmbedUrl` returns `null` for anything outside
 * the YouTube/Vimeo allowlist. We log a dev-only `console.warn` and
 * render a neutral DOM fallback — never inject a raw URL into an
 * iframe/src attribute.
 */
export function VideoBlock({
  value,
  className,
  articleSlug,
  videoPosition,
}: VideoBlockProps) {
  const analyticsContext = useMemo(
    () => resolveAnalyticsContext(articleSlug, videoPosition),
    [articleSlug, videoPosition],
  );
  const embed =
    typeof value.embedUrl === "string" && value.embedUrl.length > 0
      ? value.embedUrl
      : null;
  if (embed !== null)
    return renderEmbed(value, embed, className, analyticsContext);
  return renderUpload(value, className, analyticsContext);
}

// ─── Width wrapper ──────────────────────────────────────────────────────

function WidthWrapper({
  width,
  children,
  className,
}: {
  width: ResolvedWidth;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-video-width={width}
      style={WIDTH_STYLE[width]}
      className={cn("my-8", WIDTH_WRAPPER_CLASS[width], className)}
    >
      {children}
    </div>
  );
}

// ─── Upload path ────────────────────────────────────────────────────────

function renderUpload(
  value: VideoBlockValue,
  className: string | undefined,
  analyticsContext: AnalyticsContext | null,
) {
  const src = value.videoAsset?.url;
  if (typeof src !== "string" || src.length === 0) return null;
  const mimeType = value.videoAsset?.mimeType ?? undefined;
  const width = resolveWidth(value);
  const posterUrl =
    typeof value.videoPosterUrl === "string" && value.videoPosterUrl.length > 0
      ? value.videoPosterUrl
      : undefined;
  const caption = trimmedCaption(value);
  // Bleed suppresses the tape (locked width-rules table).
  const tape: TapeStripProps | undefined =
    width === "bleed" ? undefined : VIDEO_TAPE;
  return (
    <WidthWrapper width={width} className={className}>
      <TapedFigure
        aspect="landscape-16-9"
        bg="cream"
        tint="none"
        tape={tape}
        caption={caption ?? undefined}
      >
        <UploadFigureContent
          src={src}
          mimeType={mimeType}
          posterUrl={posterUrl}
          analyticsContext={analyticsContext}
        />
      </TapedFigure>
      {/* Hidden marker for tests/data-attrs — TapedFigure renders a
          <figure> already, this lets callers query the source/path. */}
      <span
        hidden
        data-testid="video-block"
        data-source="upload"
        data-video-width={width}
      />
    </WidthWrapper>
  );
}

interface UploadFigureContentProps {
  src: string;
  mimeType: string | undefined;
  posterUrl: string | undefined;
  analyticsContext: AnalyticsContext | null;
}

function UploadFigureContent({
  src,
  mimeType,
  posterUrl,
  analyticsContext,
}: UploadFigureContentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { trackVideoPlay, trackVideoComplete } = useVideoAnalytics();

  const handlePlayClick = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePlay = useCallback(() => {
    if (analyticsContext === null) return;
    trackVideoPlay({
      articleSlug: analyticsContext.articleSlug,
      videoSource: "upload",
      videoProvider: "native",
      videoPosition: analyticsContext.videoPosition,
    });
  }, [analyticsContext, trackVideoPlay]);

  const handleEnded = useCallback(() => {
    if (analyticsContext === null) return;
    trackVideoComplete({
      articleSlug: analyticsContext.articleSlug,
      videoSource: "upload",
      videoProvider: "native",
      videoPosition: analyticsContext.videoPosition,
    });
  }, [analyticsContext, trackVideoComplete]);

  return (
    <div className="bg-ink relative h-full w-full">
      {!isPlaying && posterUrl && (
        // `pointer-events-none` keeps the poster non-interactive so that
        // the pill below is the only click target (per videoblock-locked
        // §"Visibility on first paint").
        <Image
          src={posterUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 1040px"
          className="pointer-events-none object-cover"
          data-testid="video-block-poster"
        />
      )}
      {!isPlaying && (
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label="Speel video af"
          data-testid="video-block-play-pill"
          // Canonical paper-stamped pill: jersey-deep + ink border +
          // offset shadow + canonical press-down hover per
          // `feedback_canonical_press_down_hover`.
          className={cn(
            "absolute bottom-4 left-4 z-10 inline-flex h-9 items-center gap-2",
            "border-ink bg-jersey-deep border px-4",
            "text-cream font-mono text-[11px] tracking-[0.14em] uppercase",
            "shadow-paper-sm",
            "transition-all duration-300",
            "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
          )}
        >
          <PlayTriangleIcon className="h-3.5 w-3.5" />
          Afspelen
        </button>
      )}
      {isPlaying && (
        <video
          autoPlay
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full"
          data-testid="video-block-video"
          onPlay={handlePlay}
          onEnded={handleEnded}
        >
          <source src={src} type={mimeType ?? "video/mp4"} />
          Je browser ondersteunt geen HTML5-video. Download het bestand via de
          link.
        </video>
      )}
    </div>
  );
}

function PlayTriangleIcon({ className }: { className?: string }) {
  // Locked glyph (videoblock-locked.md §"Play affordance contract"):
  // M8 5v14l11-7z, 24×24 viewBox, fill="currentColor".
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

// ─── Embed path ─────────────────────────────────────────────────────────

const assertNever = (value: never): never => {
  throw new Error(`Unhandled VideoProvider: ${JSON.stringify(value)}`);
};

function embedSrc(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}`;
    default:
      return assertNever(provider);
  }
}

function embedTitle(provider: VideoProvider): string {
  switch (provider) {
    case "youtube":
      return "YouTube-video";
    case "vimeo":
      return "Vimeo-video";
    default:
      return assertNever(provider);
  }
}

function renderEmbed(
  value: VideoBlockValue,
  url: string,
  className: string | undefined,
  analyticsContext: AnalyticsContext | null,
) {
  const width = resolveWidth(value);
  const caption = trimmedCaption(value);
  const parsed = parseEmbedUrl(url);
  if (parsed === null) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[VideoBlock] Unknown embed URL provider — refusing to render an iframe. Allowed: YouTube, Vimeo.",
      );
    }
    return (
      <WidthWrapper width={width} className={className}>
        <figure
          className="border-ink bg-cream-soft border-2 p-6 text-center"
          data-testid="video-block"
          data-source="embed-unknown"
        >
          <p className="text-ink-soft text-sm">
            Video-embed (provider niet ondersteund). Controleer of de link van
            YouTube of Vimeo komt.
          </p>
        </figure>
      </WidthWrapper>
    );
  }

  const src = embedSrc(parsed.provider, parsed.videoId);
  const tape: TapeStripProps | undefined =
    width === "bleed" ? undefined : VIDEO_TAPE;
  return (
    <WidthWrapper width={width} className={className}>
      <TapedFigure
        aspect="landscape-16-9"
        bg="cream"
        tint="none"
        tape={tape}
        caption={caption ?? undefined}
      >
        <EmbedIframe
          src={src}
          title={embedTitle(parsed.provider)}
          provider={parsed.provider}
          analyticsContext={analyticsContext}
        />
      </TapedFigure>
      <span
        hidden
        data-testid="video-block"
        data-source="embed"
        data-provider={parsed.provider}
        data-video-width={width}
      />
    </WidthWrapper>
  );
}

interface EmbedIframeProps {
  src: string;
  title: string;
  provider: VideoProvider;
  analyticsContext: AnalyticsContext | null;
}

function EmbedIframe({
  src,
  title,
  provider,
  analyticsContext,
}: EmbedIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { trackVideoPlay } = useVideoAnalytics();

  useEffect(() => {
    if (analyticsContext === null) return;
    const handleBlur = () => {
      if (
        iframeRef.current !== null &&
        document.activeElement === iframeRef.current
      ) {
        trackVideoPlay({
          articleSlug: analyticsContext.articleSlug,
          videoSource: "embed",
          videoProvider: provider,
          videoPosition: analyticsContext.videoPosition,
        });
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [analyticsContext, provider, trackVideoPlay]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="absolute inset-0 h-full w-full border-0"
      data-testid="video-block-iframe"
    />
  );
}
