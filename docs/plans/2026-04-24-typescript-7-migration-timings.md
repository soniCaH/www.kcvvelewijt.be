# TypeScript 7 Migration — Measured Timings

Wall-clock seconds, all runs on macOS arm64 with pnpm 10.33.2 + Node 24.15. Per-workspace numbers are best-of-3 (cold first run, then 2 warm runs — best taken).

## Per-workspace type-check (vs `tsc --noEmit` 6.0.3 baseline)

| Workspace              | tsc baseline | tsgo (this branch) | Speedup |
| ---------------------- | -----------: | -----------------: | ------: |
| `@kcvv/api-contract`   |        2.87s |              0.44s |    6.5× |
| `@kcvv/sanity-schemas` |        5.30s |              0.56s |    9.4× |
| `@kcvv/sanity-studio`  |        6.34s |              0.56s |   11.4× |
| `@kcvv/api`            |        6.63s |              0.86s |    7.7× |
| `@kcvv/web`            |        8.73s |              1.56s |    5.6× |

## api-contract declaration build (`tsc --build` → `tsgo --build`)

| Run                      | Wall-clock | Speedup |
| ------------------------ | ---------: | ------: |
| `tsc --build` (baseline) |      4.31s |       — |
| `tsgo --build`           |      0.39s |   11.0× |

Output diff: 81 dist files emitted, all `.js` byte-identical, all `.d.ts` semantically equivalent (only alphabetical reordering of union/intersection/literal-union members; same types). 1 `.d.ts.map` differs in `mappings` VLQ as a downstream consequence. `tsconfig.tsbuildinfo` differs (internal build state, not part of public output).

## Root-level (cold turbo cache, parallel)

| Command                  |                                Wall-clock |
| ------------------------ | ----------------------------------------: |
| `pnpm type-check` (root) |                                     ~2.4s |
| `pnpm build` (root)      |          ~38s (dominated by `next build`) |
| `pnpm lint` (root)       |                                    ~12.6s |
| `pnpm test` (root)       | ~38s (2672 vitest tests across 213 files) |
| `pnpm knip`              |                                     ~2.1s |

## Headline

The honest single number is **per-workspace tsgo type-check is 5.6× to 11.4× faster than classic tsc** depending on the workspace. The headline ratio for serial sum-of-baselines (29.87s) vs root parallel cold turbo (~2.4s) is ~12×, but mixes per-package compiler speedup with turbo's parallelism — not directly comparable.

## Tooling unaffected

`pnpm knip` zero new warnings. Classic `typescript@6.0.3` remains installed in every workspace and is consumed by `typescript-eslint`, `knip`, `@sanity/cli` typegen, and Next.js's `next build` internal type-check.
