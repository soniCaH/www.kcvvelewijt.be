/**
 * Parse a YouTube / Vimeo URL into `{ provider, videoId }`.
 *
 * Returns `null` for:
 * - Non-HTTPS schemes (http, ftp, javascript, data, etc.)
 * - Unknown hosts (anything outside YouTube / Vimeo)
 * - Malformed URLs (unparseable via `URL()`)
 * - URLs with the right host but no extractable video ID
 *
 * Locked to YouTube + Vimeo per the article-video-support PRD Phase 2
 * scope (#1364). Extending to other providers needs: a new branch here,
 * a corresponding iframe host on the serializer, an updated Storybook
 * story, and a CSP review.
 */
export type VideoProvider = "youtube" | "vimeo";

export interface ParsedEmbed {
  provider: VideoProvider;
  videoId: string;
}

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{6,32}$/;
const VIMEO_ID_RE = /^\d{5,15}$/;

function parseYoutube(url: URL): ParsedEmbed | null {
  const host = url.hostname.toLowerCase();
  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return YOUTUBE_ID_RE.test(id) ? { provider: "youtube", videoId: id } : null;
  }
  // youtube.com/watch?v=<id>, www.youtube.com/watch?v=<id>
  if (host === "youtube.com" || host === "www.youtube.com") {
    // /watch?v=<id>
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") ?? "";
      return YOUTUBE_ID_RE.test(id)
        ? { provider: "youtube", videoId: id }
        : null;
    }
    // /embed/<id>, /shorts/<id>, /live/<id>
    const embedMatch = /^\/(embed|shorts|live)\/([A-Za-z0-9_-]+)/.exec(
      url.pathname,
    );
    if (embedMatch) {
      const id = embedMatch[2];
      return YOUTUBE_ID_RE.test(id)
        ? { provider: "youtube", videoId: id }
        : null;
    }
  }
  return null;
}

function parseVimeo(url: URL): ParsedEmbed | null {
  const host = url.hostname.toLowerCase();
  if (host !== "vimeo.com" && host !== "www.vimeo.com") return null;
  // vimeo.com/<numericId> — the first path segment must be all digits.
  // Ignore trailing segments (album slugs, review hashes, etc.).
  const first = url.pathname.replace(/^\//, "").split("/")[0];
  return VIMEO_ID_RE.test(first) ? { provider: "vimeo", videoId: first } : null;
}

export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  return parseYoutube(url) ?? parseVimeo(url);
}
