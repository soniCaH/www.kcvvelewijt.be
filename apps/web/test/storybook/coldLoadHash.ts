/**
 * Sets `window.location.hash` via a Storybook `loaders` entry — which runs
 * BEFORE the story mounts, the same timing a decorator's render body would
 * give, without actually assigning inside a component's render (an inline
 * `window.location.hash = hash` in a decorator trips the React Compiler's
 * "modifying a value outside a component" lint, correctly: a decorator IS
 * a component). Required for a "cold load" fixture's timing —
 * `useHashLandingCorrection`'s mount effect must see the hash already
 * present the first time it runs, and effects fire child-before-parent, so
 * setting it from inside `play` (which runs AFTER mount) would turn this
 * into a same-page hash change instead.
 *
 * No unmount-cleanup mechanism is needed here (#3146, review finding 9):
 * every story built on this ALSO carries `tags: ["!autodocs"]`, so the
 * docs page — which renders every story's decorator/loaders on one shared
 * page without running `play` — never reaches this at all. `play` resets
 * the hash itself, in a `finally`, once its assertions are done (see
 * `OrganigramSectionNav.stories.tsx`'s `ColdLoadHashLandsBelowTheBar` and
 * `JeugdVisie.stories.tsx`'s `ColdLoadHashLandsBelowTheHeaderAlone`).
 */
export function armColdLoadHash(hash: string) {
  return async () => {
    window.location.hash = hash;
  };
}
