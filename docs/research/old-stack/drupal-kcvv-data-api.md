# Drupal `kcvv-data-api` — what it ran, and what depended on it

Research ticket [#3550](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3550), on map
[#3547](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3547). Gathered 2026-10-18, read-only:
the local `kcvv-data-api` repo, this monorepo, the old Gatsby repo, `uitbetaling`,
`sponsorship-platform`, `dig`, HTTP GETs against the public JSON:API, the GitHub API and read-only
GROQ queries on the Sanity `production` dataset. Nothing was written, no server was logged into.

> **Snapshot, not live state.** Drupal was **deleted on 2026-10-26** (runbook
> [#3580](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3580) phase 5): its DNS record is gone
> and a verified backup is on Agnes (phase 2.3). The Drupal GitHub token was revoked on 2026-10-19.
>
> **Cut for a public repo.** Server address and software versions, the deploy setup, database
> details, secret locations and a personal-data exposure (closed by the delete) are left out on
> purpose. The full version is kept off this public repo.

## Answer in one screen

| Question                              | Answer                                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What is it                            | Drupal **8** (EOL Nov 2021) headless CMS on PHP 7 and MySQL                                                                                                   |
| Where                                 | `api.kcvvelewijt.be`, an account on a Hetzner server (Falkenstein, DE) that is **not the club's and not the owner's** — the server also runs other sites      |
| Deploy                                | GitLab CI on a self-hosted GitLab, shell runner on the same server                                                                                            |
| Was it still live                     | Yes. Articles were authored there until 2026-07-08, an image uploaded 2026-09-25, a team node edited 2026-09-30, and the PSD sync last wrote 2026-10-12       |
| Crons that ran                        | Weekly PSD player/staff sync (Mon 05:00 local) → triggers the old Gatsby site's deploy; a 30-min "deploy if changed" job; daily + weekly Slack birthday posts |
| PSD quota spent                       | 32 calls a week (16 teams × `/members` + `/staff`). Negligible next to the AWS Lambdas                                                                        |
| New site depends on it                | **Nothing at runtime.** Two leftover host allowlists, one broken relative link in one Sanity article                                                          |
| Old Gatsby site depends on it         | **Everything** — builds from its JSON:API, hotlinks body images/files, runtime search                                                                         |
| `uitbetaling`, `sponsorship-platform` | No reference at all                                                                                                                                           |
| Data found only there                 | Cashless terms page, 73 KCVV TV items, 5 "player of the week" nodes, ~240 former players/staff with bios and photos, one past event, Drupal redirects         |
| Biggest risks found                   | The live PSD keys sit in the Drupal code (the same keys the new BFF uses), and a personal-data exposure on the public API — both handled off this public repo |

## 1. Where it runs

- **DNS.** `api.kcvvelewijt.be` was an `A` record in the Netlify-served `kcvvelewijt.be` zone. Removed
  2026-10-26.
- **TLS.** Let's Encrypt, issued 2026-10-01, so a certbot renewal job was alive on the box.
- **Shared box.** Other sites answer from the same server. **Retiring Drupal is a site removal on a
  shared server, not a server deletion** — the server owner removes the stack.
- **Repo.** 237 commits, 2019-06-28 → 2026-01-20, all by Kevin.

## 2. What runs

Cron jobs are `ultimate_cron` config entities (`config/sync/ultimate_cron.job.*.yml`). Something on the
server calls Drupal cron — that trigger is not in the repo, but its effect is measured below.

| Job                                                          | Schedule                                | Status       | What it does                                                                                                                                                                                                                                                                                         | Evidence it runs                                                                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kcvv_psd` → `kcvv_psd_cron()`                               | `0 5 * * 1` (Mon 05:00 Europe/Brussels) | enabled      | For every published `team` with `field_vv_id` (16), GETs PSD `/teams/{id}/members` and `/teams/{id}/staff`, find-or-creates `player`/`staff` nodes **by first + last name**, sets `field_vv_id`, publishes, saves. If anything synced: POSTs the Netlify build hook and a GitHub `workflow_dispatch` | Newest `player`/`staff` nodes `created = changed = 2026-10-12T03:00:01Z`; Gatsby workflow "Deploy content to production" ran 2026-10-12, 2026-10-05, 2026-09-28, each ~20 s after |
| `kcvv_psd_cron` (default handler)                            | —                                       | **disabled** | Duplicate of the above                                                                                                                                                                                                                                                                               | —                                                                                                                                                                                 |
| `kcvv_netlify_cron`                                          | `*/30+@ * * * *`                        | enabled      | If a node was saved published since the last deploy, fires the deploy                                                                                                                                                                                                                                | Dispatch runs at 09:30Z on 2026-09-25 and 2026-09-30, matching the image upload and team edit                                                                                     |
| `kcvv_birthdays_daily`                                       | `5 9 * * *`                             | enabled      | Posts today's birthdays to Slack `#general`                                                                                                                                                                                                                                                          | Not checkable from outside (Slack)                                                                                                                                                |
| `kcvv_birthdays_weekly`                                      | `0 9 * * 1`                             | enabled      | Posts the week's birthdays to Slack                                                                                                                                                                                                                                                                  | Same                                                                                                                                                                              |
| core: `node`, `scheduler`, `search_api`, `file`, `system`, … | defaults                                | enabled      | Drupal housekeeping; `scheduler` publishes `publish_on` nodes                                                                                                                                                                                                                                        | —                                                                                                                                                                                 |

**Deploy cadence it drives.** `gh run list -R soniCaH/KCVV-Elewijt-Gatsby -w netlify-deploy-api.yml`:
5–13 runs a month from 2025-11 to 2026-10, every one a `workflow_dispatch` — the only trigger that
workflow has. Drupal is the thing that rebuilt the live `www`.

**PSD quota.** 16 teams × 2 calls = **32 PSD requests a week**, all on Monday 05:00. Against the shared
daily quota ([#3059](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3059)) this is noise; the AWS
Lambdas are the real spender.

**Mail.** Core `php_mail` only; no SMTP module. The outgoing channel is Slack.

**Disabled custom module.** `kcvv_vv` (Voetbal Vlaanderen API) is in the codebase but not enabled — it
does not run, but its `kcvv_vv.netlify` service is what `kcvv_netlify` and `kcvv_psd` call.

**Public surfaces.** The JSON:API and the `search_api` index the Gatsby search box calls were open
without login, because the old site needed them.

## 3. Who depends on it — caller → reads → breaks

| Caller                                                                          | What it reads                                                                                                                                      | What breaks if Drupal is gone                                                                                                                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Old Gatsby site** (`www` until the flip) — build                              | `gatsby-source-drupal`, `baseUrl: GATSBY_API_DOMAIN`, `apiBase: jsonapi` (`gatsby-config.ts`)                                                      | Every build fails. Irrelevant once `www` points at Vercel                                                                                                                   |
| Old Gatsby site — runtime                                                       | Body HTML rewritten `/sites/default/` → `${GATSBY_API_DOMAIN}/sites/default/` (`src/templates/Article.tsx`, `Page.tsx`, `Player.tsx`, `Staff.tsx`) | Inline images/files in old article, page, player and staff bodies 404                                                                                                       |
| Old Gatsby site — runtime                                                       | The search index (`src/components/SearchContainer.tsx`)                                                                                            | Old site search returns nothing                                                                                                                                             |
| Old Gatsby site — deploy trigger                                                | Drupal → GitHub `workflow_dispatch` + Netlify build hook                                                                                           | No more rebuilds. Desired after the flip                                                                                                                                    |
| Slack `#general`                                                                | Birthday posts, cron logs                                                                                                                          | Birthday posts stop                                                                                                                                                         |
| **New site** (`apps/web`) — runtime                                             | Nothing. `next.config.ts` `images.remotePatterns` and `components/share/shared/theme.ts` `OPTIMIZER_HOSTS` listed the host                         | Nothing: no Sanity document or asset points at the host. Both entries were dead config (since removed)                                                                      |
| New site — `/player/[slug]`, `/players/`, `/staff/[slug]` resolver routes       | **Sanity**, not Drupal (`lib/seo/legacy-redirect.ts` → `fetchPlayerRows()`)                                                                        | Nothing                                                                                                                                                                     |
| New site — Sanity article `article-drupal-94acfa51-797f-445f-8192-d1d7600346f9` | A relative Portable Text link to `/sites/default/files/uploads/LEERPLAN_KCVVE_Versie22072019_digitaal.pdf`                                         | **Already broken**: `404` on the new site and on Netlify `www`. Fix: point it at `/downloads/leerplan-jeugdopleiding-2019.pdf`, which ships in `apps/web/public/downloads/` |
| New stack — BFF / PSD sync (`apps/api`)                                         | Nothing from Drupal. Shares the **same PSD API key and club key**                                                                                  | Nothing functional                                                                                                                                                          |
| `apps/studio/scripts/migrate-drupal-node.ts`                                    | Read the JSON:API                                                                                                                                  | Deleted in [#3479](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3479)                                                                                               |
| `uitbetaling`, `sponsorship-platform`, `kcvv-api-psd` (AWS)                     | —                                                                                                                                                  | Nothing (no reference)                                                                                                                                                      |

**Sanity scan, 2026-10-18** (read-only GROQ on `production`, 930 non-system documents, 885 assets):
`api.kcvvelewijt.be` appears **0** times in any `body[].markDefs[].href`, `htmlTable.html` or
`fileAttachment`; `sites/default/files` appears **once** (the leerplan link above); no image or file
asset has a `source.url` — every migrated image was copied into the Sanity CDN. `/player/` links:
**0**. Monorepo grep: the only other mentions of Drupal are `article-drupal-*` / `event-drupal-*` /
`sponsor-drupal-*` ids in test fixtures and seeds, which are names, not URLs.

## 4. Data that existed only in Drupal

Diffed by UUID: Sanity ids `article-drupal-<uuid>`, `event-drupal-<uuid>`, `sponsor-drupal-<uuid>`
against every node the JSON:API returned. All of it is in the backup.

| Drupal type                 | Drupal nodes                                                    | In Sanity                                              | Only in Drupal                                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `article`                   | 125 (2018–2026)                                                 | 120 by id + 5 re-authored by hand (same titles)        | **0**                                                                                                                                                                                                                       |
| `event`                     | 82                                                              | 77 by id + 5 re-authored                               | **1**: "De plezantste (eindeseizoens)barbecue" (2026-05-13, past)                                                                                                                                                           |
| `sponsor`                   | 31                                                              | 33 (2 extra in Sanity)                                 | 0                                                                                                                                                                                                                           |
| `page`                      | 3                                                               | `privacy` is a code route; `cashless` is a Sanity page | **"Algemene voorwaarden: Cashless Clubkaart"** (`/club/cashless/voorwaarden`, 3 730 chars of HTML). The new site 308s it to `/club/cashless`, whose Sanity body is 1 311 chars. The full terms were probably only in Drupal |
| `kcvv_tv`                   | 73 (2019-12 → 2024-10)                                          | no such type                                           | **all 73** (title, link, cover image)                                                                                                                                                                                       |
| `potw` (player of the week) | 5 (Feb–Mar 2020)                                                | no such type                                           | **all 5**                                                                                                                                                                                                                   |
| `player`                    | 615                                                             | 375 (PSD-driven roster)                                | **~240 former players**: bios, photos, position, join/leave dates, shirt number                                                                                                                                             |
| `staff`                     | 140                                                             | 166 `staffMember`                                      | Former staff bios and photos                                                                                                                                                                                                |
| `team`                      | 19                                                              | 27                                                     | Historic tagline, contact info, Facebook id — superseded                                                                                                                                                                    |
| Files                       | highest `fid` 1 144, highest media `mid` 485, newest 2026-09-25 | Migrated ones copied                                   | Any file referenced only by the nodes above (KCVV TV covers, former-player photos, body uploads like the leerplan PDF)                                                                                                      |

Per the [#2532](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2532) findings, the per-person
values are stale by default (54 % of checkable shirt numbers were wrong) — this is an **archive**, not
migration input.

## 5. Secrets that left with it

Names only.

| Secret                                               | Shared with the new stack?                                                   | Status                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| PSD API key + club key (in the Drupal code)          | **Yes** — the same values the new BFF uses (compared by hash, never printed) | Cannot be rotated: ProSoccerData issues no new keys |
| GitHub personal token (dispatched the Gatsby deploy) | No                                                                           | Revoked 2026-10-19                                  |
| Netlify build hook                                   | No                                                                           | Dies with the Netlify site                          |
| Slack incoming webhook (birthday posts)              | Possibly the workspace the Lambdas post to                                   | Revoke in Slack                                     |
| Database credentials, `hash_salt`                    | No                                                                           | Die with the site                                   |

## 6. Order this implied for the delete plan

1. **Before the flip, nothing.** The old `www` needed Drupal until DNS moved.
2. **Right after the flip:** stop Drupal cron. That stops the weekly PSD calls, the Gatsby rebuilds
   and the Slack posts.
3. **Before any delete:** fix the one leerplan link in Sanity; back up the database and the files;
   mirror the repo.
4. **Delete:** remove the site and its database from the server, drop the `api.kcvvelewijt.be` record,
   remove the two allowlist entries from `apps/web`.
5. **Revoke:** the GitHub token, the Netlify build hook, the Slack webhook.

The runbook [#3580](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3580) turned this into its
phases 2.2, 2.3 and 5.

## Open on 2026-10-18 — what only the owner could answer

- The cron trigger and the deploy script on the server.
- The database and files size, and whether a private files directory holds anything.
- Does anyone still read the Slack birthday posts?
- **Cashless terms.** Is the 3 730-char Drupal page the current terms, and should it live on
  `/club/cashless`?
- **KCVV TV and player-of-the-week.** Keep as an archive only, or bring any of it to Sanity?
- **Former-player archive.** Keep the bios/photos of ~240 ex-players, or let them go.
