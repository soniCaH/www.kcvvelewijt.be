"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
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

/**
 * Cloudflare Turnstile widget. With no site key configured (local/dev) it
 * renders nothing and reports an empty token — the BFF only accepts that when
 * its own dev flag `ALLOW_MISSING_FORM_SECRETS` is on, and otherwise fails
 * closed. A token is single-use: bump `resetKey` after any submit the server
 * did not accept and the widget re-runs the challenge for a fresh one.
 * ponytail: global `window.turnstile` lock; the widget is the only consumer.
 */
export function TurnstileWidget({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lastResetKey = useRef(resetKey);

  useEffect(() => {
    if (resetKey === lastResetKey.current) return;
    lastResetKey.current = resetKey;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  useEffect(() => {
    if (!SITE_KEY) {
      onToken("");
      return;
    }

    let cancelled = false;
    let widgetId: string | null = null;
    let scriptEl: HTMLScriptElement | null = null;

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widgetId = widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      scriptEl = existing ?? document.createElement("script");
      if (!existing) {
        scriptEl.src = SCRIPT_SRC;
        scriptEl.async = true;
        scriptEl.defer = true;
        document.head.appendChild(scriptEl);
      }
      scriptEl.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      widgetIdRef.current = null;
      if (scriptEl) scriptEl.removeEventListener("load", render);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="mt-2" />;
}
