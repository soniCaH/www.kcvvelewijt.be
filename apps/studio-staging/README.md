# @kcvv/studio-staging — Sanity Studio (staging)

Sanity Studio for the KCVV Elewijt website, connected to the **staging** dataset.

Schemas are not defined here — they are imported from the shared [`@kcvv/sanity-schemas`](../../packages/sanity-schemas/) package. Both studios (production and staging) consume identical schema definitions.

## Local development

```bash
pnpm --filter @kcvv/studio-staging dev   # starts Studio at http://localhost:3333
```

## Deploy

```bash
pnpm --filter @kcvv/studio-staging deploy
```

## Editing schemas

All schema files live in `packages/sanity-schemas/src/`. Changes there apply to both production and staging studios automatically — do not edit studio-local copies.
