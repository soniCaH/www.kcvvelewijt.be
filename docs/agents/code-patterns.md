# Code patterns and debugging gotchas

KCVV-only notes kept from the retired `design-an-interface` and `triage-issue` commands (#3715). The plugin skills (`mattpocock-skills:codebase-design`, `mattpocock-skills:triage`, `mattpocock-skills:diagnosing-bugs`) hold the generic workflow; this file holds what is true only here.

## Interface patterns

- **Effect services.** A service is a `Context.Tag` class with its interface beside it, for example `KvCacheService` (`apps/api/src/cache/kv-cache.ts`) and `EmailTransport` (`apps/api/src/email/resend.ts`). Errors are tagged and typed in the Effect's error channel: no `Promise` in the interface, no `throw`. Mirror a peer before writing a new one.
- **HttpApi groups.** Endpoints live in `packages/api-contract/src/`, grouped by domain. Add only what `apps/api` actually serves; never an endpoint "for later". Conventions: `packages/api-contract/CLAUDE.md`.

## Debugging gotchas

- **PSD dates.** A PSD `date` field always carries `00:00`; the kick-off time is in the separate `time` field.
- **Parsed JSON.** Decode a KV cache read, a BFF response or any `JSON.parse`/`.json()` result with a schema (`S.decodeUnknown*`), never `JSON.parse(...) as T` or `(await r.json()) as T` (lint: `kcvv/no-json-cast`, in `apps/api` (#3877) and `apps/web` (#3878)). A bare `as unknown` passes.
- **Barrel duplicates.** A type that vanishes or turns `any` usually means a duplicate export in the `api-contract` barrel.
- **Type-check is not build.** `tsgo` passing does not mean `next build` passes. When a symptom shows only on Vercel, run `pnpm turbo run build --filter=@kcvv/web`. `tsgo` can pass a nested literal that `tsc` rejects. After a `defineQuery` projection change and typegen, run `pnpm exec tsc --noEmit -p .` in `apps/web` (about 1 min): it lists every fixture that now lacks the field.
- **Wrong worktree.** Code that looks right locally but fails in CI: check where you are with `git branch --show-current`.
- **ISR: a throw keeps the last good page, a catch overwrites it.** A regeneration that throws leaves Next serving the last good render; one that catches to `[]` succeeds, so the empty render is written to the ISR cache. That is why a section read degrades and a subject read throws (`apps/web/CLAUDE.md` → "Match the catch"). "Always throw" was rejected: a deploy during an outage meets a cold cache, and every route would 500.
- **Production redacts Server Component errors** before `error.tsx` sees them (only `digest` survives), so a boundary cannot tell an outage from a bug.
- **Home or away in `apps/api`.** The BFF has no club-id literal: `psd/service.ts` derives it with `deriveOwnClubId(games)`. Use that `ownClubId`; never add `1235` there (`KCVV_CLUB_ID` is web-only). `is_home` is three-state there (`true`, `false`, `undefined`): never read `undefined` as `true`.
