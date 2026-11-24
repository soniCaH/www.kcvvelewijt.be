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
- GA4: a gcloud login with the read scope. The property defaults to
  `530024143`; override with `GA4_PROPERTY_ID`.

  ```bash
  gcloud auth application-default login \
    --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform
  ```

Run:

```bash
# Dry run: prints the GA4 row count per Sponsor, writes nothing.
SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops sponsor-report --dry-run

# The season (default: 1 July to 30 June around today) with spotlight weeks.
SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops sponsor-report \
  --from 2026-07-01 --to 2027-06-30 --spotlight weeks.json
```

`--spotlight` is a JSON file with the Monday of each spotlight week ("In de
kijker" on `/sponsors`) per Sponsor name, kept by hand (no field in Sanity has a
writer for it). A name that matches no active Sponsor stops the run:

```json
{ "Garage Janssens": ["2027-03-01", "2027-03-08"] }
```

The pages land in `scripts/sanity-ops/out/sponsor-season-report-3653/`
(git-ignored). Print one from the browser or save it as PDF.

The run stops when two Sponsors share a hashed id. Clicks on `/sponsors` from
before the #3773 deploy (17 November 2026) have no `source` in GA4 and show as
`(not set)`; the report counts those as `/sponsors` clicks.
