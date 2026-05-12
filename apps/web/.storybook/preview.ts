import type { Preview } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import "../src/app/globals.css";

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
