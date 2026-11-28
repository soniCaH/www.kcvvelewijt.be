# @kcvv/sanity-ops

One-off Sanity maintenance scripts — seeding, cleanup and backfills. They
delete and change documents, so they sit in the workspace and CI runs
`lint`, `type-check` and `test` on them like any other package (#3056).

| Folder                            | What it did                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `src/board-2627/`                 | The 2026-2027 board update of the organigram and help topics (`board-2627`) |
| `src/board-cleanup/`              | Read-only audit of board staff documents                                    |
| `src/cashless-terms-3569/`        | The cashless terms page, from Drupal's text, linked from `cashless` (#3569) |
| `src/leerplan-link-3568/`         | Repoint the dead Drupal leerplan PDF link to `/downloads/` (#3568)          |
| `src/psd-privacy-cleanup/`        | Unset staff `birthDate`, delete unreferenced PSD portrait assets (#3469)    |
| `src/short-links-3573/`           | Seed the `/tornooi` and `/stage` short links, dry run by default (#3573)    |
| `src/sponsor-season-report-3653/` | One printable season report per Sponsor from GA4 (#3653)                    |
| `src/staff-role-fill/`            | List empty staff roles, build the `andere` fill for the owner (#3560)       |
| `src/shared/`                     | The one Sanity client and the ref helpers                                   |

Run a script with its package.json name, or directly with tsx:

```bash
SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops board:audit
SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops exec tsx src/board-cleanup/query-psd-staff.ts
```

`SANITY_DATASET` defaults to `staging`. Auth: `SANITY_API_TOKEN` (write
token) or a logged-in `~/.config/sanity/config.json`.

A new script goes in its own folder under `src/` and imports `client` (or,
with a reason next to the call, `draftAwareClient`) from
`../shared/sanity-client`. Do not copy the client.

## Sponsor season report

One printable Dutch HTML page per active Sponsor: impressions and clicks per
surface (homepage, team pages, `/sponsors`), click-through rate from 100
impressions, linked Teams and spotlight weeks. Raw counts, a minimum and not an
estimate. The board mails the pages; they never go on the site. The pure core
(`build-report.ts`) is tested; `run.ts` is the thin shell.

Prerequisites:

- Sanity: `SANITY_DATASET=production` plus the token, as above (prod is private).
  The run stops on any other dataset, because GA4 is the production property
  (`--allow-staging` overrides it, for testing).
- GA4: a gcloud login with the read scope. The property defaults to
  `530024143`; override with `GA4_PROPERTY_ID`. Google blocks gcloud's built-in
  OAuth client for this scope ("This app is blocked"), so log in with the
  club's own Desktop OAuth client of GCP project `kcvv-elewijt`, kept in
  1Password as the document "Google OAuth — KCVV Elewijt":

  ```bash
  op document get "Google OAuth — KCVV Elewijt" --out-file ~/.config/gcloud/kcvv-ga4-client.json
  gcloud auth application-default login --client-id-file="$HOME/.config/gcloud/kcvv-ga4-client.json" \
    --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform
  ```

  The Google account must be a test user on that project's consent screen.

- GA4 quota project: run with `GOOGLE_CLOUD_QUOTA_PROJECT=kcvv-elewijt`. It is
  sent with every GA4 request and the run stops without it. (`gcloud auth
application-default set-quota-project` does not work: it needs the Cloud
  Resource Manager API, which is off.) The Google Analytics Data API
  (`analyticsdata.googleapis.com`) is enabled on that project.

Run:

```bash
# Dry run: prints impressions / clicks per surface for each Sponsor, writes nothing.
GOOGLE_CLOUD_QUOTA_PROJECT=kcvv-elewijt SANITY_DATASET=production \
  pnpm --filter @kcvv/sanity-ops sponsor-report --dry-run

# The season (default: 1 July to 30 June around today) with spotlight weeks.
GOOGLE_CLOUD_QUOTA_PROJECT=kcvv-elewijt SANITY_DATASET=production \
  pnpm --filter @kcvv/sanity-ops sponsor-report \
  --from 2026-07-01 --to 2027-06-30 --spotlight weeks.json
```

`--spotlight` is a JSON file with the Monday of each spotlight week ("In de
kijker" on `/sponsors`) per Sponsor name, kept by hand (no field in Sanity has a
writer for it). The path is read from the folder you typed the command in. Dates
must be real Mondays inside `--from`..`--to`; a name that matches no active
Sponsor, or two, stops the run, as does a missing or malformed file:

```json
{ "Garage Janssens": ["2027-03-01", "2027-03-08"] }
```

The pages land in `scripts/sanity-ops/out/sponsor-season-report-3653/<from>_<to>/`
(git-ignored). That folder is emptied at the start of each run. Print one page
from the browser or save it as PDF.

The run stops when two Sponsors share a hashed id (every sponsor document counts,
named or not, active or not). Clicks on `/sponsors` from before the #3773 deploy
(17 November 2026) have no `source` in GA4 and show as `(not set)`; the report
counts those as `/sponsors` clicks. Impressions only exist from that deploy, so
the click-through rate counts the clicks from the first day impressions were
measured on that surface; the raw click counts cover the whole range. Clicks on
a Sponsor's name in "Gesteund door" (`sponsor_team_line_click`) are a separate
line, shown only when the range has such clicks, and are not in the rate. The
line was removed from the team page in #3915, so ranges after that show none.
