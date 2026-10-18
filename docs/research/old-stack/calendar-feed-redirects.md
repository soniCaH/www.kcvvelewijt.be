# Do calendar apps follow a redirect on a subscribed feed?

Research for [#3563](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3563), feeding the decision in
[#3552](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3552). Written 2026-10-18.

Context: [#3549](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3549) measured ~309 Lambda calls/day,
flat for 15 months, on `footbalisto.be/calendar?teams=&side=`. The new feed is
`/api/calendar.ics?teamIds=&side=`, with the same PSD team ids. Note the query parameter is renamed
(`teams` to `teamIds`), so any redirect has to rewrite the query, not just the host and path.

## Bottom line

- **Nobody documents it.** Apple, Google and Microsoft do not publish how their subscription fetchers handle
  a `301`/`308`. No calendar RFC says anything about redirects either.
- **Following the redirect on each fetch: probably yes, everywhere.** The evidence is indirect: platform
  HTTP-stack defaults, and a vendor troubleshooting note that only makes sense if Google's fetcher follows
  a `301`.
- **Rewriting the stored subscription URL: assume no, everywhere.** HTTP itself says this is "usually
  ignored", and no vendor claims to do it. No client exposes the stored URL changing.
- **Consequence:** a redirect works only for as long as it is served. It never "migrates" anyone. If
  `footbalisto.be` is kept, a redirect is as good as a proxy. If the domain will be dropped, subscribers
  must be told to resubscribe before it goes.

## Per client

Confidence: **high** = vendor doc or RFC text says it; **medium** = follows from a documented default or
a credible indirect report; **low** = inference or unsourced third-party claim; **none** = nothing found.

| Client | Follows 301/308 on fetch | Rewrites stored URL | Poll interval |
| --- | --- | --- | --- |
| Apple Calendar (iOS/macOS) | Probably yes (medium) [A1] | Assume no (low; nothing found) [H1] | macOS: user setting per subscription (medium, from the app's own UI). iOS: not user-controllable, undocumented (none) |
| Google Calendar "From URL" | Probably yes (medium) [G1] | Assume no (low; nothing found) [H1] | Undocumented; widely reported 12 to 24 h, sometimes longer (low) [G2] |
| Outlook.com (personal) | Unknown (none) | Assume no (low; nothing found) [H1] | "approximately every 3 hours", "can take more than 24 hours" (high) [M1] |
| Outlook on the web (work/school) | Unknown (none) | Assume no (low; nothing found) [H1] | "approximately every 6 hours", "can take more than 24 hours" (high) [M1] |
| Outlook desktop (classic) | Unknown (none) | Assume no (low; nothing found) [H1] | Publisher's recommended interval (`X-PUBLISHED-TTL`), per Office 2007 docs (low, old) [M2] |

## Sources and what each one says

### HTTP and iCalendar specs

- **[H1] RFC 9110 §15.4.2 (301) and §15.4.9 (308)**, <https://www.rfc-editor.org/rfc/rfc9110#section-15.4.2>.
  Verbatim, identical for both codes: _"The server is suggesting that a user agent with link-editing
  capability can permanently replace references to the target URI with one of the new references sent by
  the server. However, this suggestion is usually ignored unless the user agent is actively editing
  references (e.g., engaged in authoring content), the connection is secured, and the origin server is a
  trusted authority for the content being edited."_ The spec itself sets the expectation that a background
  poller does **not** rewrite its stored URL. Confidence: high, as a statement of the norm.
- **RFC 5545 (iCalendar)** defines no subscription or transport behaviour at all.
- **RFC 7986 §5.7 `REFRESH-INTERVAL` and §5.8 `SOURCE`**, <https://www.rfc-editor.org/rfc/rfc7986>.
  `SOURCE` _"identifies a location where a client can retrieve updated data for the calendar"_. It is the
  only in-band way a feed can name its own new URL. The RFC does not say that a client must update its
  subscription from it, and no vendor documents doing so. Neither section mentions redirects. Setting
  `SOURCE` on the new feed costs nothing, but nothing shows any client acts on it. Confidence: high on the
  text; none on client support.
- **CalDAV (RFC 4791)** does not apply: these are plain HTTP `.ics` subscriptions, not CalDAV collections.

### Apple

- **[A1] URLSession default.** Apple's `URLSessionTaskDelegate`
  `urlSession(_:task:willPerformHTTPRedirection:newRequest:completionHandler:)` documentation describes the
  delegate hook for redirects. When the hook is not implemented, the session follows the redirect. Apple's
  calendar fetcher (`CalendarAgent` / `dataaccessd`) is closed source, so whether it keeps that default is
  undocumented. Confidence: medium.
- Apple's Calendar user guide ("Subscribe to calendars", "Refresh calendars") documents the subscribe
  flow but says nothing on redirects or URL changes. The macOS auto-refresh choice is set in the
  subscription's info sheet. iOS gives the user no refresh control for subscribed calendars.

### Google

- **[G1] The Events Calendar troubleshooting note**,
  <https://theeventscalendar.com/knowledgebase/troubleshooting-common-subscription-issues/>. A server
  feature that answers the `Google-Calendar-Importer` user agent with a `301` to the homepage stops Google
  Calendar from ever reaching the `.ics`. The breakage it describes is "lands on HTML", which implies the
  importer **followed** the `301`. A calendar-plugin vendor, not Google. Confidence: medium.
- **[G2] Refresh timing.** Google's help page for adding a calendar by URL
  (<https://support.google.com/calendar/answer/37100>) states no refresh interval. Third-party guides
  report 12 to 24 h or more. Confidence: low.

### Microsoft

- **[M1] "Import or subscribe to a calendar in Outlook.com or Outlook on the web"**,
  <https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web>.
  Personal account: _"This update can take more than 24 hours, although updates should happen
  approximately every 3 hours."_ Work or school: the same text with 6 hours. Nothing on redirects.
  Confidence: high.
- **[M2] Office 2007 Resource Kit, Internet Calendar subscriptions**,
  <https://learn.microsoft.com/previous-versions/office/office-2007-resource-kit/cc179094(v=office.12)>.
  Outlook syncs each subscription at the publisher's recommended interval. Old, may not hold today.
  Confidence: low.

## What this means for #3552

1. **Keep the domain and serve a permanent redirect (`308`, or `301`) from `footbalisto.be/calendar` to
   `/api/calendar.ics`, rewriting `teams` to `teamIds`.** Every client that follows redirects keeps
   working. The redirect is cheap and needs no state. It must stay up for as long as the domain does,
   because no subscription will move by itself.
2. **A proxy buys nothing over a redirect,** except one thing: it can _change the body_. That matters only
   if the domain is going away (see 3), or if one client turns out not to follow redirects. Nothing
   suggests the latter, and it can be checked cheaply (see below).
3. **If the domain will be dropped:** for at least one season before it goes, serve the old URL a feed
   that carries the real fixtures plus one recurring all-day "Abonneer opnieuw op kcvvelewijt.be"
   event with the new link. This is the only path that tells a human, since no client rewrites the URL and
   a dead feed fails silently.

## How to close the remaining gap (not done)

The "follows on fetch" answers are medium at best. The cheapest proof is our own traffic: once the
redirect is live, the new endpoint's logs should show requests whose `User-Agent` is Apple's
(`iOS/… dataaccessd`, `macOS/… CalendarAgent`), `Google-Calendar-Importer` and Microsoft's Exchange
fetcher. The same feed keys should appear there that were hitting `footbalisto.be`. If one family is
missing after a week, that client does not follow, and a proxy is needed for it.
