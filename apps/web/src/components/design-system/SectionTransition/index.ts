// `SectionTransition` is re-exported for the top-level design-system
// barrel, which `.design-sync/entry.ts` wildcards onto `window.KcvvDS` —
// see the note at the top of ../index.ts. `BG_CLASS` and
// `getTransitionBleed` are NOT part of that surface (the top barrel never
// re-exported them, only `SectionTransition` itself) and every consumer
// (SectionStack.tsx, TapedCard.tsx, …) imports them directly from
// "@/components/design-system/SectionTransition/SectionTransition" anyway.
export { SectionTransition } from "./SectionTransition";
export type {
  SectionTransitionProps,
  SectionBg,
  SectionTransitionConfig,
} from "./SectionTransition";
