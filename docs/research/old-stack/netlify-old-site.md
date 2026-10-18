# The old site's Netlify project — what it runs besides `www`

Research ticket [#3551](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3551), on map
[#3547](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3547). Gathered 2026-10-18, read-only:
local repos, `dig` against the authoritative name server, `whois`, HTTP headers, the GitHub API.
No setting, record or deploy was changed.

**Not read: the Netlify account itself.** No `netlify` CLI is installed and no Netlify token exists on
this machine (`~/.netlify` and `~/Library/Preferences/netlify` are absent), so the site list, the plan,
the full DNS-record list and the Netlify-side env vars are inferred from DNS, HTTP and the repos, never
read from Netlify. Each gap is listed under [Open](#open--what-only-the-netlify-dashboard-can-answer).

## Answer in one screen

| Piece | What it is | Verdict |
| --- | --- | --- |
| Netlify site `kcvvelewijt` (`kcvvelewijt.netlify.app`) | Gatsby static build; primary `www`, alias `sponsoring` | **Goes with the old site** — after `sponsoring` and the vanity redirects move |
| `sponsoring.kcvvelewijt.be` | Domain alias on that same site; one forced `302!` rule to a Cloudflare Worker | **Must move first** |
| 7 vanity short-links in `_redirects` (`/cornet`, `/tornooi`, …) | Only on the old site; 404 on the new site today | **Must move first** (or be dropped on purpose) |
| Netlify DNS zone `kcvvelewijt.be` | Authoritative for the whole domain, incl. all e-mail records | **Never touch** (a zone migration is a separate job) |
| Netlify account/team | Also hosts `demeestertuinwerken.be` (site + DNS zone) | **Never delete** |
| Drupal `kcvv_netlify` module | Fires a Netlify build hook + a GitHub `workflow_dispatch` | Goes with Drupal; its GitHub token must be revoked |
| GitHub Actions in `KCVV-Elewijt-Gatsby` | The real build+deploy path (`netlify deploy --prod`) | Goes with the old site |

## 1. Sites and domains

**What is proven from outside:**

- `www.kcvvelewijt.be` → `server: Netlify`, `200` (curl, 2026-10-18).
- `sponsoring.kcvvelewijt.be` → `server: Netlify`, `302` to
  `https://kcvv-sponsorship-web.kevin-van-ransbeeck.workers.dev/` (curl, 2026-10-18).
- `kcvvelewijt.netlify.app` → `server: Netlify`, `200`.
- Both hostnames resolve to the same Netlify load-balancer addresses (`35.157.26.135`,
  `63.176.8.218`, `2a05:d014:58f:6200::258/::259`).
- The live cert on `www` is Let's Encrypt `YE2`, `CN=*.kcvvelewijt.be`, SAN
  `*.kcvvelewijt.be, kcvvelewijt.be`, **valid until 13 Jan 2027** (`openssl s_client`, 2026-10-18 —
  it renewed since the 14 Nov 2026 date recorded in September).

**Domain roles on site `kcvvelewijt`** (dashboard screenshot, 2026-09-14, recorded in the
`dns_zone_netlify_pseudo_records` memory and #2959): `www` = primary domain; apex = auto-redirect
to primary (since 2026-09-14 the apex runs on Vercel, `A 216.198.79.1`); `sponsoring` = domain alias.

**Other sites in the same Netlify team.** Only one other repo of `soniCaH` deploys to Netlify:
`gh search code --owner soniCaH --filename netlify.toml` returns `KCVV-Elewijt-Gatsby` and
`demeestertuinwerken.be`. `demeestertuinwerken.be` is served by Netlify (`server: Netlify`) **and**
its DNS zone sits on the same Netlify DNS name servers (`dns1-4.p07.nsone.net`). Whether it is in the
same team cannot be read without the dashboard; treat it as the same account. It is not a club site.

`preview.kcvvelewijt.be` shows up in certificate transparency (crt.sh) and in Drupal's
`kcvv_frontend_url` config, but has **no DNS record** today. Dead.

## 2. Build, deploy, functions, forms, redirects, env

Source: `~/Sites/KCVV/KCVV-Elewijt-Gatsby`, last commit `7c70d4a` 2026-09-10 (= `origin/master`).

**Build.** `netlify.toml`: `command = "yarn run build"`, `publish = "public/"`, plugins
`@netlify/plugin-gatsby`, `@netlify/plugin-sitemap`, `netlify-plugin-inline-critical-css`,
`netlify-plugin-submit-sitemap` (pings Google/Bing with `https://www.kcvvelewijt.be/sitemap.xml`
after each Netlify-side build), one `[[headers]]` block (no-cache on `/*`).

**Deploys do not really come from Netlify builds.** They come from GitHub Actions, which build on
the runner and push the folder with the Netlify CLI (`South-Paw/action-netlify-cli@v2`,
`deploy --dir=public --prod`):

| Workflow (file) | State on GitHub | Trigger |
| --- | --- | --- |
| Deploy content to production (`netlify-deploy-api.yml`) | active | `workflow_dispatch` only — **34 of the last 40 runs**, latest 2026-10-12, all green |
| Build production (`netlify-master.yml`) | disabled_inactivity | push to `master` + cron `30 5,16 * * *` |
| Build deploy preview (`netlify-pr.yml`) | active | pull requests |
| CodeQL | disabled_inactivity | — |

GitHub secret **names** used: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, `GATSBY_API_DOMAIN`,
`GATSBY_GTM_ID`, `KCVV_PSD_API`, `TYPEKIT_ID`.

**Who dispatches it: Drupal.** `kcvv-data-api/web/modules/custom/kcvv_netlify/src/KcvvNetlifyDeployService.php`
→ `deployChanges()`: when content changed, it POSTs to a **Netlify build hook** (config key
`kcvv_netlify_build_hook_url`) and to
`https://api.github.com/repos/soniCaH/KCVV-Elewijt-Gatsby/actions/workflows/netlify-deploy-api.yml/dispatches`
with a bearer token (config key `kcvv_netlify_google_build_hook_authentication`). The GitHub runs show
`actor = triggering_actor = soniCaH`, so that token is **a personal GitHub token of Kevin's**. The
committed config holds a placeholder; the live value lives in Drupal's database. Values not copied.

**Netlify Functions: none.** No `functions/`, `netlify/functions/` or `[functions]` in `netlify.toml`;
the source uses no `getServerData` and no `defer` (DSG), so `@netlify/plugin-gatsby` emits no SSR/DSG
functions.

**Netlify Forms: none.** No `data-netlify`, `netlify-honeypot` or `netlify="true"` anywhere in `src/`.
The site's forms are Google Forms (`forms.gle`).

**Redirects.** `static/_redirects`, 17 lines (copied to `public/_redirects`):

| Line(s) | What | On the new site? |
| --- | --- | --- |
| 7 `/news/2020-…` slug fixes (301) | old article slugs | not needed — `/news/*` is handled by the new site's legacy redirects (#2959 "Legacy URL redirects") |
| `/stage` → `/news/2023-09-30-herfststage-2023` (302) | vanity | **no** — `404` on `kcvv-nextjs.vercel.app` |
| `/cornet` → Trooper webshop (302) | vanity | **no** — `404` |
| `/tornooi` → `tournify.nl/live/kcvvelewijt2025` (302) | vanity | **no** — `404` |
| `/bbq`, `/receptie`, `/foodfriday` → Google Forms (302) | vanity | **no** — `404` each |
| `/recrea` → `tournify.nl/live/kcvve-recrea25` (302) | vanity | **no** — `404` |
| `/ongeval` → `/club/downloads/` (302) | QR on print | **yes** — `next.config.ts` sends it to `/hulp#sportongeval` (307, #3014) |
| `/evenementen` → `/events/` (302) | route | **yes** — `/evenementen` is the new route |
| `https://sponsoring.kcvvelewijt.be/*` → workers.dev `/:splat` (`302!`) | **sponsoring** | **no** — and it cannot be, see §4 |

`static/darts/poster-liggend.jpg` is also served by the new site (`200`).

**Netlify-side env vars:** not readable without the dashboard. The repo's builds take every value
from GitHub secrets, so Netlify env vars matter only to Netlify-side builds from the build hook.

## 3. The `kcvvelewijt.be` DNS zone

**Registrar: Realtime Register B.V.** (`whois -h whois.dns.be kcvvelewijt.be`), registered
2006-11-06. Realtime Register is a wholesale registrar; the reseller the club pays is not shown in
whois. **No DNSSEC** (no `DS` record at `.be`).

**Authoritative:** Netlify DNS (NS1) — `NS dns1-4.p07.nsone.net`, SOA
`dns1.p07.nsone.net. domains+netlify.netlify.com.`. A zone transfer (`AXFR`) is refused, so the list
below is every record **found** by querying 80+ names; it matches the zone CSV exported on 2026-09-14
except where noted.

### Vercel (new site)

| Name | Type | Value | TTL |
| --- | --- | --- | --- |
| `kcvvelewijt.be` | `A` | `216.198.79.1` | 60 |

### Netlify (old site)

| Name | Type | Value | TTL served |
| --- | --- | --- | --- |
| `www` | `NETLIFY` + `NETLIFYv6` (pseudo) | `kcvvelewijt.netlify.app` → 2× A, 2× AAAA | 120 / 311 |
| `sponsoring` | `NETLIFY` + `NETLIFYv6` (pseudo) | `kcvvelewijt.netlify.app` → 2× A, 2× AAAA | 120 / 311 |

### E-mail

| Name | Type | Value | Owner |
| --- | --- | --- | --- |
| `kcvvelewijt.be` | `MX` ×5 | `aspmx.l.google.com` (1), `alt1/alt2` (5), `alt3/alt4` (10) | Google Workspace |
| `kcvvelewijt.be` | `TXT` | `v=spf1 include:my.billit.be` | Billit (sponsortool) |
| `_dmarc` | `TXT` | `v=DMARC1; p=none; rua=mailto:dmarc@kcvvelewijt.be;` | shared |
| `resend._domainkey` | `TXT` | DKIM key | Resend (new site's forms) |
| `send` | `MX` | `10 feedback-smtp.eu-west-1.amazonses.com` | Resend return-path |
| `send` | `TXT` | `v=spf1 include:amazonses.com ~all` | Resend return-path |
| `_amazonses` | `TXT` | SES verification token | Amazon SES |
| 3× `<token>._domainkey` | `CNAME` | `*.dkim.amazonses.com` | Amazon SES — **names not found by query** (random tokens); in the 2026-09-14 CSV |
| `20221018125637pm._domainkey` | `TXT` | DKIM key | Postmark |
| `sponsit-bounces` | `CNAME` | `pm.mtasv.net` | Postmark (sponsortool bounces) |

### Other

| Name | Type | Value | Owner |
| --- | --- | --- | --- |
| `kcvvelewijt.be` | `TXT` | `google-site-verification=…` | Google Search Console / Workspace |
| `kcvvelewijt.be` | `TXT` | `facebook-domain-verification=…` | Meta |
| `api` | `A` | `88.99.213.134` | legacy Drupal (map #3547 owns it) |

No `CAA` record and no wildcard on any name.

## 4. Where `sponsoring` is built from

`~/Sites/KCVV/sponsorship-platform` (GitHub `soniCaH/kcvv-sponsoring`, last commit 2026-10-14). It is a
Cloudflare Worker, `kcvv-sponsorship-web` (`apps/web/wrangler.jsonc`), with its own staging worker,
crons, D1 and R2, deployed by GitHub Actions. **Netlify hosts none of it.**

`docs/operations/production-launch.md` §0 and §5 (decided 2026-05-29) say why Netlify is in the path
at all: the canonical URL is the `workers.dev` host because a Cloudflare custom domain needs the zone
on Cloudflare, and the zone stays on Netlify. So `sponsoring.kcvvelewijt.be` is a **domain alias on the
`www` Netlify site plus one forced redirect rule** — the same rule that lives in the Gatsby repo's
`_redirects` (commit `f4d7e78`, #2221). OAuth and `AUTH_URL` use the `workers.dev` host, so nothing
logs in on `sponsoring.kcvvelewijt.be`; it is a friendly link only.

One loose end in that repo: `docs/operations/cron-runbook.md` shows a manual
`curl -X POST https://sponsoring.kcvvelewijt.be/api/cron`. Through a `302` that POST does not reach
the worker as a POST; it should name the `workers.dev` host.

**The `www` flip itself does not break `sponsoring`** (it only replaces `www`'s pseudo-records).
**Deleting the Netlify site does**: the alias and its redirect rule live on that site.

## 5. Plan cost

**Not readable without the dashboard.** Nothing in the repos or DNS names a plan. Build minutes are
spent on GitHub runners, not Netlify, so the site needs nothing beyond Netlify's free tier — but
whether the team is on Free/Starter or a paid plan is unknown. Read it at Netlify → team → *Billing*.

## Three lists

### Can go with the old site (after the one-week rollback window)

- The Netlify site `kcvvelewijt` itself — **only after** `sponsoring` and the vanity links have moved.
- `www`'s `NETLIFY` + `NETLIFYv6` records (replaced by the Vercel `CNAME` at the flip, #2959).
- The Gatsby repo's three Netlify workflows and its GitHub secrets (`NETLIFY_AUTH_TOKEN`,
  `NETLIFY_SITE_ID`, `GATSBY_API_DOMAIN`, `GATSBY_GTM_ID`, `KCVV_PSD_API`, `TYPEKIT_ID`); the
  `NETLIFY_AUTH_TOKEN` personal token revoked in Netlify.
- The Netlify build hook, and Drupal's `kcvv_netlify` module with it — **plus revoking the GitHub
  token** that module uses to dispatch `netlify-deploy-api.yml` (a personal `soniCaH` token).
- The `/news/2020-…` slug redirects, `/ongeval`, `/evenementen` (the new site covers them).
- `preview.kcvvelewijt.be` (already no DNS record).

### Must move first

- **`sponsoring.kcvvelewijt.be`.** Before the Netlify site is deleted, give it a home that does not
  need the site. Options, all small: (a) a Vercel redirect — add the domain to the Vercel project and
  a host-matched redirect to the `workers.dev` URL, DNS `CNAME` to Vercel; (b) keep the Netlify site
  alive with only this alias. Moving the zone to Cloudflare (custom domain on the worker) is the larger
  option and drags the whole zone with it.
- **Seven vanity links** — `/stage`, `/cornet`, `/tornooi`, `/bbq`, `/receptie`, `/foodfriday`,
  `/recrea`. They `404` on the new site **from the `www` flip on**, not only after the delete. Several
  point at past events (`kcvvelewijt2025`, `recrea25`, `herfststage-2023`); each needs a keep-or-drop
  call, and the kept ones go into `next.config.ts` redirects before the flip.
- `sponsorship-platform`'s cron-runbook curl → the `workers.dev` host.

### Never touch

- **The Netlify DNS zone `kcvvelewijt.be`** and every e-mail record in it: Google Workspace `MX`, apex
  SPF (Billit), `_dmarc`, `resend._domainkey`, `send` `MX`+`TXT`, `_amazonses`, the three SES DKIM
  `CNAME`s, the Postmark DKIM and `sponsit-bounces`. Deleting the site does not delete the zone, but a
  zone move is its own job with its own plan.
- **The Netlify account/team** — it also holds `demeestertuinwerken.be` (site and DNS zone).
- The apex `A 216.198.79.1` (Vercel), `api` `A 88.99.213.134` (Drupal — map #3547 decides it),
  the `google-site-verification` and `facebook-domain-verification` `TXT`s.
- Netlify's *Renew certificate* button — the wildcard cert covers `www` and `sponsoring` until
  13 Jan 2027.

## Open — what only the Netlify dashboard can answer

- The team's full site list and whether `demeestertuinwerken.be` is in the same team.
- The plan and what it costs.
- Netlify-side env vars (names), build hooks (count) and deploy notifications.
- The three SES DKIM `CNAME` names (in the 2026-09-14 CSV, not findable by query).
- Who the registrar reseller is (whois names only Realtime Register B.V.) and when the domain renews.

## Observed in passing — not this ticket's scope

- The apex SPF is `v=spf1 include:my.billit.be` with no Google include and no `all` term, and there is
  no `google._domainkey` (the default Workspace selector; other selectors were not probed). Workspace
  mail from `@kcvvelewijt.be` then fails SPF and likely DKIM alignment. `_dmarc` is `p=none`, so
  nothing is rejected today, but it blocks ever tightening DMARC.
