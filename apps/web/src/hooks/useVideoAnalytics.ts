import { useCallback, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

export type VideoSource = "upload" | "embed";
export type VideoProvider = "native" | "youtube" | "vimeo";

interface VideoEventInput {
  articleSlug: string;
  videoSource: VideoSource;
  videoProvider: VideoProvider;
  /** 1-indexed position of this `videoBlock` within the article body. */
  videoPosition: number;
}

/**
 * Per-instance analytics for a single `<VideoBlock>`. Each VideoBlock owns
 * its own hook instance, so the play dedup ref guarantees one
 * `article_video_play` per video per page view — covering both the upload
 * `play` event and the embed iframe-focus heuristic.
 *
 * The privacy contract is the same as the rest of the analytics surface:
 * only the `article_slug` identifies the article. No raw or hashed Sanity
 * `_id`s, no filenames, no asset URLs in the payload.
 *
 * `article_video_complete` is emitted on the upload `ended` event only.
 * Provider iframes (YouTube/Vimeo) do not expose an end-of-playback signal
 * without postMessage wiring (`YT.Player`, Vimeo Player SDK), which is
 * explicitly out of scope per `docs/prd/article-video-support.md` §4.
 */
export function useVideoAnalytics() {
  const playFiredRef = useRef(false);

  const trackVideoPlay = useCallback(
    ({
      articleSlug,
      videoSource,
      videoProvider,
      videoPosition,
    }: VideoEventInput) => {
      if (playFiredRef.current) return;
      playFiredRef.current = true;
      trackEvent("article_video_play", {
        article_slug: articleSlug,
        video_source: videoSource,
        video_provider: videoProvider,
        video_position: videoPosition,
      });
    },
    [],
  );

  const trackVideoComplete = useCallback(
    ({
      articleSlug,
      videoSource,
      videoProvider,
      videoPosition,
    }: VideoEventInput) => {
      trackEvent("article_video_complete", {
        article_slug: articleSlug,
        video_source: videoSource,
        video_provider: videoProvider,
        video_position: videoPosition,
      });
    },
    [],
  );

  return { trackVideoPlay, trackVideoComplete };
}
