import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Custom `--text-*` font-size steps declared in the `@theme` block of
 * `src/app/globals.css` (the "one ramp", #2417/#2396). Derived by reading
 * every `--text-<step>` declaration there and excluding the stock Tailwind
 * scale (`xs`…`6xl`), which the factory's own `font-size` group already
 * recognises correctly.
 *
 * Kept in this one exported place — `cn.test.ts` and the merge config below
 * both read from here — so the two cannot drift. The actual drift guard is
 * `cn.test.ts`'s own re-derivation of this list straight from `globals.css`
 * — `it.each(CUSTOM_SIZE_TOKENS)` walks this array, so it can't catch a
 * missing 13th step on its own; a separate assertion there parses the
 * `@theme` block and compares against this array to make that promise real.
 */
export const CUSTOM_SIZE_TOKENS = [
  "body-sm",
  "body-md",
  "body-lg",
  "display-sm",
  "display-md",
  "display-lg",
  "display-xl",
  "display-2xl",
  "label",
  "label-sm",
  "mono-sm",
  "mono-md",
] as const;

/**
 * The stock `twMerge` has no idea these tokens exist, so it can't file
 * `text-body-sm` etc. under its `font-size` conflict group — it falls
 * through to a looser `text-*` pattern shared with the `text-color` group
 * and silently drops whichever of a size/colour pair came first (#2769).
 * Registering them here fixes that at the source, for every `cn()` caller.
 *
 * Side effect: `tailwind-merge`'s default config declares `font-size` and
 * `leading` as conflicting groups, so a `cn()` call that combines one of
 * these 12 tokens with an explicit `leading-*` utility now correctly drops
 * the `leading-*` (the size step wins, same as it already does for the
 * stock `text-*` scale). Before this fix that conflict never fired — the
 * token wasn't in the `font-size` group at all — so a base class string
 * carrying its own `leading-*` (e.g. `<BracketAffordance>`'s
 * `"text-label font-mono leading-none font-medium not-italic"`) combined
 * with a second `cn()` argument that sets a *different* size would now lose
 * the `leading-none`. No current call site does this (scanned #2769/#2772),
 * but the next one that does will hit it silently — worth knowing before
 * debugging it from scratch.
 */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: [...CUSTOM_SIZE_TOKENS] }] } },
});

/**
 * Combines class names with proper Tailwind CSS merging
 * Usage: cn('text-red-500', 'bg-blue-500', conditionalClass && 'mt-4')
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
