# @kcvv/sanity-ops

One-off Sanity maintenance scripts — seeding, cleanup and backfills. They
delete and change documents, so they sit in the workspace and CI runs
`lint`, `type-check` and `test` on them like any other package (#3056).

| Folder                     | What it did                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `src/board-2627/`          | The 2026-2027 board update of the organigram and help topics (`board-2627`) |
| `src/board-cleanup/`       | Read-only audit of board staff documents                                    |
| `src/psd-privacy-cleanup/` | Unset staff `birthDate`, delete unreferenced PSD portrait assets (#3469)    |
| `src/staff-role-fill/`     | List empty staff roles, build the `andere` fill for the owner (#3560)       |
| `src/team-image-backfill/` | Recover team photos from Drupal — see its README                            |
| `src/shared/`              | The one Sanity client and the ref helpers                                   |

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
