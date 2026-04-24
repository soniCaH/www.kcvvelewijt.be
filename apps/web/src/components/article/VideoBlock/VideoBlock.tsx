import { cn } from "@/lib/utils/cn";

export interface VideoBlockValue {
  _type: "videoBlock";
  videoAsset?: {
    url?: string | null;
    size?: number | null;
    mimeType?: string | null;
    originalFilename?: string | null;
  } | null;
}

export interface VideoBlockProps {
  value: VideoBlockValue;
  className?: string;
}

/**
 * Phase 1 tracer (#1363). Renders a bare HTML5 `<video controls>` pointing
 * at the Sanity asset URL. Returns `null` when no asset resolves — the
 * page shouldn't crash on a block that slipped through publishing without
 * a file attached.
 *
 * Phase 2 will layer on provider iframes (YouTube/Vimeo) via an optional
 * `embedUrl` field; Phase 3 adds poster, caption, lazy-load and
 * fullBleed. This file will grow — keep each phase's additions under
 * its own commit so the tracer stays reviewable in isolation.
 */
export function VideoBlock({ value, className }: VideoBlockProps) {
  const src = value.videoAsset?.url;
  if (typeof src !== "string" || src.length === 0) return null;

  const mimeType = value.videoAsset?.mimeType ?? undefined;

  return (
    <figure
      className={cn("my-8 overflow-hidden rounded-lg bg-black", className)}
      data-testid="video-block"
    >
      {/* `controls` gives the reader start/stop without custom UI in the
          tracer. `preload="metadata"` mirrors the HTML default — Phase 3
          will switch to `"none"` with a poster so MP4 bytes only download
          on interaction. */}
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
