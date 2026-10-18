# Who still calls the old AWS API on footbalisto.be?

Research for [#3549](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3549), part of map
[#3547](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3547). Measured 2026-10-18.

All AWS reads used profile `serverless-admin`, account `652463040004`, region `eu-west-1`. Every call was
read-only (`get-*`, `list-*`, `cloudwatch get-metric-statistics`). No secret values appear here.

## Answer in one table

The window is 30 days: 2026-09-18 to 2026-10-17. "Lambda calls/day" counts cache misses only, so it is
a floor. API Gateway caches every route for 600 s, and the stage has no per-route metrics, so cache
hits cannot be split by route.

| Caller | Route | Lambda calls/day (floor) | What breaks when the API goes | Covered by the new site? |
| --- | --- | --- | --- | --- |
| **Calendar subscribers** (phones and desktop calendars) | `GET /calendar?teams=…&side=…` | **309**, flat for 15 months | Their subscribed KCVV calendar stops updating. Most apps fail silently and keep the stale matches. | **Content yes, URL no.** The new feed is `/api/calendar.ics?teamIds=…&side=…` on the new site. Nobody moves over unless `footbalisto.be/calendar` redirects or proxies there. |
| **Old Gatsby site, in the browser** (visitors of the Netlify site) | `/matches/next`, `/matches/prev`, `/matches/{teamId}`, `/ranking/{teamId}`, `/stats/player/{id}`, `/stats/team/{id}` | 269 + 99 + 53 + 53 + 75 + 51 = **600** | Match sliders, rankings and stats on the old site go empty. | **Yes.** The new site reads PSD through its own BFF. After the DNS flip, only someone on the old Netlify URL still calls these routes. |
| **Old Gatsby site, at build time** (Netlify build) | `/ranking/1`, `/ranking/2`, `/ranking/21` in `gatsby-node.ts` | 0 (builds only) | A rebuild of the old site fails: the `await request.get` calls have no `catch`. | **Yes.** `/kiosk/*` redirects to `/kalender` on the new site. This only matters if someone rebuilds the old site in the rollback week. |
| **Old share tool** (`/share` on the old site) | `GET /share/instagram/{slug}?score=&match=` | **0**: 2 calls in 15 months | Nothing in practice. | **Yes.** The new `/share` tool is built in (#3535). |
| `/match/{matchId}`, `/events/{action}` | — | 0 | Nothing. | n/a |
| **Unmatched paths** (unknown clients, likely bots) | Any path with no resource; API Gateway answers `403` | **1 179** | Nothing for a real person: these requests already fail. | n/a |
| `uitbetaling` | none: it calls `clubapi.prosoccerdata.com` directly | 0 | Nothing. | n/a |
| `sponsorship-platform`, `social-media`, `kcvv-data-api`, this monorepo's code | none | 0 | Nothing. | n/a |

**Only one caller is a real person who gets hurt: the calendar subscriber.** Nothing else breaks for
anyone after the DNS flip.

## Traffic, measured

API Gateway REST API `kcvv-api-psd-prod` (`9reu5z4r6j`), stage `prod`. It is the only REST API in the
account, and there are no HTTP APIs. `footbalisto.be` is an EDGE custom domain with base path `(none)`
on stage `prod`.

| Metric, 30 days | Sum | Per day |
| --- | ---: | ---: |
| `Count` (all requests) | 75 980 | 2 533 |
| `CacheHitCount` | 13 360 | 445 |
| `CacheMissCount` (equals the sum of all API Lambda `Invocations`: 27 265) | 27 265 | 909 |
| `4XXError` | 35 355 | 1 179 |
| `5XXError` | 1 | 0 |

`Count − CacheHit − CacheMiss = 35 355`, which equals `4XXError` exactly. So every 4XX is a request that
matched no cached route at all. These are unknown paths, and API Gateway answers them with `403 Missing
Authentication Token`, as a `curl https://footbalisto.be/` returns. No Lambda answered with a 4XX. The
4XX count spikes (3 658 on 2026-10-12, 2 625 on 2026-10-16) while the route counts stay flat. That
points at scanners or bots, not people. Who they are cannot be measured: the stage has
`accessLogSettings: null` and `metricsEnabled: false`, and the handlers log no request metadata.

Lambda `Invocations` per API function, 30 days:

| Function (`kcvv-api-psd-prod-api-…`) | Route | 30 d | /day |
| --- | --- | ---: | ---: |
| `calendar-get` | `/calendar` | 9 268 | 309 |
| `matches-next-get` | `/matches/next` | 8 069 | 269 |
| `matches-prev-get` | `/matches/prev` | 2 970 | 99 |
| `stats-player-get` | `/stats/player/{playerId}` | 2 236 | 75 |
| `ranking-get` | `/ranking/{teamId}` | 1 591 | 53 |
| `matches-get` | `/matches/{teamId}` | 1 589 | 53 |
| `stats-team-get` | `/stats/team/{teamId}` | 1 542 | 51 |
| `match-get` | `/match/{matchId}` | 0 | 0 |
| `events-get` | `/events/{action}` | 0 | 0 |
| `share-instagram-get` | `/share/instagram/{slug}` | 0 (2 since 2025-07) | 0 |

Monthly averages per day since 2025-07:

```text
calendar-get      2025-07:316 2025-08:323 2025-09:330 2025-10:319 2025-11:316 2025-12:325 2026-01:337
                  2026-02:324 2026-03:315 2026-04:320 2026-05:303 2026-06:301 2026-07:291 2026-08:308 2026-09:308
matches-next-get  2025-07:267 2025-08:286 2025-09:257 2025-10:255 2025-11:237 2025-12:214 2026-01:247
                  2026-02:248 2026-03:258 2026-04:240 2026-05:206 2026-06:200 2026-07:250 2026-08:272 2026-09:268
```

The calendar line does not drop in the summer break. That is the signature of calendar apps polling
on a timer, not of people visiting.

### How many calendar subscribers?

The number cannot be measured exactly. A lower bound can. `/calendar` caches per `side` and `teams`
query string (`cacheKeyParameters` in `serverless.yml`) for 600 s. One feed URL can therefore cause at
most 144 Lambda calls a day. 309 calls a day means **at least 3 distinct feed URLs** are polled around
the clock. Each URL can serve any number of devices, and requests served from the cache are not
counted per route.

## Callers in code

Grep of every repo under `~/Sites/KCVV/` for `footbalisto|execute-api|amazonaws`, skipping
`node_modules`, `.git`, `public` and `.cache`.

- **`KCVV-Elewijt-Gatsby`**: the only runtime caller.
  - `KCVV_PSD_API` (host `footbalisto.be`) becomes `siteMetadata.kcvvPsdApi` in `gatsby-config.ts`. It
    is read by `src/components/{Ranking,MiniRanking,Matches,MatchesOverview,MatchesSlider,MatchTeaser,TeamStats,ClubcalendarMatches,ScheurkalenderMatches}.tsx`,
    `src/templates/Player.tsx` and `src/pages/game.tsx`. All of them call it from the browser.
  - `gatsby-node.ts:25,34,42` hard-codes `https://footbalisto.be/ranking/{1,2,21}` for the
    `/kiosk/ranking/*` pages at build time.
  - `src/pages/calendar.tsx:12` builds `webcal://footbalisto.be/calendar`. This is where every current
    subscriber got their URL.
  - `src/pages/share.tsx:12` uses `https://footbalisto.be/share/instagram/`.
  - `FOOTBEL_API_DOMAIN` (host `api.footbalisto.be`) is set in `.env`, but no source file reads it,
    and `api.footbalisto.be` no longer resolves.
- **`kcvv-api-psd`**: the API itself (`serverless.yml`, `customDomain.domainName: footbalisto.be`).
- **`kcvv-data-api`**: `.gitlab-ci.yml` runs as a Unix user called `footbalisto`. That is a name, not
  an API call.
- **`uitbetaling`**: `scripts/psd-client.ts:13` calls `https://clubapi.prosoccerdata.com` directly. By
  default it reads its credentials from this monorepo's `apps/api/.dev.vars`. It shares the **new**
  stack's PSD credentials, not the old API. Turning off the old API cannot break the payout app.
- **`sponsorship-platform`, `social-media`**: no hits.
- **This monorepo**: no hits in app code (`apps/`, `packages/`). The hits are only in docs and PRDs:
  the `footbalisto/` → `psd/` rename history, and the plan to reuse `footbalisto.be` as the BFF's
  domain in `docs/prd/archive/2026/architecture-housekeeping.md`.

## What the new site already covers

- **Calendar feed**: `apps/web/src/app/api/calendar.ics/route.ts`. The subscribe panel
  (`apps/web/src/components/calendar/CalendarSubscribePanel/CalendarSubscribePanel.tsx:37`) builds
  `webcal://<host>/api/calendar.ics?teamIds=<ids>&side=<side>`. The old feed's `teams` values are PSD
  team ids (`update-teams-list.js` stores PSD's `id` as `TEAM#<id>`), and the new `teamIds` are PSD ids
  too. So the mapping `teams → teamIds` is one to one, and `side` (`home|away|all`) is the same on both.
- **`www.kcvvelewijt.be/calendar`** redirects to `/kalender` (`apps/web/next.config.ts`). That covers
  the old *page*, but not the `footbalisto.be` *feed host*.
- **`/kiosk/*`** redirects to the calendar (`apps/web/next.config.ts`, "Internal kiosk displays").
- **`/share`**: the new share tool replaces `/share/instagram/{slug}`.

## Traps for the delete plan

- **`footbalisto.be` DNS and registration live in this AWS account.** The Route 53 hosted zone holds
  the apex `A`/`AAAA` alias, plus two ACM validation `CNAME`s. The domain is registered with Route 53
  Domains (expires 2027-07-03, auto-renew on). Deleting the API must not delete the zone or the domain
  if the plan is to keep `footbalisto.be/calendar` alive as a redirect.
- **The same account also registers and hosts `van-ransbeeck.be`**, Kevin's own business domain (zone
  and registration, expires 2027-11-16). Any "empty the AWS account" step would take it down.
- **Calendar clients and redirects.** Whether Apple Calendar, Google Calendar and Outlook follow a
  `301` on a subscribed feed, and whether they update the stored URL, was **not verified** here.
  Proxying (serving the new feed's body under the old URL) works whatever the client does. A redirect
  needs a test per client.

## Options for the calendar subscribers (input for the decision ticket)

1. **Keep `footbalisto.be/calendar` alive as a thin pass-through.** Map `?teams=X&side=Y` to the new
   `/api/calendar.ics?teamIds=X&side=Y`, either as a CloudFront or Cloudflare redirect or as a tiny
   Worker on `footbalisto.be`. The old PRD already planned that domain for the BFF. Subscribers never
   notice.
2. **Let it die, with a last message.** Serve one final `.ics` from the old URL with a single event,
   "Abonneer opnieuw op kcvvelewijt.be/kalender". Subscribers see the notice in their own calendar.
3. **Let it die silently.** At least 3 feeds, and an unknown number of phones, keep showing stale
   matches forever.

## What was not checked

- Who sends the 1 179 unmatched requests a day: there are no access logs to tell.
- Per-route cache hits (13 360 in 30 days, all routes together).
- Netlify analytics for the old site (how many people still load it).
- Whether calendar apps follow redirects on subscribed feeds.
