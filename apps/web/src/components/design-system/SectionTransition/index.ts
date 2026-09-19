// The values (`SectionTransition`, `BG_CLASS`, `getTransitionBleed`) are
// deliberately NOT re-exported here: every consumer (SectionStack.tsx,
// TapedCard.tsx, …) imports them directly from
// "@/components/design-system/SectionTransition/SectionTransition" — see
// the `Alert` barrel (../Alert/index.ts) for the same pattern. Only the
// types stay, for the top-level design-system barrel's re-export.
export type {
  SectionTransitionProps,
  SectionBg,
  SectionTransitionConfig,
} from "./SectionTransition";
