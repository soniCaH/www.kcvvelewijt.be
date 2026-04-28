import { STROKES } from "./strokes";

export type HighlighterStrokeVariant = "a" | "b" | "c";

export interface HighlighterStrokeProps {
  variant?: HighlighterStrokeVariant;
  children: React.ReactNode;
}

export function HighlighterStroke({
  variant = "a",
  children,
}: HighlighterStrokeProps) {
  const dataUrl = `data:image/svg+xml;utf8,${STROKES[variant]}`;
  return (
    <span
      data-variant={variant}
      style={{
        backgroundImage: `url("${dataUrl}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 88%",
        backgroundSize: "100% 0.4em",
        paddingBottom: "0.1em",
      }}
    >
      {children}
    </span>
  );
}
