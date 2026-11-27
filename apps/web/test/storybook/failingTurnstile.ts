import { mocked } from "storybook/test";
import { readPublicEnv } from "@/lib/env/client";

/**
 * A story `beforeEach` for a form whose Turnstile widget fails (#3902): an ad
 * blocker, or Cloudflare down. It sets a site key (the gate is off without
 * one) and fakes `window.turnstile` so the widget errors at once and never
 * loads Cloudflare's script, which VR could not keep deterministic. Needs the
 * `sb.mock` of `@/lib/env/client` in `.storybook/preview.ts`, which also
 * resets it before the next story.
 */
export const failingTurnstile = () => {
  mocked(readPublicEnv).mockReturnValue({
    ...readPublicEnv(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "story-site-key",
  });
  window.turnstile = {
    render: (_el, opts) => {
      opts["error-callback"]?.();
      return "story-widget";
    },
    remove: () => {},
    reset: () => {},
  };
  return () => {
    delete window.turnstile;
  };
};
