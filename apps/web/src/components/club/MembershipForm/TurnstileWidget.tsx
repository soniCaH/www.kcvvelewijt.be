"use client";

import { useEffect, useRef } from "react";
import { readPublicEnv } from "@/lib/env/client";

const SITE_KEY = readPublicEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY;
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
 * ponytail: global `window.turnstile` lock; the widget is the only consumer.
 */
export const TurnstileWidget = ({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void;
  resetKey: number;
}) => {
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

    const controller = new AbortController();

    const render = () => {
      if (controller.signal.aborted || !ref.current || !window.turnstile) {
        return;
      }
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    const scriptEl = window.turnstile ? null : getTurnstileScript();
    if (scriptEl) scriptEl.addEventListener("load", render);
    else render();

    return () => {
      controller.abort();
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (scriptEl) scriptEl.removeEventListener("load", render);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="mt-2" />;
};
