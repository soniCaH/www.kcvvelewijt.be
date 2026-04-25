# PRD: Article Video Support

**Status:** draft
**Owner:** Kevin Van Ransbeeck
**Related work:** article-detail redesign milestone (#37), `ArticleBodyMotion` from PR #1359

## 1. Problem Statement

Editors currently have no way to include video in an article. Match highlights, trainer interviews, the occasional eventFact clip — any moving image we want to surface today has to live somewhere external and be linked out as text, which defeats the article as a self-contained narrative unit. The club does **not** publish to YouTube or any paid video host, and at 1–2 video clips every few months there is no appetite to introduce a recurring cost. The redesign of the article detail page (announcement, interview, transfer, event templates) otherwise looks finished but conspicuously lacks motion content.

## 2. Scope

**Packages touched:**

- `packages/sanity-schemas` — new `videoBlock` object type, added to `article.body` `of:` list
- `apps/studio` & `apps/studio-staging` — no code change (schemas flow through `@kcvv/sanity-schemas`) but both Studios must be deployed after schema lands
- `apps/web` — new `<VideoBlock>` PortableText serializer under `src/components/article/`, analytics event, seed script

**Explicitly OUT of scope:**

- Mux, Cloudflare Stream, Bunny Stream, or any other paid video delivery service
- Uploading a video directly from the mobile camera within Studio (browser-side transcoding)
- Automatic thumbnail generation from the video file — editors upload a poster image manually
- Adaptive bitrate / HLS streaming — single MP4 source by design
- DRM, age-gating, geo-restricting
- Subtitles / closed captions (tracked as a future follow-up once the primary flow exists)
- Video inside non-article documents (team, player, page) — only articles for now
- Replacing the existing `articleImage` / `fileAttachment` blocks

## 3. Tracer Bullet

A `videoBlock` PortableText type with a single `uploadedFile` field (Sanity file asset, `accept=video/mp4`), registered in `article.body` `of:`, rendered in `apps/web` via a `<VideoBlock>` serializer as a bare `<video controls>` tag pointing at the Sanity asset URL. One seeded staging article exists at a known slug containing a single `videoBlock` with a small (~5 MB) test MP4. No embed URL, no poster, no caption, no analytics, no lazy-load — the thinnest possible slice proving: **Sanity file upload → Sanity CDN → HTML5 video playback inside an article**.

## 4. Phases

```text
Phase 1: videoBlock schema + upload-only render (tracer bullet)          — #1363
Phase 2: Embed URL escape hatch (YouTube/Vimeo) + XOR validation         — #1364 (blocked by #1363)
Phase 3: Poster image, caption, lazy-load, fullBleed, size guard         — #1365 (blocked by #1363)
Phase 4: Analytics instrumentation (play, milestones)                    — #1366 (blocked by #1364, #1365)
```

Phases 2 and 3 are independent after the tracer bullet — they could be worked in parallel, and neither blocks the other. Phase 4 waits for both so the event taxonomy can distinguish `video_source=upload` vs `video_source=embed` from the start.

## 5. Acceptance Criteria per Phase

### Phase 1 — videoBlock schema + upload-only render (tracer bullet)

- [ ] `packages/sanity-schemas/src/videoBlock.ts` defines a new `videoBlock` object type with a required `uploadedFile` field (`type: file`, `options: { accept: 'video/mp4,video/webm' }`) and is exported from `packages/sanity-schemas/src/index.ts`
- [ ] `article.body` `of:` includes `{type: 'videoBlock'}`
- [ ] Both `apps/studio` and `apps/studio-staging` pick up the new type via `@kcvv/sanity-schemas` with no per-Studio edits
- [ ] GROQ projection for `article.body` in `apps/web` resolves the file asset URL (`asset->url`)
- [ ] `<VideoBlock>` serializer in `apps/web/src/components/article/VideoBlock/` renders a `<video controls>` with the asset URL as `src`
- [ ] Serializer registered in `SanityArticleBody`'s `components.types.videoBlock`
- [ ] Seed script `apps/web/scripts/seed-video-article.ts` (staging target) creates a demo article at a known slug containing one `videoBlock` with an uploaded test MP4; PR body documents the `_id` and staging URL
- [ ] Vitest test: `<VideoBlock>` with a valid asset URL renders a `<video>` element with the expected `src`
- [ ] Vitest test: `<VideoBlock>` with missing asset returns `null` (no crash)
- [ ] Storybook story `Features/Articles/VideoBlock` — Playground + `UploadOnly` variant
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Embed URL escape hatch + XOR validation

- [ ] `videoBlock` schema gains an optional `embedUrl` field (`type: url`, validation allows only `https://` with `youtube.com`, `youtu.be`, or `vimeo.com` hosts)
- [ ] Sanity validation: exactly one of `uploadedFile` or `embedUrl` must be present — the other must be absent. Enforced via `Rule.custom((_, context) => ...)` returning a clear error message ("Upload a file or paste an embed URL, not both.")
- [ ] Studio preview uses whichever field is populated (filename for upload, URL hostname for embed)
- [ ] `<VideoBlock>` serializer parses the provider from `embedUrl` via a pure `parseEmbedUrl(url)` helper that returns `{ provider: "youtube" | "vimeo", videoId: string } | null`
- [ ] `parseEmbedUrl` unit tests cover: standard YouTube watch URLs, youtu.be short URLs, Vimeo numeric-ID URLs, unsupported hosts (returns `null`)
- [ ] When `embedUrl` resolves to a known provider, serializer renders the provider's privacy-enhanced iframe (`youtube-nocookie.com` for YouTube, `player.vimeo.com` for Vimeo) inside a 16:9 aspect container
- [ ] When `embedUrl` is present but unrecognized, serializer renders a visible editor-facing warning in the browser console and a neutral fallback in the DOM (no iframe, no raw URL injected into HTML)
- [ ] Storybook stories added: `EmbedYoutube`, `EmbedVimeo`, `EmbedUnknownProvider`
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — Poster, caption, lazy-load, fullBleed, size guard

- [ ] `videoBlock` schema gains `poster` (optional `image`, with `options.hotspot: true`), `caption` (optional `string`), `fullBleed` (boolean, default `false`, mirrors `articleImage`)
- [ ] Sanity validation: soft warning when `uploadedFile` size exceeds 150 MB — "Dit bestand is erg groot. Encodeer naar 1080p H.264 ~2–3 Mbps voor je uploadt." (non-blocking, editor can still save)
- [ ] `<VideoBlock>` with `uploadedFile` renders `<video controls preload="none" poster={posterUrl}>` — no MP4 bytes downloaded until a reader interacts
- [ ] `<VideoBlock>` with `embedUrl` renders the provider iframe with `loading="lazy"`
- [ ] `caption` rendered as `<figcaption>` below the video, typographic styling aligned with the existing `articleImage` caption pattern (confirm exact tokens during implementation; add to Foundation/Typography if new)
- [ ] `fullBleed=true` applies the `full-bleed` class and removes `rounded-[4px]` (matches `articleImage` full-bleed behavior)
- [ ] `fullBleed=false` (default) renders rounded `4px` corners matching the announcement template hero
- [ ] `ArticleBodyMotion` fade-up still activates on the surrounding `<figure>` without breaking video playback
- [ ] Storybook stories added: `WithPosterAndCaption`, `FullBleed`
- [ ] Visual verification across all article templates (`AnnouncementTemplate`, `InterviewTemplate`, plus `TransferTemplate` / `EventTemplate` if they have landed by this phase)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 — Analytics instrumentation

- [ ] New event `article_video_play` fired on first `play` event per video per page view, with parameters:
  - `article_slug` (string)
  - `video_source` (`"upload"` or `"embed"`)
  - `video_provider` (`"native"` for uploads, `"youtube"` or `"vimeo"` for embeds)
  - `video_position` (integer — position of this `videoBlock` within the article body, 1-indexed)
- [ ] New event `article_video_complete` fired on the `ended` event (upload path only — provider iframes do not expose `ended` without postMessage wiring, which is out of scope)
- [ ] Dedup guard: firing `article_video_play` twice for the same video in one page view is forbidden; `play` events after the first no-op on the client
- [ ] Hook pattern matches existing `src/hooks/use*Analytics.ts` conventions; no PII (no raw Sanity `_id`s, no filenames containing player names)
- [ ] GTM trigger/tag updated; `video_source`, `video_provider`, `video_position` registered as DLVs + GA4 custom dimensions
- [ ] Vitest: analytics test asserts the privacy-correct parameter shape (slug only, no IDs), not the wire format
- [ ] Vitest regression test for the dedup guard (fires exactly once across multiple `play` events)
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 5b. Analytics (Phase 4 — #1366)

**Event taxonomy.** Two events fire from `<VideoBlock>` on article surfaces only (`/nieuws/[slug]`); both omitted when the block lives outside an article (staff bio, club page).

| Event                    | Trigger                         | Path supported |
| ------------------------ | ------------------------------- | -------------- |
| `article_video_play`     | First user engagement per video | upload + embed |
| `article_video_complete` | `<video>` `ended` event         | upload only    |

Both events carry the same parameter shape:

| Parameter        | Type    | Values                                                         |
| ---------------- | ------- | -------------------------------------------------------------- |
| `article_slug`   | string  | The host article's URL slug                                    |
| `video_source`   | string  | `"upload"` or `"embed"`                                        |
| `video_provider` | string  | `"native"` (uploads) / `"youtube"` / `"vimeo"`                 |
| `video_position` | integer | 1-indexed position of the `videoBlock` within the article body |

**Privacy contract.** No raw or hashed Sanity `_id`s, no asset URLs, no original filenames. `article_slug` is the only article-level identifier — same posture as the rest of the analytics surface (`useArticleAnalytics`).

**Dedup.** `article_video_play` fires at most once per video per page view. The dedup ref lives inside `useVideoAnalytics` so each `<VideoBlock>` instance has its own counter; navigation between articles starts fresh.

**Embed engagement detection.** Provider iframes (YouTube/Vimeo) do not expose `play` / `ended` events without postMessage wiring (`YT.Player`, Vimeo Player SDK), which is explicitly out of scope. The serializer uses the standard `window` blur + `document.activeElement === iframe` heuristic to detect first interaction. This is best-effort by design; promoting to true play detection is a separate issue if/when the provider SDKs land.

**GTM / GA4 manual steps (publish-time).** All three new dimensions are created automatically via `scripts/create-ga4-dimensions.mjs`. GTM still needs three new Data Layer Variables (`video_source`, `video_provider`, `video_position`) and the GA4 Event tag must be extended with two trigger names (`article_video_play`, `article_video_complete`) and the three params mapped onto event-parameter fields. Documented in the #1366 PR body.

**GA4 exploration default.** One new "Video engagement" exploration with rows = `article_slug`, columns = `video_source`, values = play count + complete-rate (complete events / play events for `video_source = upload`). Per-article position breakdown is a secondary breakdown (`video_position`).

## 6. Effect Schema / api-contract Changes

**None for Phase 1–3.** Articles are served from Sanity via the existing `SanityService` — `videoBlock` flows through `PortableTextBlock[]` as an opaque object whose shape is handled by the PortableText serializer, not by a typed API contract. No new HttpApi endpoint, no `packages/api-contract` change.

Phase 4 analytics lives entirely in `apps/web` — the BFF is not involved.

One Sanity GROQ consideration: the article projection in `SanityService` must be verified to resolve `uploadedFile.asset->{ url, size, mimeType, originalFilename }` and `poster.asset->{ url, metadata { dimensions } }` — this is a projection update, not a schema change.

## 7. Open Questions

- [ ] **Caption typography tokens** — match the existing `articleImage` caption, or introduce a new Foundation token? Resolved during Phase 3 by checking `articleImage` rendering in `SanityArticleBody` and the Foundation/Typography story.
- [ ] **`fullBleed` motion interplay** — does `ArticleBodyMotion` still wrap `<figure>` elements correctly when the figure breaks out of the content column via `full-bleed`? Will be answered by tracer bullet + Phase 3 manual test.
- [ ] **Embed provider allowlist** — YouTube + Vimeo cover the expected use cases. Do we also want TikTok / Instagram / X embeds? **Default: no.** Needs user decision before Phase 2 planning locks. Each additional provider adds iframe CSP, privacy review, and parser work.
- [ ] **Reduced motion behavior** — do we auto-pause the native `<video>` when `prefers-reduced-motion: reduce` is set? Industry convention is no for user-initiated playback (the user pressed play), but yes for autoplay. **We do not plan to autoplay**, so this may be a non-issue. Verify during Phase 3.
- [ ] **Editor error path for "both fields set"** — Sanity's `Rule.custom` runs on publish; does it block the document from being saved (bad UX) or only from being published (preferred)? Will be answered by Phase 2 tracer implementation in Studio staging.
- [ ] **Staging seed ID documentation convention** — confirm the PR-body pattern used by the article-detail redesign seed scripts and mirror it. Will be resolved by reading the most recent similar PR during Phase 1.

## 8. Discovered Unknowns (filled during implementation)

- [2026-04-25] **Embed `play` detection without postMessage** — Phase 4 acceptance criteria requires `article_video_play` to fire for embeds, but the PRD §4 also forbids postMessage wiring. Resolved inline by using the documented `window` blur + `document.activeElement === iframe` heuristic. Best-effort; documented in §5b.

<!-- Appended during Ralph loop when implementation surfaces something unexpected. Format:
     - [YYYY-MM-DD] Discovered: <finding> → <action: new issue #N / PRD updated / resolved inline>
-->
