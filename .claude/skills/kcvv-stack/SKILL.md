# KCVV Stack — Reference & Learnings

Consult this when working with Sanity, the BFF, Effect patterns, or the api-contract. Append new learnings as they're discovered.

## Stack Quick Reference

| Concern            | Location                                         | Pattern                                                                 |
| ------------------ | ------------------------------------------------ | ----------------------------------------------------------------------- |
| Sanity reads       | `apps/web/src/lib/repositories/*.repository.ts`  | `defineQuery` + `fetchGroq` (`lib/sanity/fetch-groq.ts`), `Context.Tag` |
| Effect schemas     | `packages/api-contract/src/schemas/`             | `Schema as S` from `effect`, never `S.Unknown`                          |
| API definition     | `packages/api-contract/src/api/`                 | `@effect/platform` `HttpApiGroup` / `HttpApiEndpoint`, merged `PsdApi`  |
| BFF handlers       | `apps/api/src/handlers/`                         | `HttpApiBuilder` on Cloudflare Workers, KV via `TypedKvCache`           |
| Web BFF client     | `apps/web/src/lib/effect/services/BffService.ts` | `HttpApiClient.make(PsdApi)`                                            |
| Web Effect runtime | `apps/web/src/lib/effect/runtime.ts`             | `runPromise` — error channel must be `never`                            |
| Studio schemas     | `packages/sanity-schemas/src/`                   | Sanity schema definitions (shared by both studios)                      |

## Sanity Reads

Never call `sanityClient.fetch` directly. Every read goes through `fetchGroq`, which fails with a typed `SanityReadError`. Query result types come from `apps/web/src/lib/sanity/sanity.types.ts` (typegen).

```typescript
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { PAGE_BY_SLUG_QUERY_RESULT } from "../sanity/sanity.types";

const PAGE_BY_SLUG_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0] { ... }`);

// Inside the repository's Layer
findBySlug: (slug) =>
  fetchGroq<PAGE_BY_SLUG_QUERY_RESULT>(PAGE_BY_SLUG_QUERY, { slug }).pipe(
    Effect.map((row) => row ?? null),
  ),
```

## Running Effects in a Page

`runPromise` from `@/lib/effect/runtime` only accepts an effect whose error channel is `never`, so every failure is resolved at the call site (#2433):

- **Section read** (the page survives without it): `degradeSection(effect, fallback, note)` from `lib/effect/degrade.ts`. Use `degradeSectionFlagged` when the fallback value (e.g. `null`) is also a real result.
- **Subject read** (the page is about it): `Effect.orDie` with a one-line reason — a failure goes to the global boundary.
- **BFF call**: classify first, not `degradeSection`. `degradeIfPermanent` (`lib/effect/degrade-if-permanent.ts`) degrades only the permanent tags in `PERMANENT_BFF_TAGS` (`HttpNotFound`, `ParseError`, `HttpApiDecodeError`). A transient failure (timeout, 502/503) still rejects, so ISR serves the last good page instead of caching the fallback. Once the read is already a rejected `Promise`, classify with `isPermanentBffFailure` (`lib/effect/classify-bff-failure.ts`).

```typescript
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { degradeIfPermanent } from "@/lib/effect/degrade-if-permanent";

// From `ploegen/[slug]/(detail)/page.tsx`
const standings = await runPromise(
  degradeIfPermanent(
    Effect.gen(function* () {
      const bff = yield* BffService;
      return yield* bff.getRanking(psdTeamId);
    }).pipe(
      // A 404 here means "no ranking published yet" — resolve it to an empty
      // table BEFORE classifying, or the page loses its `no-table` state.
      Effect.catchTag("HttpNotFound", () => Effect.succeed([])),
    ),
    null, // other permanent failure → section shows "unavailable"
    // What is left is transient by construction; orDie only satisfies
    // runPromise's `never` channel — it still rejects, as intended.
  ).pipe(Effect.orDie),
);
```

## api-contract Rules

- `moduleResolution: bundler` — no `.js` extensions on imports inside `packages/api-contract/src/`
- After any change: `pnpm turbo build --filter=@kcvv/web` — tsc passing ≠ Turbopack happy
- Barrel re-export pitfall: never `export * from A` + `export * from B` if A re-exports something from B
- `PsdApi` groups today: `matches`, `ranking`, `opponent`, `related`, `search`, `forms`. Players, teams, staff and articles come from Sanity repositories, not the BFF

## BFF / Wrangler

Use Node 24 — the repo's own floor (`.nvmrc`, `package.json` → `engines.node`). Wrangler's own `engines.node` is `>=22.0.0` (`apps/api/node_modules/wrangler/package.json`), but 24 is the one number to act on here. Always run wrangler through `corepack pnpm` (workspace-pinned version, per AFK-BRIEF's homebrew-pnpm warning), never `npx` (resolves whatever's cached or latest).

**Production deploys from CI on merge to `main`** (`ci.yml`'s `deploy` job) — a hand deploy from a worktree is the exception, not the normal path. When you do need one, both CI deploy jobs build `api-contract` first; skip that step and a manual deploy can bundle a missing or stale contract.

```bash
# Build api-contract first — both CI deploy jobs do this before deploying (ci.yml "Build api-contract" steps)
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
