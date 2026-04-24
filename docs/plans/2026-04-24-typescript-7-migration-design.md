# TypeScript 7.0 Beta Migration — Design

**Date:** 2026-04-24
**Status:** Approved (design phase)
**Owner:** @climacon

## Problem

TypeScript 7.0 Beta shipped 2026-04-21. Its Go-based compiler (`tsgo`) is ~10× faster than classic `tsc` while preserving TypeScript 6.0 type-checking semantics byte-for-byte. Our monorepo already upgraded to TypeScript 6.0.3 on main (PR #1430), so the 5.x → 6.0 breaking-change cliff is already behind us.

This design covers swapping our type-check pipeline from `tsc` to `tsgo` to get the 10× speedup where it matters (lint-staged, CI, local dev loop) while accepting zero additional risk from the unstable 7.x compiler API.

## Non-Goals

- Migrating to `tsgo` for Next.js's internal `next build` type-check (blocked by Next's typed-routes generation dependency — revisit after 7.0 stable in July 2026).
- Replacing the classic `typescript` package (needed for `typescript-eslint`, `knip`, Sanity typegen, and Next's internal type-check).
- Adopting any 7.x-only compiler API features in our own code.

## Current State

| Concern | Status |
| --- | --- |
| TS version | `typescript@6.0.3` in all 7 workspaces |
| `tsconfig.json` hard-error fields | Clean — no `baseUrl`, no `downlevelIteration`, no deprecated `target`/`module`/`moduleResolution` values |
| Direct compiler-API imports in app code | None (grepped) |
| Type-check script pattern | `tsc --noEmit` in every workspace |
| Declaration build | `tsc --build` in `packages/api-contract` (composite + root project refs) |
| Tooling depending on classic TS | `typescript-eslint` 8.59, `knip` 6.6, `@sanity/cli` typegen |

## Decision

Adopt **Approach #2 (dual-install, tsgo as primary)** with Next's internal type-check left untouched.

- Install `@typescript/native-preview@beta` as a dev dependency.
- Keep `typescript@6.0.3` installed for tooling.
- Rewrite every workspace's `type-check` script from `tsc --noEmit` to `tsgo --noEmit`.
- Rewrite `packages/api-contract`'s `build` script from `tsc --build` to `tsgo --build`.
- Leave `apps/web/next.config.ts` unchanged; Next continues to run its classic type-check during `next build` (correctness-first for typed routes).

## Rejected Alternatives

### Full swap (uninstall `typescript`, alias `@typescript/native-preview` as `typescript`)

Rejected. `typescript-eslint`, `knip`, Sanity typegen, and Next's build-time type-checker all resolve the `typescript` package name at runtime and consume its compiler API — which is explicitly **not stable until 7.1**, several months after 7.0 stable. Aliasing risks subtle tool breakage with hard-to-diagnose symptoms.

### Dual-install, `tsc` as primary + parallel `tsgo` preflight

Rejected. Users pay install cost of two compilers but only see the 10× in a non-blocking side channel; the blocking path (lint-staged + CI `type-check` job + local `pnpm check-all`) stays on classic `tsc`. All cost, most of the user-visible latency.

### Disable Next's internal type-check + gate with `tsgo --noEmit` on CI only (Option B)

Rejected. Next auto-generates typed-route declarations into `.next/types/**` **during** `next build`. Running `tsgo --noEmit` before build on a clean CI runner produces false negatives (stale/missing generated types) or false positives (missing imports). Correct sequencing requires a double build or an undocumented "types-only" Next step. Fragility isn't worth the Vercel-only speedup.

## Architecture / Pipeline Changes

### Before

```text
lint-staged  →  eslint + prettier
CI type-check job  →  turbo run type-check  →  tsc --noEmit (per workspace)
CI build job      →  turbo run build  →  next build | wrangler deploy | tsc --build
local check-all  →  lint → type-check (tsc) → test → build
```

### After

```text
lint-staged  →  eslint + prettier                        (unchanged)
CI type-check job  →  turbo run type-check  →  tsgo --noEmit (per workspace)
CI build job      →  turbo run build  →  next build     (still runs classic tsc internally, by design)
                                       |  wrangler deploy
                                       |  tsgo --build   (api-contract declarations)
local check-all  →  lint → type-check (tsgo) → test → build
```

### File touch list

- Root `package.json` — add `@typescript/native-preview` as root dev dep (so `tsgo` is on PATH everywhere turbo spawns).
- Every workspace `package.json` with a `type-check` or `build` script invoking `tsc`: `apps/web`, `apps/api`, `apps/studio`, `apps/studio-staging`, `packages/api-contract`, `packages/sanity-schemas`, `packages/sanity-studio` — rewrite `tsc` → `tsgo` in those scripts only.
- `turbo.json` — verify cache keys still hash correctly after script change; no structural change expected.
- `.github/workflows/ci.yml` — no change needed if CI invokes `pnpm type-check` (which delegates to turbo); verify.
- `packages/api-contract/package.json` — `build: tsgo --build` (composite + project refs are the one area to pressure-test).

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `tsgo --build` mishandles composite/project refs in api-contract | Medium | High (blocks declarations consumed by web + api) | Pressure-test early in implementation plan; fallback is to keep `tsc --build` in this one workspace |
| Divergent error output between `tsc` and `tsgo` on edge cases | Low | Low | TS 7 type-checking is structurally identical to TS 6.0; run both against a known-clean tree as a diff check |
| Lint-staged or CI hits a cached `tsc` binary | Low | Low | Explicitly call `tsgo` by name in scripts |
| `typescript-eslint` parser confusion if both packages present | Very Low | Medium | `typescript-eslint` only resolves the `typescript` package; `@typescript/native-preview` is a separate package name — no conflict |
| TS 7.0 stable ships a flag change between beta and stable | Medium | Low | Beta-to-stable deltas are typically small; pin to `@beta` tag, revisit at GA |

## Success Criteria

1. All 7 workspace `type-check` scripts pass using `tsgo` with zero warnings or errors.
2. `packages/api-contract/dist/**` declaration files produced by `tsgo --build` are byte-equivalent (or semantically equivalent) to those produced by `tsc --build`.
3. `pnpm check-all` in `apps/web` completes in measurably less wall-clock time than on `main`.
4. CI `type-check` job wall-clock time drops ≥ 5× (10× is the theoretical ceiling; real-world often 5–10× because of workspace overhead).
5. `next build` on Vercel still succeeds without code or config changes.
6. No regressions in `eslint`, `knip`, or Sanity typegen.

## Rollback Plan

Single commit revert restores the baseline. The design is intentionally additive-on-top-of-existing (classic `typescript` stays installed), so rollback is `git revert <merge-commit>` + `pnpm install`. No schema, data, or infra changes to undo.

## Follow-Up Work

- After TS 7.0 stable GA (target: late June / early July 2026): re-evaluate whether to disable Next's internal type-check and promote `tsgo` to sole type-checker.
- Track `@typescript/native-preview` beta release cadence; bump as needed.
- Track ecosystem milestones: `typescript-eslint` native-7 support, `knip` native-7 support — likely unblock a full swap.
