import type { Preview } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import "../src/app/globals.css";

// Storybook's preview iframe template ships hardcoded `<html lang="en">`
// (@storybook/builder-vite/input/iframe.html) — nothing in this directory
// ever overrides it. The app sets `lang="nl"` on `<html>` in
// `app/layout.tsx`, which is the source of truth. `hyphens: auto` picks its
// dictionary from `lang`, so an un-aligned preview hyphenates Dutch copy
// with English rules — a hyphenation baseline taken under the wrong
// language is not a baseline of what ships. Runs at module scope, before
// any story renders.
document.documentElement.lang = "nl";

const preview: Preview = {
  initialGlobals: {
    viewport: { value: "responsive" },
  },
  parameters: {
    viewport: {
      options: {
        ...MINIMAL_VIEWPORTS,
        kcvvMobile: {
          name: "KCVV Mobile",
          styles: { width: "375px", height: "667px" },
        },
        // `StandingsTable.stories.tsx`'s `StickyColumnsPinned` play fixture
        // (#3146, review finding 7) needs the deleted E2E case's exact
        // 360px — measured 2026-09-25: `kcvvMobile` (375px) is 15px too
        // wide and the 8-column division stops overflowing at that width
        // (`scrollWidth === clientWidth`, table content fits), so it does
        // not reproduce the original condition.
        kcvvStandingsTablePhone: {
          name: "StandingsTable Phone (360)",
          styles: { width: "360px", height: "800px" },
        },
        // The organigram explorer's zoom-overflow play fixture (#3146,
        // review finding 2/7) needs the exact 1024px width the E2E case it
        // replaced used — no `MINIMAL_VIEWPORTS` entry or `kcvvMobile`
        // matches it. Named for the one consumer that needs it rather than
        // a generic "tablet" — `OrganigramExplorer.stories.tsx`'s
        // `ZoomOverflowsTheStage` is 1024px specifically because that is
        // where an 11-child fan fits unzoomed but overflows once scaled to
        // A++, not because it represents a real tablet breakpoint.
        kcvvExplorerStage: {
          name: "Organigram Explorer Stage (1024)",
          styles: { width: "1024px", height: "800px" },
        },
      },
    },
    options: {
      storySort: {
        order: ["Foundation", "UI", "Features", "Layout", "Pages", "*"],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/",
        query: {},
        segments: [],
      },
      router: {
        basePath: "",
      },
      // Force `unoptimized: true` on every <Image /> in Storybook. Without
      // this, Next/Image emits a 10-entry `srcset` with width-keyed URLs
      // (`?w=384`, `?w=640`, ...); when the VR runner resizes the viewport
      // across mobile/tablet/desktop, the browser re-selects a different
      // srcset candidate at each step and issues a fresh request per
      // image — and because `<img>` cache keys include the query string,
      // each width re-runs the full fetch + decode pipeline even though
      // every variant resolves to identical bytes (`http-server` ignores
      // query params). Whichever decode happens to commit mid-screenshot
      // produces the intermittent NewsGrid 2x2 tile diffs in #1731. With
      // `unoptimized: true`, every Image renders as a single `<img src>`
      // with no srcset, so viewport changes do not trigger a re-fetch
      // and decode timing is deterministic. Storybook-only — production
      // builds still use the full Next/Image optimizer.
      image: {
        unoptimized: true,
      },
    },
  },
};

export default preview;
