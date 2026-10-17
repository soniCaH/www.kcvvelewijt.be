import { userAgentFromString } from "next/server";

/**
 * Best guess, from the request alone, that the visitor is on a phone (#3480) —
 * what `<CalendarWidget>` seeds `initialIsPhone` with so a phone's first paint
 * is the agenda rather than the month grid it would only leave after its
 * `matchMedia` effect. `sec-ch-ua-mobile` (`?1` / `?0`) wins when the browser
 * sends it; Safari and iOS browsers do not, so the user agent is the fallback,
 * read through Next's parser (`device.type === "mobile"`) because a regex
 * cannot tell an iPad running Chrome or an in-app browser ("... Mobile/15E148")
 * from an iPhone. A tablet is not a phone: it gets the desktop layout, as it
 * does at the `md` breakpoint. A wrong guess (a phone held in landscape) costs
 * one flash, not a wrong page: the widget's `matchMedia` check still has the
 * last word after mount.
 *
 * Server-only: its own file, not `./utils`, because client components import
 * `./utils` and `next/server` must stay out of their bundle.
 */
export function guessIsPhone(request: {
  get(name: string): string | null;
}): boolean {
  const hint = request.get("sec-ch-ua-mobile");
  if (hint !== null) return hint === "?1";
  return (
    userAgentFromString(request.get("user-agent") ?? undefined).device.type ===
    "mobile"
  );
}
