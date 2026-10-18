# Drupal `kcvv-data-api` — what it runs, and what still depends on it

Research ticket [#3550](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3550), on map
[#3547](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3547). Gathered 2026-10-18, read-only:
the local repo `~/Sites/KCVV/kcvv-data-api`, this monorepo, `~/Sites/KCVV/KCVV-Elewijt-Gatsby`,
`~/Sites/KCVV/uitbetaling`, `~/Sites/KCVV/sponsorship-platform`, `dig`, `whois`, HTTP GETs against the
public JSON:API, the GitHub API (`gh run list`), and read-only GROQ queries on the Sanity
`production` dataset. Nothing was written, no server was logged into, no `drush` was run.

**Not read: the server itself.** The crontab that drives Drupal cron, the database size, the files
directory on disk, nginx/PHP config and the Hetzner invoice are all on the box or in the Hetzner
account. Each gap is listed under [Open](#open--what-only-the-owner-can-answer).

Secret values were seen in the repo while reading it. They are **named, never quoted**, here.

## Answer in one screen

| Question | Answer |
| --- | --- |
| What is it | Drupal **8** (EOL Nov 2021) headless CMS, PHP **7.1.11**, nginx **1.10.3**, MySQL on `127.0.0.1` |
| Where | `api.kcvvelewijt.be` → `88.99.213.134` = Hetzner `fsn1-dc1` (Falkenstein, DE), PTR `lacerta.be` |
| Same box also runs | `git.lacerta.be` (self-hosted GitLab, the repo's remote and CI) and `lacerta.be` |
| Deploy | GitLab CI on `master`: `sudo -u footbalisto gitlab-ci.sh api` — a shell runner on that same server |
| Who pays | Not visible from outside; a Hetzner server on Kevin's own `lacerta.be` (owner to confirm) |
| Is it still live | Yes. Articles were authored there until 2026-07-08, an image uploaded 2026-09-25, a team node edited 2026-09-30, and the PSD sync last wrote 2026-10-12 |
| Crons that run | Weekly PSD player/staff sync (Mon 05:00 local) → triggers the old Gatsby site's deploy; a 30-min "deploy if changed" job; daily + weekly Slack birthday posts |
| PSD quota spent | 32 calls a week (16 teams × `/members` + `/staff`). Negligible next to the AWS Lambdas |
| New site depends on it | **Nothing at runtime.** Two leftover host allowlists, one broken relative link in one Sanity article |
| Old Gatsby site depends on it | **Everything** — builds from its JSON:API, hotlinks body images/files, runtime search |
| `uitbetaling`, `sponsorship-platform` | No reference at all |
| Data found only there | Cashless terms page, 73 KCVV TV items, 5 "player of the week" nodes, ~240 former players/staff with bios and photos, one past event, Drupal redirects |
| Biggest risk found | The live PSD API key and club key are **hard-coded in the repo since 2021-03-19** and are the same keys the new BFF uses. A personal-data exposure on the public site (details kept off this public repo) |

## 1. Where it runs

- **DNS.** `api.kcvvelewijt.be A 88.99.213.134` (record lives in the Netlify-served `kcvvelewijt.be`
  zone, NS `dns{1..4}.p07.nsone.net`). `whois`: `netname HETZNER-fsn1-dc1`, Hetzner Online GmbH, DE.
  Reverse DNS `lacerta.be.`; `lacerta.be` and `git.lacerta.be` resolve to the same IP, and
  `lacerta.be`'s zone is on Hetzner DNS (`helium.ns.hetzner.de`, …).
- **HTTP** (`curl -I https://api.kcvvelewijt.be/`): `server: nginx/1.10.3`, `x-powered-by: PHP/7.1.11`,
  `x-generator: Drupal 8`, `x-drupal-cache: HIT`, `cache-control: max-age=86400, public`.
  TLS: Let's Encrypt, issued 2026-10-01, valid to 2026-12-30, SAN `api.kcvvelewijt.be` only — so a
  certbot renewal job is alive on the box.
- **Shared box.** `git.lacerta.be` (GitLab, `302` → `/users/sign_in`) and `lacerta.be` answer from the same
  nginx. **Retiring Drupal is a site removal on a shared server, not a server deletion.**
- **Deploy.** `.gitlab-ci.yml`: one `build` job on `master` running
  `sudo -u footbalisto gitlab-ci.sh api`. The script itself is not in the repo (it lives on the server).
  `.travis.yml` is the composer-template leftover and does not run.
- **Database.** `web/sites/default/settings.local.php` (git-ignored, present locally): MySQL database
  `kcvv` on `127.0.0.1:3306`. Credentials exist there; not quoted.
- **Repo.** 237 commits, 2019-06-28 → 2026-01-20, all by Kevin. Last three: "Config exported",
  "Add decoupled router and subrequest modules" (2026-01-20), "Disable dynamic cache" (2025-06-03).

## 2. What runs

Cron jobs are `ultimate_cron` config entities (`config/sync/ultimate_cron.job.*.yml`). Something on the
server must call Drupal cron (system crontab with `drush cron` or the cron URL) — that trigger is not in
the repo, but its effect is measured below.

| Job | Schedule | Status | What it does | Evidence it runs |
| --- | --- | --- | --- | --- |
| `kcvv_psd` → `kcvv_psd_cron()` | `0 5 * * 1` (Mon 05:00 Europe/Brussels) | enabled | For every published `team` with `field_vv_id` (16), GETs PSD `/teams/{id}/members` and `/teams/{id}/staff`, find-or-creates `player`/`staff` nodes **by first + last name**, sets `field_vv_id`, publishes, saves. If anything synced: POSTs the Netlify build hook and a GitHub `workflow_dispatch` | Newest `player`/`staff` nodes `created = changed = 2026-10-12T03:00:01Z`; Gatsby workflow "Deploy content to production" ran 2026-10-12 03:00:21Z, 2026-10-05 03:00:20Z, 2026-09-28 03:00:22Z |
| `kcvv_psd_cron` (default handler) | — | **disabled** | Duplicate of the above | — |
| `kcvv_netlify_cron` | `*/30+@ * * * *` | enabled | If a node was saved published since the last deploy, fires the deploy | Dispatch runs at 09:30Z on 2026-09-25 and 2026-09-30, matching the image upload and team edit |
| `kcvv_birthdays_daily` | `5 9 * * *` | enabled | Posts today's birthdays to Slack `#general` as `kcvve` | Not checkable from outside (Slack) |
| `kcvv_birthdays_weekly` | `0 9 * * 1` | enabled | Posts the week's birthdays to Slack | Same |
| core: `node`, `scheduler`, `search_api`, `file`, `system`, … | defaults | enabled | Drupal housekeeping; `scheduler` publishes `publish_on` nodes | — |

**Deploy cadence it drives.** `gh run list -R soniCaH/KCVV-Elewijt-Gatsby -w netlify-deploy-api.yml`:
5–13 runs a month from 2025-11 to 2026-10, every one a `workflow_dispatch` — the only trigger that
workflow has. Drupal is the thing that rebuilds the live `www`.

**PSD quota.** 16 teams × 2 calls = **32 PSD requests a week**, all on Monday 05:00. Against the shared
daily quota ([#3059](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3059)) this is noise; the AWS
Lambdas are the real spender (map #3547 Notes).

**Mail.** `system.mail` = `php_mail`. No SMTP module is enabled; no Drupal feature sends mail beyond core
account mails. The outgoing channel is Slack (`slack` module, `slack.settings.slack_webhook_url`).

**Disabled custom module.** `kcvv_vv` (Voetbal Vlaanderen API) is in the codebase but not in
`core.extension` — it does not run, but its `kcvv_vv.netlify` service is what `kcvv_netlify` and
`kcvv_psd` call, so it is loaded as a service provider anyway.

**Public surfaces (anonymous).** Role `anonymous` has `access content`, `view media`,
`issue subrequests`, `administer crop types` (sic). So these are open without login:

- `/jsonapi/**` — every node type, `file--file`, `media--image`, `redirect--redirect`,
  `taxonomy_term--category`, `user--user` (7 users, `display_name` only, no mail).
- `/jsonapi/index/kcvv_content` — the `search_api` index the Gatsby search box calls.

## 3. Who depends on it — caller → reads → breaks

| Caller | What it reads | What breaks if Drupal is gone |
| --- | --- | --- |
| **Old Gatsby site** (`www` until the flip) — build | `gatsby-source-drupal`, `baseUrl: GATSBY_API_DOMAIN`, `apiBase: jsonapi` (`gatsby-config.ts`) | Every build fails. Irrelevant once `www` points at Vercel |
| Old Gatsby site — runtime | Body HTML rewritten `/sites/default/` → `${GATSBY_API_DOMAIN}/sites/default/` (`src/templates/Article.tsx`, `Page.tsx`, `Player.tsx`, `Staff.tsx`) | Inline images/files in old article, page, player and staff bodies 404 |
| Old Gatsby site — runtime | `https://api.kcvvelewijt.be/jsonapi/index/kcvv_content?filter[fulltext]=` (`src/components/SearchContainer.tsx`) | Old site search returns nothing |
| Old Gatsby site — deploy trigger | Drupal → `api.github.com/repos/soniCaH/KCVV-Elewijt-Gatsby/actions/…` dispatch + Netlify build hook | No more rebuilds. Desired after the flip |
| Slack `#general` | Birthday posts, cron logs | Birthday posts stop. Owner decides if anyone still reads them |
| **New site** (`apps/web`) — runtime | Nothing. `next.config.ts` `images.remotePatterns` allows `api.kcvvelewijt.be`; `components/share/shared/theme.ts` `OPTIMIZER_HOSTS` lists it | Nothing: no Sanity document or asset points at the host (scan below). Both entries are dead config to remove with the shutdown |
| New site — `/player/[slug]`, `/players/`, `/staff/[slug]` resolver routes | **Sanity**, not Drupal (`lib/seo/legacy-redirect.ts` → `fetchPlayerRows()`) | Nothing |
| New site — Sanity article `article-drupal-94acfa51-797f-445f-8192-d1d7600346f9` | A Portable Text link `href: /sites/default/files/uploads/LEERPLAN_KCVVE_Versie22072019_digitaal.pdf` (relative) | **Already broken today**: `404` on `kcvv-nextjs.vercel.app` and on Netlify `www`; `200` only on `api.kcvvelewijt.be`. Fix: point it at `/downloads/leerplan-jeugdopleiding-2019.pdf`, which already ships in `apps/web/public/downloads/` |
| New stack — BFF / PSD sync (`apps/api`) | Nothing from Drupal. Shares the **same PSD API key and club key** (see §5) | Nothing functional; the key leak outlives Drupal unless rotated |
| `apps/studio/scripts/migrate-drupal-node.ts` | Read the JSON:API | Deleted in [#3479](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3479); no script in the monorepo reads Drupal any more |
| `uitbetaling` | — | Nothing (no Drupal, JSON:API or `api.kcvvelewijt.be` reference; it reads its own `DATABASE_URL`) |
| `sponsorship-platform` | — | Nothing (no reference) |
| `kcvv-api-psd` (AWS) | — | Nothing (no reference) |

**Sanity scan, 2026-10-18** (read-only GROQ on `production`, 930 non-system documents, 885 assets):
`api.kcvvelewijt.be` appears **0** times in any `body[].markDefs[].href`, `htmlTable.html` or
`fileAttachment`; `sites/default/files` appears **once** (the leerplan link above); no image or file
asset has a `source.url` at all — every migrated image was copied into the Sanity CDN. `/player/` links:
**0** (the 59 measured on 2026-09-10 have since been fixed). Monorepo grep: the only other mentions
of Drupal are `article-drupal-*` / `event-drupal-*` / `sponsor-drupal-*` ids in test fixtures and seeds,
which are names, not URLs.

## 4. Data that exists only in Drupal

Diffed by UUID: Sanity ids `article-drupal-<uuid>`, `event-drupal-<uuid>`, `sponsor-drupal-<uuid>`
against every node the anonymous JSON:API returns.

| Drupal type | Drupal nodes | In Sanity | Only in Drupal |
| --- | --- | --- | --- |
| `article` | 125 (2018–2026) | 120 by id + 5 re-authored by hand (same titles) | **0** |
| `event` | 82 | 77 by id + 5 re-authored | **1**: "De plezantste (eindeseizoens)barbecue" (2026-05-13, past) |
| `sponsor` | 31 | 33 (2 extra in Sanity) | 0 |
| `page` | 3 | `privacy` is a code route; `cashless` is a Sanity page | **"Algemene voorwaarden: Cashless Clubkaart"** (`/club/cashless/voorwaarden`, 3 730 chars of HTML). The new site 308s it to `/club/cashless`, whose Sanity body is 1 311 chars. The full terms are probably only in Drupal — owner to confirm |
| `kcvv_tv` | 73 (2019-12 → 2024-10) | no such type | **all 73** (title, link, cover image) |
| `potw` (player of the week) | 5 (Feb–Mar 2020) | no such type | **all 5** |
| `player` | 615 | 375 (PSD-driven roster) | **~240 former players**: `body` bios, `field_image` + `field_image_celebrate` photos, `field_position`, `field_join_date`, `field_date_leave`, `field_shirtnumber` |
| `staff` | 140 | 166 `staffMember` | Former staff bios and photos (not diffed by id: Sanity staff were seeded from PSD/organigram, not from Drupal ids) |
| `team` | 19 | 27 | Historic `field_tagline`, `field_contact_info`, `field_fb_id` — superseded |
| `redirect--redirect` | not counted | n/a | Drupal-side redirects on the `api` host only |
| Files | highest `fid` 1 144, highest media `mid` 485, newest 2026-09-25 | Migrated ones copied | Any file referenced only by the nodes above (KCVV TV covers, former-player photos, body uploads like the leerplan PDF) |

Per the [#2532](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2532) findings, the
per-person values are stale by default (54% of checkable shirt numbers were wrong) — this is an
**archive**, not migration input. The map's rule "back up all old data before any delete" covers it:
a `mysqldump` of `kcvv` plus a tarball of `web/sites/default/files/` (public and `private/`) is the
whole archive.

## 5. Secrets that leave with it

Names and locations only.

| Secret | Where | Shared with the new stack? |
| --- | --- | --- |
| PSD `API_KEY` + `API_CLUB_KEY` | **Hard-coded constants** in `web/modules/custom/kcvv_psd/src/KcvvPsdSyncPlayersService.php`, in git since commit `68828b7` (2021-03-19), so also on `git.lacerta.be` | **Yes** — byte-identical to the values in `apps/api/.dev.vars` and in `kcvv-api-psd/serverless.yml` (compared with `grep -c -F`, values never printed) |
| GitHub classic PAT (`ghp_…`) | `settings.local.php` override of `kcvv_netlify.kcvvnetlify.kcvv_netlify_google_build_hook_authentication` (git-ignored; the committed config holds a placeholder, and `config_ignore` keeps it out of exports) | Proven live: it dispatches `soniCaH/KCVV-Elewijt-Gatsby` workflows weekly. Its scopes are unknown — a classic PAT may reach every `soniCaH` repo, this one included |
| Netlify build hook URL | `config/sync/kcvv_netlify.kcvvnetlify.yml` (committed) | Netlify site of the old Gatsby build |
| Slack incoming webhook | `config/sync/slack.settings.yml` (committed) | Possibly the same workspace the Lambdas post `[LAMBDA UPDATE]` to |
| MySQL user/password, `hash_salt` | `settings.local.php`, `settings.php` (git-ignored) | No |

Consequence for the map's "copy `git.lacerta.be/kevin/kcvv-data-api` to a private archived GitHub repo"
step: the copy carries the live PSD keys, the Netlify hook and the Slack webhook in history. Either
rotate those first, or accept that a private GitHub repo now also holds them.

## 6. Order this implies for the delete plan

1. **Before the flip, nothing.** The old `www` needs Drupal until DNS moves.
2. **Right after the flip:** stop Drupal cron (or disable `kcvv_psd`, `kcvv_netlify_cron` and the two
   birthday jobs). That stops the weekly PSD calls, the Gatsby rebuilds and the Slack posts.
3. **Early, independent of the flip:** close the personal-data exposure (details kept off this public repo). Owner call.
4. **Before any delete:** fix the one leerplan link in Sanity; back up the `kcvv` database and
   `sites/default/files`; mirror the repo.
5. **Delete:** remove the `api` vhost and its database from the Hetzner box (GitLab and `lacerta.be`
   stay), drop the `api.kcvvelewijt.be` A record from the Netlify zone, remove the two allowlist
   entries from `apps/web`.
6. **Rotate/revoke:** the GitHub PAT, the Netlify build hook (dies with the Netlify site), the Slack
   webhook, and — because they are in git history — the PSD keys (needs PSD; shared with the new BFF,
   so this is a coordinated swap, not a delete).

## Open — what only the owner can answer

- **Server access and cost.** Who pays the Hetzner server, which plan, and whether anything else besides
  GitLab and `lacerta.be` lives on it. Needs the Hetzner console or a login.
- **The cron trigger.** Which crontab line calls Drupal cron (`drush cron`, `/cron/<key>` or
  `ultimate_cron`'s own launcher). Only visible on the server; its effect is measured above.
- **`gitlab-ci.sh`.** What the deploy script does (`composer install`, `drush cim`, `drush updb`?).
  Lives on the server, not in the repo.
- **Database and files size**, and whether `sites/default/files/private/` holds anything (e.g. form
  uploads). Needs the server.
- **The GitHub PAT's scopes and owner.** Visible in GitHub → Settings → Developer settings → Tokens.
- **Slack.** Does anyone still read the birthday posts, and is the webhook the same one the AWS Lambdas
  use?
- **Cashless terms.** Is the 3 730-char Drupal page the current terms, and should it live on
  `/club/cashless`?
- **KCVV TV and player-of-the-week.** Keep as an archive only, or bring any of it to Sanity?
- **Former-player archive.** Keep the bios/photos of ~240 ex-players, or let them go (GDPR leans
  toward letting the birth dates go).
