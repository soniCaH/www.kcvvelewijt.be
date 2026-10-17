import { trackEvent } from "@/lib/analytics/track-event";
import type { BlockLayout } from "./looks/block-layout";
import type {
  CoverMode,
  ShareFormat,
  ShareTheme,
  WashStep,
} from "./looks/look-parts";
import type { TemplateId } from "./looks/share-content";
import type { AnyLook, ShareMode } from "./SharePage/story-session";

/**
 * Analytics for `/share` (#3539, spec #3535): one `share_image_saved` per
 * story that left the tool — after `navigator.share` resolved, or when the
 * download link was clicked. Never on a cancelled share or a bare capture;
 * the caller decides when, this module decides what.
 *
 * `share_` is a prefix of its own in `scripts/analytics-taxonomy.mjs`.
 * `article_type` / `event_type` are registered dimensions; the other nine
 * are forwarded by the GA4 tag as unregistered params (`registered: false`
 * in the taxonomy): visible in DebugView, no custom dimension (the
 * 50-dimension cap is full).
 *
 * Privacy: no ids, slugs, names or titles — only the item's type and the
 * editor's style choices.
 */

/** The spec's template values: `TemplateId`s are kebab-case, GA4 snake_case. */
const TEMPLATE_PARAM: Record<TemplateId, string> = {
  kickoff: "kickoff",
  halftime: "halftime",
  "full-time": "full_time",
  "goal-kcvv": "goal_kcvv",
  "goal-opponent": "goal_opponent",
  "yellow-card-kcvv": "yellow_card_kcvv",
  "yellow-card-opponent": "yellow_card_opponent",
  "red-card-kcvv": "red_card_kcvv",
  "red-card-opponent": "red_card_opponent",
  "square-pre-game": "square_pregame",
  "square-result": "square_result",
};

export interface ShareImageSaved {
  mode: ShareMode;
  /** The article's or event's type; ignored for a match. */
  itemType: string | null;
  template: TemplateId;
  look: AnyLook;
  theme: ShareTheme;
  wash: WashStep;
  format: ShareFormat;
  coverMode: CoverMode;
  /** The saved format's layout. */
  blocks: BlockLayout;
  /** An AI picture or the event fallback filled the photo slot. */
  fallbackUsed: boolean;
}

export function trackShareImageSaved(saved: ShareImageSaved): void {
  const { mode, look } = saved;
  trackEvent("share_image_saved", {
    content_type: mode,
    ...(mode === "article" && { article_type: saved.itemType }),
    ...(mode === "event" && { event_type: saved.itemType }),
    ...(mode === "match" && { template: TEMPLATE_PARAM[saved.template] }),
    look,
    ...(look !== "wedstrijd" && { theme: saved.theme }),
    ...(look === "affiche" && { wash: saved.wash }),
    format: saved.format,
    ...(mode !== "match" && { cover_mode: saved.coverMode }),
    // A tap selects a block and writes {0, 0, voor}: only an offset or
    // Achter means the editor moved it.
    blocks_moved: Object.values(saved.blocks).some(
      (b) => b.x !== 0 || b.y !== 0 || b.layer === "achter",
    ),
    fallback_used: saved.fallbackUsed,
  });
}
