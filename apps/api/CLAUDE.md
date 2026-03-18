# apps/api — KCVV BFF (Cloudflare Worker)

Effect-based BFF that proxies ProSoccerData (PSD) API calls with Cloudflare KV caching,
implementing `PsdApi` from `@kcvv/api-contract`.

## Structure

```text
src/
├── index.ts                  ← Worker entry point (HttpApiBuilder.toWebHandler)
├── env.ts                    ← WorkerEnv type + WorkerEnvTag (Effect Context)
├── cache/
│   └── kv-cache.ts           ← KvCacheService (get/set with TTL)
├── footbalisto/
│   ├── schemas.ts            ← Raw PSD API schemas (internal only)
│   ├── transforms.ts         ← PSD → normalized api-contract types
│   └── client.ts             ← FootbalistoClient Effect service + Live layer
└── handlers/
    ├── matches.ts            ← MatchesApi HttpApiGroup + business logic
    ├── ranking.ts            ← RankingApi HttpApiGroup + business logic
    └── stats.ts              ← StatsApi HttpApiGroup + business logic
```

## Local development

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars  # fill in PSD secrets
pnpm --filter @kcvv/api dev                        # wrangler dev on :8787
```

`.dev.vars` is gitignored. Never commit secrets.

## Environment variables

| Variable                   | Where set                            | Notes                  |
| -------------------------- | ------------------------------------ | ---------------------- |
| `PSD_API_BASE_URL`         | `wrangler.toml [vars]`               | Public, safe to commit |
| `FOOTBALISTO_LOGO_CDN_URL` | `wrangler.toml [vars]`               | Public, safe to commit |
| `PSD_API_KEY`              | `wrangler secret put` / CF dashboard | Never in toml          |
| `PSD_API_AUTH`             | `wrangler secret put` / CF dashboard | Never in toml          |
| `PSD_API_CLUB`             | `wrangler secret put` / CF dashboard | Never in toml          |

## Deployment

- **Staging** (on pull requests from this repository): `wrangler deploy --env staging` → `kcvv-api-staging`
- **Production** (on merge to main): `wrangler deploy` → `kcvv-api`

Staging secrets must be set separately:

```bash
wrangler secret put PSD_API_KEY --env staging
wrangler secret put PSD_API_AUTH --env staging
wrangler secret put PSD_API_CLUB --env staging
```

## Cache

All cache keys use `KvCacheService`. TTLs are defined in `cache/kv-cache.ts`:

| Key pattern             | TTL                             |
| ----------------------- | ------------------------------- |
| `psd:current-season-id` | 24 h                            |
| `matches:team:{id}`     | 6 h                             |
| `matches:next`          | 30 min                          |
| `match:detail:{id}`     | 60 s (live) / 7 days (finished) |
| `ranking:team:{id}`     | 4 h                             |
| `stats:team:{id}`       | 12 h                            |
| `psd:calls:YYYY-MM-DD`  | 48 h (daily PSD call counter)   |

## Rules

- No `S.Unknown` in PSD schemas — only declare fields actively used in transforms
- Secrets via `wrangler secret put`, never in `wrangler.toml`
- `Effect.orDie` in HttpApiGroup handlers — errors become 500s; keep errors typed at handler level
- After changing `@kcvv/api-contract`, run `pnpm turbo build --filter=@kcvv/api-contract` first
