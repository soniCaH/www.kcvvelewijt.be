import { cn } from "@/lib/utils/cn";
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
}

export interface VideoBlockProps {
  value: VideoBlockValue;
  className?: string;
}

/**
 * Phase 1 (#1363) shipped the upload path. Phase 2 (#1364) adds the
 * embed path: YouTube and Vimeo URLs render in privacy-enhanced iframes
 * (`youtube-nocookie.com`, `player.vimeo.com`) inside a 16:9 container.
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
export function VideoBlock({ value, className }: VideoBlockProps) {
  const embed =
    typeof value.embedUrl === "string" && value.embedUrl.length > 0
      ? value.embedUrl
      : null;
  if (embed !== null) return renderEmbed(embed, className);
  return renderUpload(value, className);
}

// ─── Upload path (Phase 1 tracer, unchanged) ─────────────────────────────

function renderUpload(value: VideoBlockValue, className: string | undefined) {
  const src = value.videoAsset?.url;
  if (typeof src !== "string" || src.length === 0) return null;
  const mimeType = value.videoAsset?.mimeType ?? undefined;
  return (
    <figure
      className={cn("my-8 overflow-hidden rounded-lg bg-black", className)}
      data-testid="video-block"
      data-source="upload"
    >
      <video
        controls
        preload="metadata"
        className="aspect-video h-auto w-full"
        data-testid="video-block-video"
      >
        <source src={src} type={mimeType ?? "video/mp4"} />
        Je browser ondersteunt geen HTML5-video. Download het bestand via de
        link.
      </video>
    </figure>
  );
}

// ─── Embed path (Phase 2) ────────────────────────────────────────────────

function embedSrc(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "youtube":
      // Privacy-enhanced variant: doesn't set cookies until the reader
      // actually plays the video.
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}`;
  }
}

function embedTitle(provider: VideoProvider): string {
  switch (provider) {
    case "youtube":
      return "YouTube-video";
    case "vimeo":
      return "Vimeo-video";
  }
}

function renderEmbed(url: string, className: string | undefined) {
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
          "bg-kcvv-gray-light my-8 rounded-lg p-6 text-center",
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
      className={cn("my-8 overflow-hidden rounded-lg bg-black", className)}
      data-testid="video-block"
      data-source="embed"
      data-provider={parsed.provider}
    >
      {/* 16:9 responsive container — aspect-video + absolute-positioned
          iframe covers the full box. allow="…" enables in-frame
          fullscreen + picture-in-picture on providers that support it. */}
      <div className="relative aspect-video w-full">
        <iframe
          src={src}
          title={embedTitle(parsed.provider)}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
          data-testid="video-block-iframe"
        />
      </div>
    </figure>
  );
}
