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
pnpm --filter @kcvv/api deploy           # deploy to production
pnpm --filter @kcvv/api deploy:staging   # deploy to staging
pnpm --filter @kcvv/api test
pnpm --filter @kcvv/api cache:clear:staging                    # clear all staging KV keys
pnpm --filter @kcvv/api cache:clear:staging:key "matches:next" # clear a single staging KV key
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
