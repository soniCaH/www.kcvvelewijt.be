import type React from "react";

/** Quasimoda title font stack for share templates (inline style usage). */
export const TITLE_FONT: React.CSSProperties["fontFamily"] =
  "quasimoda, -apple-system, system-ui, Montserrat, Verdana, sans-serif";

/** Montserrat body font stack for share templates (inline style usage). */
export const BODY_FONT: React.CSSProperties["fontFamily"] =
  'montserrat, "Helvetica Neue", Arial, sans-serif';

export const CAPTURE_WIDTH = 1080;
export const CAPTURE_HEIGHT = 1920;

export const TEMPLATE_SCALE = 0.25;

export const PREVIEW_WIDTH = CAPTURE_WIDTH * TEMPLATE_SCALE; // 270
export const PREVIEW_HEIGHT = CAPTURE_HEIGHT * TEMPLATE_SCALE; // 480
