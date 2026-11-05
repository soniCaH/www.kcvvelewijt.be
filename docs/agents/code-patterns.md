# Code patterns and debugging gotchas

KCVV-only notes kept from the retired `design-an-interface` and `triage-issue` commands (#3715). The plugin skills (`mattpocock-skills:codebase-design`, `mattpocock-skills:triage`, `mattpocock-skills:diagnosing-bugs`) hold the generic workflow; this file holds what is true only here.

## Interface patterns

- **Effect services.** A service is a `Context.Tag` class with its interface beside it, for example `KvCacheService` (`apps/api/src/cache/kv-cache.ts`) and `EmailTransport` (`apps/api/src/email/resend.ts`). Errors are tagged and typed in the Effect's error channel: no `Promise` in the interface, no `throw`. Mirror a peer before writing a new one.
- **HttpApi groups.** Endpoints live in `packages/api-contract/src/`, grouped by domain. Add only what `apps/api` actually serves; never an endpoint "for later". Conventions: `packages/api-contract/CLAUDE.md`.
- **Sanity reads.** GROQ lives in `apps/web/src/lib/repositories/`, one `<domain>.repository.ts` per domain, each with its test. Results are typed by the generated Sanity types; the read and run patterns are in `.claude/skills/kcvv-stack/SKILL.md`.

## Debugging gotchas

- **PSD dates.** A PSD `date` field always carries `00:00`; the kick-off time is in the separate `time` field.
- **Cache reads.** Decode a KV cache read with a schema (`S.decodeUnknown`), never `JSON.parse(...) as T`.
- **Barrel duplicates.** A type that vanishes or turns `any` usually means a duplicate export in the `api-contract` barrel.
- **Type-check is not build.** `tsgo` passing does not mean `next build` passes. When a symptom shows only on Vercel, run `pnpm turbo run build --filter=@kcvv/web`.
- **Wrong worktree.** Code that looks right locally but fails in CI: check where you are with `git branch --show-current`.
