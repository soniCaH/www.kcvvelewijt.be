# @kcvv/studio — Sanity Studio (production)

Sanity Studio for the KCVV Elewijt website, connected to the **production** dataset.

Schemas are not defined here — they are imported from the shared [`@kcvv/sanity-schemas`](../../packages/sanity-schemas/) package. Both studios (production and staging) consume identical schema definitions.

## Local development

```bash
pnpm --filter @kcvv/studio dev   # starts Studio at http://localhost:3333
```

## Deploy

```bash
pnpm --filter @kcvv/studio deploy
```

Deploys to [kcvvelewijt.sanity.studio](https://kcvvelewijt.sanity.studio).

## Editing schemas

All schema files live in `packages/sanity-schemas/src/`. Changes there apply to both production and staging studios automatically — do not edit studio-local copies.
