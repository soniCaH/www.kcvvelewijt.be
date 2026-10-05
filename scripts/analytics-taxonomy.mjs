/**
 * Analytics taxonomy — single source of truth (issue #1974).
 *
 * Both `create-ga4-dimensions.mjs` (GA4 custom dimensions) and `sync-gtm.mjs`
 * (GTM trigger regex + Data Layer Variables + GA4 Event-tag param rows) import
 * from here, so the two can never drift.
 *
 * GROUND TRUTH = code. Every entry below is enumerated from the `trackEvent`
 * calls, `use*Analytics` hooks, and `<PageViewTracker>` / `<TrackInView>` /
 * `<EditorialHubAnalytics>` `eventName=` literals in `apps/web/src`. When the
 * code changes an event/param, update this file — not the scripts.
 *
 * `parameterName` is the **dataLayer key** the code actually pushes, so a
 * GTM Data Layer Variable reading that key maps 1:1 into the GA4 param of the
 * same name. Pre-existing GA4 dimensions / DLVs whose key is NOT listed here
 * (e.g. legacy `match_status`, `target_id`, `source_entity_type`) surface in
 * `sync-gtm.mjs`'s read-only orphan report — they are never auto-deleted.
 */

/**
 * Event-name prefixes, in canonical order. The live GTM "Custom Event — KCVV
 * Analytics" trigger's Event-name RegEx must equal `buildTriggerRegex()`
 * byte-for-byte. Each token is the leading segment of one event family fired
 * by the app; `article_` also covers `article_video_*` (substring match).
 *
 * Dropped vs the old canonical (verified zero code matches 2026-06-21):
 *   homepage_, directions_, firstteam_strip_, article_video_ (redundant).
 */
export const prefixes = [
  "responsibility_",
  "search_",
  "organigram_",
  "related_content_",
  "related_article_",
  "article_",
  "event_",
  "player_",
  "match_",
  "team_",
  "clubshop_banner_",
  "kalender_",
  "sponsor_",
  "banner_",
  "nav_",
  "footer_",
  "jeugd_",
  "hub_",
  "board_",
  "geschiedenis_",
  "ultras_",
  "membership_",
  "error_",
  "gallery_",
  // `<EmptyState>`'s mandatory undo (#2691). `empty_state_undo` only —
  // reuses the already-registered `source` dimension ("Interaction source")
  // for which of the five surfaces rendered the undo, and the already-
  // registered `filter_type` dimension for the facet that was active. No
  // new custom dimensions (review round 1: an earlier version minted a new
  // `surface` dimension, which would have taken this list past GA4's 50
  // event-scoped-dimension cap).
  "empty_state_",
  // `/inhoud`, the contents page (#2622). `inhoud_view` +
  // `inhoud_entry_click`; the click reuses the already-registered `category`
  // (which of the four groups) and `position` (rank inside it) dimensions, so
  // this prefix is the whole taxonomy change — no new custom definitions.
  "inhoud_",
  // Homepage identity band (#3417). `identity_band_click` only; reuses the
  // already-registered `cta` dimension (`word_lid` / `onze_club`) — no new
  // custom definitions.
  "identity_band_",
];

/** The canonical GTM Custom-Event trigger RegEx (prefixes joined with `|`). */
export function buildTriggerRegex() {
  return prefixes.join("|");
}

/**
 * GA4 custom-dimension parameters (EVENT scope). `parameterName` is the
 * dataLayer key; `displayName` is the GA4 UI label. Grouped by event family
 * for review; order does not matter to either script.
 */
export const params = [
  // ── Search / organigram / responsibility (hub) ──────────────────────────
  { parameterName: "role", displayName: "Role" },
  { parameterName: "query_text", displayName: "Query text" },
  { parameterName: "query_length", displayName: "Query length" },
  { parameterName: "results_count", displayName: "Results count" },
  { parameterName: "had_results", displayName: "Had results" },
  { parameterName: "filter_type", displayName: "Filter type" },
  { parameterName: "result_type", displayName: "Result type" },
  { parameterName: "result_title", displayName: "Result title" },
  { parameterName: "path_id", displayName: "Path ID" },
  { parameterName: "category", displayName: "Category" },
  { parameterName: "position", displayName: "Position" },
  { parameterName: "contact_type", displayName: "Contact type" },
  { parameterName: "dwell_seconds", displayName: "Dwell seconds" },
  { parameterName: "step_index", displayName: "Step index" },
  { parameterName: "node_id", displayName: "Node ID hashed" },
  { parameterName: "view", displayName: "View" },
  { parameterName: "source", displayName: "Interaction source" },
  { parameterName: "department", displayName: "Department" },
  { parameterName: "member_id", displayName: "Member ID hashed" },
  // ── Related content ─────────────────────────────────────────────────────
  { parameterName: "target_type", displayName: "Target type" },
  { parameterName: "target_slug", displayName: "Target slug" },
  { parameterName: "content_types", displayName: "Content types" },
  { parameterName: "count", displayName: "Content count" },
  { parameterName: "page_type", displayName: "Page type" },
  { parameterName: "page_slug", displayName: "Page slug" },
  // ── Articles ────────────────────────────────────────────────────────────
  { parameterName: "article_type", displayName: "Article type" },
  { parameterName: "article_id_hashed", displayName: "Article ID hashed" },
  { parameterName: "article_slug", displayName: "Article slug" },
  { parameterName: "has_subject", displayName: "Has subject" },
  { parameterName: "subject_kind", displayName: "Subject kind" },
  { parameterName: "subject_count", displayName: "Subject count" },
  { parameterName: "channel", displayName: "Share channel" },
  { parameterName: "related_article_id_hashed", displayName: "Related article ID hashed" },
  // ── Article video ───────────────────────────────────────────────────────
  { parameterName: "video_source", displayName: "Video source" },
  { parameterName: "video_provider", displayName: "Video provider" },
  { parameterName: "video_position", displayName: "Video position" },
  // ── Events (article surface + detail) ───────────────────────────────────
  { parameterName: "event_type", displayName: "Event type" },
  { parameterName: "event_slug", displayName: "Event slug" },
  { parameterName: "event_date", displayName: "Event date" },
  { parameterName: "has_ticket_url", displayName: "Has ticket URL" },
  { parameterName: "cta", displayName: "CTA" },
  // ── Player / match / team ───────────────────────────────────────────────
  { parameterName: "player_slug", displayName: "Player slug" },
  { parameterName: "match_id", displayName: "Match ID" },
  { parameterName: "status", displayName: "Match status" },
  { parameterName: "team_slug", displayName: "Team slug" },
  // ── Clubshop banner ─────────────────────────────────────────────────────
  { parameterName: "destination", displayName: "Destination" },
  // ── Kalender ────────────────────────────────────────────────────────────
  { parameterName: "kalender_type", displayName: "Kalender type" },
  { parameterName: "teams_count", displayName: "Teams count" },
  { parameterName: "side", displayName: "Match side" },
  // `kalender_subscribe_copy`'s `events` param (#2705, club-activities
  // switch) mints no dimension of its own — GA4's 50 event-scoped-dimension
  // cap is already exceeded (see the #2419/#2400 note below), so it rides
  // `event_name` instead. Do not re-add it.
  // ── Sponsors ────────────────────────────────────────────────────────────
  { parameterName: "sponsor_id", displayName: "Sponsor ID hashed" },
  { parameterName: "tier", displayName: "Sponsor tier" },
  // ── Global chrome + homepage banners (#2419 / #2400) ────────────────────
  // No new params: `nav_link_click` / `footer_link_click` reuse `destination`
  // + `source` + `category` (the footer column), and `banner_impression` /
  // `banner_click` reuse `position` (the a/b/c slot) + `destination`. GA4 caps
  // event-scoped custom dimensions at 50 and this list is already past it, so
  // these families deliberately mint none — `event_name` segments them.
  // Note `position` is a 1-indexed rank everywhere else (search results, hub
  // rows); the banner families overload it with the a/b/c slot letter, which
  // matches the Sanity field names (`bannerSlotA`) an editor would change.
  // Any report on `position` therefore has to filter by `event_name` first.
  // `nav_parent_click` (#2570, the up-link to a route's structural parent)
  // is the same shape: no new params, `page_slug` (the source route) +
  // `destination` (the parent href), both already registered above — the
  // 50-dimension cap this family is already past applies here too.
  // ── Jeugd nav hub ───────────────────────────────────────────────────────
  { parameterName: "card_type", displayName: "Card type" },
  { parameterName: "tag", displayName: "Card tag" },
  // ── Board ───────────────────────────────────────────────────────────────
  { parameterName: "board", displayName: "Board" },
  // ── Error pages ─────────────────────────────────────────────────────────
  { parameterName: "error_code", displayName: "Error code" },
  { parameterName: "path", displayName: "Path" },
  { parameterName: "action", displayName: "Error action" },
  // ── Gallery ─────────────────────────────────────────────────────────────
  { parameterName: "gallery_slug", displayName: "Gallery slug" },
  { parameterName: "image_count", displayName: "Image count" },
  { parameterName: "image_index", displayName: "Image index" },
  // ── Membership form (conversion — added #1974) ──────────────────────────
  { parameterName: "is_minor", displayName: "Is minor" },
  { parameterName: "has_prior_club", displayName: "Has prior club" },
];
