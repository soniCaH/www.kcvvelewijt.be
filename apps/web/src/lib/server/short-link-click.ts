/**
 * Counts a short link hit in GA4 from the server (#3573). A redirect loads no
 * page, so browser GTM never sees it; the Measurement Protocol is the only
 * place the hit can be counted.
 *
 * Privacy by construction: the body is a random `client_id` and the link's
 * name, nothing else. No cookie, IP, user agent or user id is read from the
 * request, and none is sent — GA4 sees no visitor, only a count per link.
 *
 * Fire-and-forget by contract: the caller runs this in `after()`, and a missing
 * secret, a network error or a non-2xx answer must never touch the redirect, so
 * every failure ends here.
 */
const ENDPOINT = "https://www.google-analytics.com/mp/collect";

export async function sendShortLinkClick(name: string): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return;

  const url = new URL(ENDPOINT);
  url.searchParams.set("measurement_id", measurementId);
  url.searchParams.set("api_secret", apiSecret);

  try {
    await fetch(url.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: crypto.randomUUID(),
        events: [
          { name: "short_link_click", params: { short_link_name: name } },
        ],
      }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    // Counting is best-effort; the visitor already has their redirect.
    // Logs the message only: the request URL carries the API secret.
    console.warn(
      `[short-link] GA4 count failed for "${name}":`,
      error instanceof Error ? error.message : "unknown error",
    );
  }
}
