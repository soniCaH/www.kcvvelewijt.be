import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useVideoAnalytics } from "@/hooks/useVideoAnalytics";
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

/**
 * Phase 1 (#1363) shipped the upload path. Phase 2 (#1364) added the
 * embed path: YouTube and Vimeo URLs render in privacy-enhanced iframes
 * (`youtube-nocookie.com`, `player.vimeo.com`) inside a 16:9 container.
 * Phase 3 (#1365) layers on:
 *  - poster image (upload path) so the browser doesn't fetch any video
 *    bytes until the reader presses play (`preload="none"`)
 *  - optional `<figcaption>` underneath the video
 *  - `fullBleed` opt-in that drops the rounded corners and breaks out
 *    of the prose column via `.full-bleed` (mirrors `articleImage`)
 *
 * Phase 4 (#1366) wires `article_video_play` / `article_video_complete`
 * analytics. The upload path binds `onPlay` / `onEnded` directly. The
 * embed path uses a `window` blur + `document.activeElement === iframe`
 * heuristic — the standard fallback when provider postMessage APIs
 * (`YT.Player`, Vimeo Player SDK) are out of scope. Both paths require an
 * `articleSlug` + `videoPosition`; non-article surfaces (staff bio, club
 * page) omit them and emit no events.
 *
 * Exactly one of `videoAsset` / `embedUrl` is ever populated (enforced
 * by the Sanity XOR validator) — `embedUrl` takes precedence if both
 * happened to arrive somehow, since an explicit editor-authored link is
 * the most recent signal of intent.
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
  const analyticsContext = resolveAnalyticsContext(articleSlug, videoPosition);
  const embed =
    typeof value.embedUrl === "string" && value.embedUrl.length > 0
      ? value.embedUrl
      : null;
  if (embed !== null)
    return renderEmbed(value, embed, className, analyticsContext);
  return renderUpload(value, className, analyticsContext);
}

// ─── Shared figure helpers ──────────────────────────────────────────────

function figureClass(
  fullBleed: boolean,
  ...extra: Array<string | undefined>
): string {
  // Default rounded-[4px] corners match the announcement template hero
  // (#1365 PRD §5 Phase 3). `full-bleed` mirrors the `articleImage`
  // breakout, lifting the figure out of the prose column to 100vw and
  // dropping the rounded corners.
  return cn(
    "my-8 overflow-hidden bg-black",
    fullBleed ? "full-bleed rounded-none" : "rounded-[4px]",
    ...extra,
  );
}

function trimmedCaption(value: VideoBlockValue): string | null {
  if (typeof value.caption !== "string") return null;
  const trimmed = value.caption.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function VideoCaption({ caption }: { caption: string }) {
  // Light, unobtrusive caption styling. articleImage carries no caption
  // today, so there is no upstream pattern to mirror — kept restrained
  // (mt-3, sm body type, kcvv-gray-blue) so the video stays the focal
  // element. The caption sits inside the figure but visually below the
  // black media frame; it does not inherit `bg-black`.
  return (
    <figcaption
      data-testid="video-block-caption"
      className="text-kcvv-gray-blue bg-white px-1 pt-3 text-sm leading-relaxed"
    >
      {caption}
    </figcaption>
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
  const fullBleed = value.fullBleed === true;
  const posterUrl =
    typeof value.videoPosterUrl === "string" && value.videoPosterUrl.length > 0
      ? value.videoPosterUrl
      : undefined;
  const caption = trimmedCaption(value);
  return (
    <figure
      className={figureClass(fullBleed, className)}
      data-testid="video-block"
      data-source="upload"
    >
      <UploadVideo
        src={src}
        mimeType={mimeType}
        posterUrl={posterUrl}
        analyticsContext={analyticsContext}
      />
      {caption !== null && <VideoCaption caption={caption} />}
    </figure>
  );
}

interface UploadVideoProps {
  src: string;
  mimeType: string | undefined;
  posterUrl: string | undefined;
  analyticsContext: AnalyticsContext | null;
}

function UploadVideo({
  src,
  mimeType,
  posterUrl,
  analyticsContext,
}: UploadVideoProps) {
  const { trackVideoPlay, trackVideoComplete } = useVideoAnalytics();
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
    <video
      controls
      // Phase 3: poster is the only thing the browser fetches until
      // the reader actually presses play. preload="none" + a poster
      // image keeps the article weight tiny on first paint.
      preload="none"
      poster={posterUrl}
      className="aspect-video h-auto w-full"
      data-testid="video-block-video"
      onPlay={handlePlay}
      onEnded={handleEnded}
    >
      <source src={src} type={mimeType ?? "video/mp4"} />
      Je browser ondersteunt geen HTML5-video. Download het bestand via de link.
    </video>
  );
}

// ─── Embed path ─────────────────────────────────────────────────────────

const assertNever = (value: never): never => {
  throw new Error(`Unhandled VideoProvider: ${JSON.stringify(value)}`);
};

function embedSrc(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "youtube":
      // Privacy-enhanced variant: doesn't set cookies until the reader
      // actually plays the video.
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
  const fullBleed = value.fullBleed === true;
  const caption = trimmedCaption(value);
  const parsed = parseEmbedUrl(url);
  if (parsed === null) {
    // Log for editor visibility, render a neutral fallback. Crucially —
    // we never interpolate `url` into an iframe/src or an anchor href
    // without provider-matching, to avoid open-redirect / mixed-content
    // / javascript: URL risks.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[VideoBlock] Unknown embed URL provider — refusing to render an iframe. Allowed: YouTube, Vimeo.",
      );
    }
    return (
      <figure
        className={cn(
          "bg-kcvv-gray-light my-8 rounded-[4px] p-6 text-center",
          className,
        )}
        data-testid="video-block"
        data-source="embed-unknown"
      >
        <p className="text-kcvv-gray-dark text-sm">
          Video-embed (provider niet ondersteund). Controleer of de link van
          YouTube of Vimeo komt.
        </p>
      </figure>
    );
  }

  const src = embedSrc(parsed.provider, parsed.videoId);
  return (
    <figure
      className={figureClass(fullBleed, className)}
      data-testid="video-block"
      data-source="embed"
      data-provider={parsed.provider}
    >
      {/* 16:9 responsive container — aspect-video + absolute-positioned
          iframe covers the full box. allow="…" enables in-frame
          fullscreen + picture-in-picture on providers that support it. */}
      <div className="relative aspect-video w-full">
        <EmbedIframe
          src={src}
          title={embedTitle(parsed.provider)}
          provider={parsed.provider}
          analyticsContext={analyticsContext}
        />
      </div>
      {caption !== null && <VideoCaption caption={caption} />}
    </figure>
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
      // Standard heuristic for detecting embed-iframe interaction without
      // provider postMessage wiring: clicking the iframe blurs the parent
      // window and makes the iframe the active element. The hook's own
      // dedup ref guarantees we still fire `article_video_play` exactly
      // once even if the user clicks the iframe several times.
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
