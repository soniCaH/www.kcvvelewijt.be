export type DividerStyle = "dotted" | "dashed" | "solid";
export type DividerColor = "ink" | "paper-edge";

export interface DividerProps {
  style?: DividerStyle;
  color?: DividerColor;
  inset?: boolean;
}

const STYLE_CLASS: Record<DividerStyle, string> = {
  dotted: "border-t-2 border-dotted",
  dashed: "border-t-2 border-dashed",
  solid: "border-t border-solid",
};

const COLOR_CLASS: Record<DividerColor, string> = {
  ink: "border-ink",
  "paper-edge": "border-paper-edge",
};

export function Divider({
  style = "solid",
  color = "ink",
  inset = false,
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      data-style={style}
      data-color={color}
      data-inset={inset || undefined}
      className={`${STYLE_CLASS[style]} ${COLOR_CLASS[color]} ${inset ? "ml-12" : ""} w-full`}
    />
  );
}

export const DottedDivider = (props: Omit<DividerProps, "style">) => (
  <Divider {...props} style="dotted" />
);

export const DashedDivider = (props: Omit<DividerProps, "style">) => (
  <Divider {...props} style="dashed" />
);

export const SolidDivider = (props: Omit<DividerProps, "style">) => (
  <Divider {...props} style="solid" />
);
