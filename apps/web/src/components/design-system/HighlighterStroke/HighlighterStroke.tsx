import { buildStrokeDataUrl, type HighlighterStrokeColor } from "./strokes";

export type { HighlighterStrokeColor } from "./strokes";

export interface HighlighterStrokeProps {
  /**
   * Stroke colour. Defaults to brand jersey green. Other brand colours
   * (jersey-deep / ink / cream) ship for consumers that need a contrast
   * accent against a non-default surface.
   */
  color?: HighlighterStrokeColor;
  children: React.ReactNode;
}

export function HighlighterStroke({
  color = "jersey",
  children,
}: HighlighterStrokeProps) {
  const dataUrl = buildStrokeDataUrl(color);
  return (
    <span
      data-highlighter-stroke="true"
      data-color={color}
      style={{
        backgroundImage: `url("${dataUrl}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 88%",
        backgroundSize: "100% 0.4em",
        paddingBottom: "0.1em",
        // box-decoration-break: clone makes the browser repeat the
        // background per visual line when the span wraps — see PRD §10 Q3
        // ADR (closes #1543). Webkit prefix kept for older Safari.
        WebkitBoxDecorationBreak: "clone",
        boxDecorationBreak: "clone",
      }}
    >
      {children}
    </span>
  );
}
