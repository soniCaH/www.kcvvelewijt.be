# KCVV Stack — Reference & Learnings

Consult this when working with Sanity, the BFF, Effect patterns, or the api-contract. Append new learnings as they're discovered.

## Stack Quick Reference

| Concern           | Location                     | Pattern                              |
| ----------------- | ---------------------------- | ------------------------------------ |
| Sanity queries    | `apps/web/src/lib/sanity/`   | GROQ via `@sanity/client`            |
| Effect schemas    | `packages/api-contract/src/` | `S.Struct`, never `S.Unknown`        |
| BFF endpoints     | `apps/api/src/`              | Hono + Cloudflare Workers + wrangler |
| Web data fetching | `apps/web/src/lib/effect/`   | Effect + HttpClient                  |
| Studio schemas    | `apps/studio/schemaTypes/`   | Sanity schema definitions            |

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

```bash
# Deploy
cd apps/api && pnpm wrangler deploy

# Staging
cd apps/api && pnpm wrangler deploy --env staging

# Tail logs
pnpm wrangler tail --format pretty

# Check KV
npx wrangler kv key get --binding=PSD_CACHE --remote "sync:team-cursor"
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
