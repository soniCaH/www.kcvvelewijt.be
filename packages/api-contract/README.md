# @kcvv/api-contract

Shared **API contract** for the KCVV Elewijt BFF: [Effect Schema](https://effect.website)
definitions for the _normalized_ response shapes the Cloudflare Workers BFF (`apps/api`)
returns and the Next.js web app (`apps/web`) consumes.

Post-transformation types only — `Match`, `MatchDetail`, `RankingEntry`, the `PsdApi`
HttpApi group, etc. Raw upstream (Footbalisto/PSD) shapes stay in `apps/api`/`apps/web`
as an implementation detail and never belong here.

## Usage

```typescript
import { Match, PsdApi } from "@kcvv/api-contract";
```

Source-only package (no emitted JS) — both consumers bundle the `src/` TypeScript
directly (Turbopack for web, esbuild/Wrangler for the BFF). `tsc --noEmit` type-check
can pass while a barrel re-export is unresolvable by the bundler, so after changing
anything here, rebuild the web app to validate resolution:

```bash
pnpm turbo build --filter=@kcvv/web
```

Conventions for adding schemas live in [`CLAUDE.md`](./CLAUDE.md).
