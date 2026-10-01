/**
 * TurnstileWidget unit tests (#3348)
 *
 * Only the outer boundary is faked: `window.turnstile` (Cloudflare's script)
 * and the env var that supplies the site key. The widget's own effect — token
 * callbacks, script injection, cleanup — runs for real.
 *
 * `SITE_KEY` is read once at module scope, so it is set in `vi.hoisted`, before
 * the component module is imported.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterAll,
  afterEach,
} from "vitest";
import { render } from "@testing-library/react";
import type { Window as HappyDomWindow } from "happy-dom";

const previousSiteKey = vi.hoisted(() => {
  const previous = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
  return previous;
});

import { TurnstileWidget } from "./TurnstileWidget";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type RenderOpts = Parameters<NonNullable<Window["turnstile"]>["render"]>[1];

function installFakeTurnstile() {
  const turnstile = {
    render: vi.fn((_el: HTMLElement, _opts: RenderOpts) => "widget-1"),
    remove: vi.fn(),
  };
  window.turnstile = turnstile;
  return turnstile;
}

function renderedOpts(turnstile: ReturnType<typeof installFakeTurnstile>) {
  return turnstile.render.mock.calls[0]![1];
}

function scriptTags() {
  return document.querySelectorAll(`script[src="${SCRIPT_SRC}"]`);
}

describe("TurnstileWidget", () => {
  afterAll(() => {
    // `SITE_KEY` was already read at import, so restoring only keeps the
    // variable from leaking to anything else in this worker.
    if (previousSiteKey === undefined) {
      delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    } else {
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = previousSiteKey;
    }
  });

  beforeEach(() => {
    delete window.turnstile;
  });

  afterEach(() => {
    delete window.turnstile;
    // The injected <script> outlives an unmount (the Cloudflare script is
    // global), so drop it between tests.
    scriptTags().forEach((tag) => tag.remove());
  });

  describe("with window.turnstile available", () => {
    it("renders the widget into its container with the site key", () => {
      const turnstile = installFakeTurnstile();

      const { container } = render(<TurnstileWidget onToken={vi.fn()} />);

      expect(turnstile.render).toHaveBeenCalledTimes(1);
      expect(turnstile.render.mock.calls[0]![0]).toBe(container.firstChild);
      expect(renderedOpts(turnstile).sitekey).toBe("test-site-key");
    });

    it("passes the token from the success callback", () => {
      const turnstile = installFakeTurnstile();
      const onToken = vi.fn();
      render(<TurnstileWidget onToken={onToken} />);

      renderedOpts(turnstile).callback("fresh-token");

      expect(onToken).toHaveBeenCalledExactlyOnceWith("fresh-token");
    });

    it("clears the token when it expires, so the form cannot submit a dead token", () => {
      const turnstile = installFakeTurnstile();
      const onToken = vi.fn();
      render(<TurnstileWidget onToken={onToken} />);
      renderedOpts(turnstile).callback("fresh-token");

      renderedOpts(turnstile)["expired-callback"]!();

      expect(onToken).toHaveBeenLastCalledWith("");
    });

    it("clears the token on a widget error", () => {
      const turnstile = installFakeTurnstile();
      const onToken = vi.fn();
      render(<TurnstileWidget onToken={onToken} />);
      renderedOpts(turnstile).callback("fresh-token");

      renderedOpts(turnstile)["error-callback"]!();

      expect(onToken).toHaveBeenLastCalledWith("");
    });

    it("removes the widget on unmount", () => {
      const turnstile = installFakeTurnstile();
      const { unmount } = render(<TurnstileWidget onToken={vi.fn()} />);
      expect(turnstile.remove).not.toHaveBeenCalled();

      unmount();

      expect(turnstile.remove).toHaveBeenCalledExactlyOnceWith("widget-1");
    });

    it("does not inject the Cloudflare script", () => {
      installFakeTurnstile();

      render(<TurnstileWidget onToken={vi.fn()} />);

      expect(scriptTags()).toHaveLength(0);
    });
  });

  describe("without window.turnstile", () => {
    const settings = (window as unknown as HappyDomWindow).happyDOM.settings;
    const previous = settings.handleDisabledFileLoadingAsSuccess;

    beforeEach(() => {
      // happy-dom's default is to not load script files, and it reports every
      // injected <script src> as a console error. Treating that
      // as a silent success keeps the log clean; the tests never need the real
      // Cloudflare script, they fake `window.turnstile` themselves.
      settings.handleDisabledFileLoadingAsSuccess = true;
    });

    afterEach(() => {
      settings.handleDisabledFileLoadingAsSuccess = previous;
    });

    it("injects the script once, async and deferred", () => {
      render(<TurnstileWidget onToken={vi.fn()} />);

      const tags = scriptTags();
      expect(tags).toHaveLength(1);
      expect(tags[0]).toHaveAttribute("async");
      expect(tags[0]).toHaveAttribute("defer");
    });

    it("does not inject a second script tag on a second mount", () => {
      const first = render(<TurnstileWidget onToken={vi.fn()} />);
      render(<TurnstileWidget onToken={vi.fn()} />);
      expect(scriptTags()).toHaveLength(1);

      // Also holds when the first mount is gone — the tag outlives it.
      first.unmount();
      render(<TurnstileWidget onToken={vi.fn()} />);
      expect(scriptTags()).toHaveLength(1);
    });

    it("hooks a second mount onto the already-injected script, so it renders once that loads", () => {
      render(<TurnstileWidget onToken={vi.fn()} />);
      render(<TurnstileWidget onToken={vi.fn()} />);
      const turnstile = installFakeTurnstile();

      scriptTags()[0]!.dispatchEvent(new Event("load"));

      expect(turnstile.render).toHaveBeenCalledTimes(2);
    });

    it("renders the widget once the script has loaded", () => {
      const onToken = vi.fn();
      render(<TurnstileWidget onToken={onToken} />);
      const turnstile = installFakeTurnstile();
      expect(turnstile.render).not.toHaveBeenCalled();

      scriptTags()[0]!.dispatchEvent(new Event("load"));

      expect(turnstile.render).toHaveBeenCalledTimes(1);
      renderedOpts(turnstile).callback("late-token");
      expect(onToken).toHaveBeenCalledWith("late-token");
    });

    it("does not render a widget when the script loads after unmount", () => {
      const { unmount } = render(<TurnstileWidget onToken={vi.fn()} />);
      const script = scriptTags()[0]!;
      const turnstile = installFakeTurnstile();

      unmount();
      script.dispatchEvent(new Event("load"));

      expect(turnstile.render).not.toHaveBeenCalled();
      expect(turnstile.remove).not.toHaveBeenCalled();
    });
  });
});
