import type React from "react";

/**
 * Retro-terrace-fanzine design tokens for the /share Instagram templates.
 *
 * These mirror the global `@theme` tokens in `apps/web/src/app/globals.css`
 * (Phase 9 §5 colour map). They are duplicated here as concrete literals on
 * purpose: the templates are captured client-side with `html-to-image`, which
 * inlines computed styles — keeping concrete values (not `var(--…)`) inline is
 * the proven, capture-safe pattern for this surface. Reference tokens by name
 * (`TOKENS.jerseyDeep`) — never hard-code a raw hex inside a template.
 */
export const TOKENS = {
  cream: "#f5f1e6",
  creamSoft: "#ede8da",
  creamDeep: "#e1d7bf",
  ink: "#0a0a0a",
  inkSoft: "#1f1f1f",
  inkMuted: "#6b6b6b",
  jersey: "#4acf52",
  jerseyDeep: "#008755",
  jerseyDeepDark: "#133d28",
  warm: "#f0c264",
  /** `--color-card-red` — the "brick" accent for negative sentiment. */
  brick: "#c93f1c",
  paperEdge: "#d9d2bd",
} as const;

/**
 * Freight Display stack — already loaded via the existing Adobe Typekit kit
 * (`--font-display`). Replaces the retired Quasimoda `TITLE_FONT`.
 */
export const DISPLAY_FONT: React.CSSProperties["fontFamily"] =
  '"freight-display-pro", georgia, "Times New Roman", serif';

/** Freight Sans Pro body stack — loaded via the Adobe Typekit kit (#2174,
 *  replaced the retired Montserrat `--font-montserrat`). */
export const BODY_FONT: React.CSSProperties["fontFamily"] =
  '"freight-sans-pro", "Helvetica Neue", Arial, sans-serif';

/** IBM Plex Mono stack (next/font `--font-ibm-plex-mono`) for mono labels. */
export const MONO_FONT: React.CSSProperties["fontFamily"] =
  "var(--font-ibm-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

/**
 * Paper-grain newsprint texture as an inline SVG data-URL. Same-origin, so it
 * captures cleanly through `html-to-image` (unlike remote assets).
 */
export const GRAIN_DATA_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")";

/** KCVV club crest (local asset — crisp + same-origin for capture). */
export const KCVV_LOGO = "/images/logos/kcvv-logo.png";

/** 9:16 Story canvas (Instagram Stories). */
export const CAPTURE_WIDTH = 1080;
export const CAPTURE_HEIGHT = 1920;

/** 1:1 Square canvas (Instagram feed posts) — pre-game + result only. */
export const SQUARE_SIZE = 1080;

export const TEMPLATE_SCALE = 0.25;

export const PREVIEW_WIDTH = CAPTURE_WIDTH * TEMPLATE_SCALE; // 270
export const PREVIEW_HEIGHT = CAPTURE_HEIGHT * TEMPLATE_SCALE; // 480
export const SQUARE_PREVIEW = SQUARE_SIZE * TEMPLATE_SCALE; // 270
