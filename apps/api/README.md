# @kcvv/api — KCVV BFF (Cloudflare Worker)

Effect-based BFF that proxies ProSoccerData (PSD) API calls with Cloudflare KV caching, implementing `PsdApi` from `@kcvv/api-contract`.

See [`CLAUDE.md`](./CLAUDE.md) for architecture details, cache key table, and PSD schema rules.

## Local development

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars  # fill in PSD secrets
pnpm --filter @kcvv/api dev                        # wrangler dev on :8787
```

`.dev.vars` is gitignored — never commit secrets.

## Environment variables

| Variable                   | Where set                            |
| -------------------------- | ------------------------------------ |
| `PSD_API_BASE_URL`         | `wrangler.toml [vars]`               |
| `FOOTBALISTO_LOGO_CDN_URL` | `wrangler.toml [vars]`               |
| `PSD_API_KEY`              | `wrangler secret put` / CF dashboard |
| `PSD_API_AUTH`             | `wrangler secret put` / CF dashboard |
| `PSD_API_CLUB`             | `wrangler secret put` / CF dashboard |

## Scripts

```bash
pnpm --filter @kcvv/api dev              # wrangler dev (local)
pnpm --filter @kcvv/api run deploy       # deploy to production (bare `deploy` hits pnpm's built-in)
pnpm --filter @kcvv/api deploy:staging   # deploy to staging
pnpm --filter @kcvv/api test
pnpm --filter @kcvv/api lint
pnpm --filter @kcvv/api cache:clear:staging                    # clear all staging KV keys
pnpm --filter @kcvv/api cache:clear:staging:key "matches:next" # clear a single staging KV key
```

## Scheduled jobs

Two cron triggers, both declared in `wrangler.toml`. Each runs inside
`ctx.waitUntil()` and `scheduled()` returns immediately (`src/index.ts`).

| Cron (UTC)   | Job                                                  |
| ------------ | ---------------------------------------------------- |
| `0 2 * * *`  | `psd-sanity-sync` — players, teams, staff, portraits |
| `30 2 * * *` | `sanity-index-sync` — search embeddings              |

`psd-sanity-sync` walks **one team per night**, advancing a cursor in KV. Staging
runs no scheduled sync at all — it shares the PSD API quota with production.

### Syncing one team now

When an editor has just filled in portraits or positions in ProSoccerData and
does not want to wait for tonight:

```bash
./scripts/trigger-psd-sync.sh 0   # 0 = Eerste Elftallen A, 1 = Eerste Elftallen B, …
```

Three things that are easy to get wrong, and that the script handles:

- **It writes to production Sanity.** The cursor lives in the _preview_ KV
  namespace, because `wrangler dev --remote` reads preview — but the Sanity
  credentials come from `.dev.vars`, which points at the production dataset.
  Preview KV, production data. The script prints the target before it writes.
- **`/__scheduled` is the trigger, not a health check.** Polling it to see
  whether the worker is up _runs the sync_. The script watches wrangler's log
  for its `Ready on …` line instead, so the cron fires exactly once.
- **Do not stop it on a timer.** The uploads run in `waitUntil`, so ending the
  invocation early cancels whatever is still in flight. The script waits for the
  sync's own `…: done` line.

A `429` on a portrait upload is **not** fatal — that player retries on the next
run, or on the nightly cron. Re-running is safe and cheap: images already
uploaded are skipped.

To verify afterwards, query the **production** dataset directly — note that
`apps/web/.env.local` points at `staging`, so sourcing the dataset from there
silently checks the wrong database:

**Do not filter straight after a dereference.** `count(players[]->[defined(psdImage)])`
does not filter — it returns the whole dereferenced array, so the count always
equals the squad size and a sync that landed nothing still reports 100%. Project
the flag and count in the consumer instead:

```bash
curl -sG "https://vhb33jaz.api.sanity.io/v2024-01-01/data/query/production" \
  --data-urlencode 'query=*[_type=="team" && psdId=="1"][0]{name, "p": players[]->{"img": defined(psdImage)}}' \
  | python3 -c 'import json,sys; p=json.load(sys.stdin)["result"]["p"]; print(sum(1 for x in p if x["img"]), "of", len(p), "have a photo")'
```

## Deployment

- **Production** (on merge to `main`): `wrangler deploy` → `kcvv-api`
- **Staging** (on PRs): `wrangler deploy --env staging` → `kcvv-api-staging`

Staging secrets must be set separately:

```bash
wrangler secret put PSD_API_KEY --env staging
wrangler secret put PSD_API_AUTH --env staging
wrangler secret put PSD_API_CLUB --env staging
```
