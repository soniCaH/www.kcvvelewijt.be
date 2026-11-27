import { useCallback, useState } from "react";
import { readPublicEnv } from "@/lib/env/client";

const PENDING_MESSAGE =
  "De verificatie loopt nog. Probeer het zo meteen opnieuw.";
const FAILED_MESSAGE = "De verificatie laadt niet. Probeer het later opnieuw.";

/**
 * A form's Turnstile token, and the gate that keeps it from posting an empty
 * one (#3902): the BFF refuses that, and the retry would loop. Spread `widget`
 * onto `<TurnstileWidget>`; call `blocked()` right before the `fetch`. With no
 * site key (local dev, Storybook, tests) there is no gate: the token is empty
 * on purpose and the BFF decides (`ALLOW_MISSING_FORM_SECRETS`).
 */
export const useTurnstileGate = () => {
  const [token, setToken] = useState("");
  // Set by the widget; cleared by a token or by the re-run below.
  const [failed, setFailed] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Stable: the widget re-renders Cloudflare's widget when these change.
  const onToken = useCallback((next: string) => {
    setToken(next);
    if (next) setFailed(false);
  }, []);
  const onError = useCallback(() => setFailed(true), []);

  /** A token is single-use: after a submit the server did not accept. */
  const reset = () => {
    setToken("");
    setResetKey((key) => key + 1);
  };

  /** The line to show instead of posting, or `null` when the form may post. */
  const blocked = (): string | null => {
    if (token || !readPublicEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;
    if (!failed) return PENDING_MESSAGE;
    // Re-run the widget once, so the form recovers when Turnstile is back. A
    // tap while that runs waits; a new failure sets `failed` again.
    setFailed(false);
    reset();
    return FAILED_MESSAGE;
  };

  return { token, reset, blocked, widget: { onToken, onError, resetKey } };
};
