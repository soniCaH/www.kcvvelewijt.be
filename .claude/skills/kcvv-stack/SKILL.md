# KCVV Stack — Reference & Learnings

Consult this when working with Sanity, the BFF, Effect patterns, or the api-contract. Append new learnings as they're discovered.

## Stack Quick Reference

| Concern           | Location                       | Pattern                                            |
| ----------------- | ------------------------------ | -------------------------------------------------- |
| Sanity queries    | `apps/web/src/lib/sanity/`     | GROQ via `@sanity/client`                          |
| Effect schemas    | `packages/api-contract/src/`   | `S.Struct`, never `S.Unknown`                      |
| BFF endpoints     | `apps/api/src/`                | Hono + Cloudflare Workers + wrangler               |
| Web data fetching | `apps/web/src/lib/effect/`     | Effect + HttpClient                                |
| Studio schemas    | `packages/sanity-schemas/src/` | Sanity schema definitions (shared by both studios) |

## Sanity Patterns

```typescript
// Standard GROQ query with projection
const query = groq`*[_type == "article" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  body[]{
    ...,
    _type == "image" => { ..., asset-> }
  }
}`;

// Always pass type param to createClient fetch
const result = await client.fetch<SanityArticle>(query, { slug });
```

## Effect Patterns

```typescript
// Service layer — always return Effect, never throw
const getMatches = (teamId: string) =>
  HttpClient.get(`/matches/${teamId}`).pipe(
    Effect.flatMap((r) => S.decode(MatchesResponseSchema)(r.json)),
    Effect.mapError((e) => new BffError({ cause: e })),
  );

// In Next.js server components
const matches = await Effect.runPromise(getMatches(teamId));
```

## api-contract Rules

- `moduleResolution: bundler` — no `.js` extensions on imports inside `packages/api-contract/src/`
- After any change: `pnpm turbo build --filter=@kcvv/web` — tsc passing ≠ Turbopack happy
- Barrel re-export pitfall: never `export * from A` + `export * from B` if A re-exports something from B
- Only match/ranking/stats endpoints belong in PsdApi — players/teams come from Sanity

## BFF / Wrangler

Use Node 24 — the repo's own floor (`.nvmrc`, `package.json` → `engines.node`). Wrangler's own `engines.node` is `>=22.0.0` (`apps/api/node_modules/wrangler/package.json`), but 24 is the one number to act on here. Always run wrangler through `corepack pnpm` (workspace-pinned version, per AFK-BRIEF's homebrew-pnpm warning), never `npx` (resolves whatever's cached or latest).

**Production deploys from CI on merge to `main`** (`ci.yml`'s `deploy` job) — a hand deploy from a worktree is the exception, not the normal path. When you do need one, both CI deploy jobs build `api-contract` first; skip that step and a manual deploy can bundle a missing or stale contract.

```bash
# Build api-contract first — both CI deploy jobs do this before deploying (ci.yml:643, :700)
corepack pnpm turbo build --filter=@kcvv/api-contract

# Staging first — verify there before production. `deploy` is a pnpm BUILT-IN
# command name, so always spell out `run` — `pnpm --filter @kcvv/api deploy`
# (no `run`) silently invokes pnpm's own deploy, not this script.
corepack pnpm --filter @kcvv/api run deploy:staging

# Production — normally CI-only (see above); only run by hand for a deliberate
# out-of-band deploy
corepack pnpm --filter @kcvv/api run deploy

# Tail logs — production by default; add --env staging for the staging worker
corepack pnpm --filter @kcvv/api exec wrangler tail --format pretty
corepack pnpm --filter @kcvv/api exec wrangler tail --format pretty --env staging

# Check KV — production by default; add --env staging for the staging namespace
corepack pnpm --filter @kcvv/api exec wrangler kv key get --binding=PSD_CACHE --remote "sync:team-cursor"
corepack pnpm --filter @kcvv/api exec wrangler kv key get --binding=PSD_CACHE --remote "sync:team-cursor" --env staging
```

## PSD API

- Base: `https://clubapi.prosoccerdata.com`
- Auth headers: `x-api-key`, `x-api-club`, `Authorization: Bearer ...`
- Keys live in `.dev.vars` (local) and Wrangler secrets (production)

## Worktrees

```bash
# Create for an issue
git worktree add "../kcvv-issue-<N>" -b "feat/issue-<N>" origin/main

# List active
git worktree list

# Remove after PR merge
git worktree remove "../kcvv-issue-<N>" --force
git branch -d "feat/issue-<N>"
```

## Learnings

<!-- Format: YYYY-MM-DD — what happened / gotcha discovered -->
