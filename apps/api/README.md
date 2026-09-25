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

## Testing — the node/workers split

`pnpm --filter @kcvv/api test` runs Vitest across **two projects**, declared
in `vitest.config.ts`'s `test.projects` (Vitest 4 multi-project config; not a
`vitest.workspace.ts` file):

| Project   | Config                     | Runs                       | Runtime                                                                                   |
| --------- | -------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| `node`    | `vitest.node.config.ts`    | `src/**/*.test.ts`         | Plain Node (`environment: "node"`)                                                        |
| `workers` | `vitest.workers.config.ts` | `src/**/*.workerd.test.ts` | Real workerd, via `@cloudflare/vitest-plugin` + Miniflare (`wrangler.workerd-test.jsonc`) |

`pnpm --filter @kcvv/api test:coverage` (`vitest run --coverage`) covers
**both** projects with **one** run. The provider is `istanbul`, not
Vitest's default `v8` — v8 collects coverage via Node's V8 inspector API,
which doesn't exist inside workerd; running `--coverage` with it crashes the
`workers` project outright (`node:inspector/promises` has no such module).
Cloudflare's own docs are explicit here: "Native code coverage via V8 is not
supported. You must use instrumented code coverage via Istanbul instead."
`coverage` is configured once, in the root `vitest.config.ts` — a root
config's `coverage` (like `reporters`/`globalSetup`) applies globally
regardless of which project a test file belongs to.

**The split rule** (decided in [#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086)
Q7, detailed in `docs/research/test-layer-balance.md` §2.4): a test whose
correctness depends on the Worker's own runtime semantics — a real KV
read/write, a real TTL/expiry, single-flight coordination through the actual
`PsdGate` Durable Object — belongs in `workers`, named `*.workerd.test.ts`.
Everything else — business logic, transforms, schemas, handler behaviour with
`KvCacheService`/`PsdGateService` provided as an `Layer.succeed` fake — stays
on `node`, named plainly `*.test.ts`. The workerd pool boots a real `workerd`
instance per test file (Google's "medium" cost); paying for it everywhere
would be paying for it where it buys nothing.

This is deliberately **not** a rewrite of the existing suite: `kv-cache.test.ts`
keeps testing `TypedKvCache`'s business rules (staleness, drift, incident
escalation, …) against a hand-rolled `Map`-backed fake KV on `node` — that
fake exists to test our own logic, which is exactly what `node` is for. What
moved to `workers` is the two things nothing on `node` could ever prove for
real:

- `cache/kv-cache-live.workerd.test.ts` — `KvCacheLive` and `makeDurableKv`
  against the real `PSD_CACHE` binding: read/write round-trips, delete, a
  real `expirationTtl` visible on the key's `list()` metadata, `increment`,
  and a durable `list()` round-trip into the port's page shape. (Not
  multi-page cursor-following — `makeDurableKv`'s `list` forwards no
  `limit`, so it can't force a real second page; that loop is covered on
  `node` against a mock that can.)
- `psd/gate-do.workerd.test.ts` — the `PsdGate` Durable Object (`gate-do.ts`)
  itself, which had **zero** test coverage before this file existed: its own
  doc comment says it "must only ever be imported by the worker entry, never
  by code the Node tests load", since it imports `cloudflare:workers`. Real
  concurrent RPC calls on a real DO stub prove single-flight leadership,
  `awaitFlight`/`endFlight` ordering, and — end-to-end with `KvCacheLive` and
  the real gate together — that N concurrent `TypedKvCache` misses still
  collapse to one fetch when nothing is faked.

`wrangler.workerd-test.jsonc` is a **test-only** Worker config, read only by
`vitest.workers.config.ts` — never by `wrangler dev`/`deploy`, which still use
`wrangler.toml`. It's deliberately narrower than the real config: just the
`PSD_CACHE` KV binding and the `PSD_GATE` Durable Object (pointed at
`src/test-helpers/workerd-entry.ts`, a minimal entry that exports only
`PsdGate` — never the real `src/index.ts`). The real `wrangler.toml` also
declares Vectorize and Workers AI bindings that have no local emulation;
booting the plugin against it directly would fail before a single test ran.

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
