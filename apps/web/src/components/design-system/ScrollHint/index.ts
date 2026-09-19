// The values (`useScrollHint`, `ScrollArrowButton`, `ScrollRail`,
// `ScrollOverlay`) are deliberately NOT re-exported here: every consumer
// (HorizontalSlider.tsx and friends) imports each one directly from its own
// file, e.g. "@/components/design-system/ScrollHint/useScrollHint" — see the
// `Alert` barrel (../Alert/index.ts) for the same pattern. Only the types
// stay, for the top-level design-system barrel's `export type` re-export.
export type {
  UseScrollHintOptions,
  UseScrollHintReturn,
} from "./useScrollHint";
export type {
  ScrollArrowButtonProps,
  ScrollArrowButtonRegister,
} from "./ScrollArrowButton";
export type { ScrollRailProps } from "./ScrollRail";
export type { ScrollOverlayProps } from "./ScrollOverlay";
