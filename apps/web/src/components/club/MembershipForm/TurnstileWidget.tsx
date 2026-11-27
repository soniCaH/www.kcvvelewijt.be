"use client";

import { useEffect, useRef } from "react";
import { readPublicEnv } from "@/lib/env/client";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      "unsupported-callback"?: () => void;
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const getTurnstileScript = (): HTMLScriptElement => {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`,
  );
  if (existing) return existing;
  const scriptEl = document.createElement("script");
  scriptEl.src = SCRIPT_SRC;
  scriptEl.async = true;
  scriptEl.defer = true;
  document.head.appendChild(scriptEl);
  return scriptEl;
};

/**
 * Cloudflare Turnstile widget. With no site key configured (local/dev) it
 * renders nothing and reports an empty token — the BFF only accepts that when
 * its own dev flag `ALLOW_MISSING_FORM_SECRETS` is on, and otherwise fails
 * closed. A token is single-use: bump `resetKey` after any submit the server
 * did not accept and the widget re-runs the challenge for a fresh one.
 * `onError` tells a failure (widget error, or the script blocked or down)
 * apart from "no token yet"; the form's gate is `useTurnstileGate`.
 * ponytail: global `window.turnstile` lock; the widget is the only consumer.
 */
export const TurnstileWidget = ({
  onToken,
  onError,
  resetKey,
}: {
  onToken: (token: string) => void;
  onError?: () => void;
  resetKey: number;
}) => {
  // Read per render, not at import, so a story can switch it on (`sb.mock`).
  const siteKey = readPublicEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lastResetKey = useRef(resetKey);
  // Set only after the script failed (blocked, or Cloudflare down): a reset
  // then has no widget to reset, so it loads the script again instead.
  const retryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (resetKey === lastResetKey.current) return;
    lastResetKey.current = resetKey;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    } else {
      retryRef.current?.();
    }
  }, [resetKey]);

  useEffect(() => {
    if (!siteKey) {
      onToken("");
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const render = () => {
      if (signal.aborted || !ref.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => {
          onToken("");
          onError?.();
        },
        "unsupported-callback": () => onError?.(),
      });
    };

    const load = () => {
      retryRef.current = null;
      if (window.turnstile) return render();
      const scriptEl = getTurnstileScript();
      scriptEl.addEventListener("load", render, { signal });
      scriptEl.addEventListener(
        "error",
        () => {
          // A tag fires `error` once: drop it, so a retry loads a fresh one.
          scriptEl.remove();
          retryRef.current = load;
          onError?.();
        },
        { signal },
      );
    };
    load();

    return () => {
      controller.abort();
      retryRef.current = null;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken, onError]);

  if (!siteKey) return null;
  return <div ref={ref} className="mt-2" />;
};
