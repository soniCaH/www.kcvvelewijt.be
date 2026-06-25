# @kcvv/studio — Sanity Studio (production)

Sanity Studio for the KCVV Elewijt website, connected to the **production** dataset.

Schemas are not defined here — they are imported from the shared [`@kcvv/sanity-schemas`](../../packages/sanity-schemas/) package. Both studios (production and staging) consume identical schema definitions.

## Local development

```bash
pnpm --filter @kcvv/studio dev   # starts Studio at http://localhost:3333
```

## Deploy

```bash
cd apps/studio && npx sanity deploy
```

Deploys to [kcvvelewijt.sanity.studio](https://kcvvelewijt.sanity.studio).

> Use `npx sanity deploy` (or `pnpm --filter @kcvv/studio run deploy`) — **not** bare
> `pnpm --filter @kcvv/studio deploy`, which invokes pnpm's built-in `deploy` and errors.
> There is no CI auto-deploy; schema changes only go live after a manual redeploy.

## Editing schemas

All schema files live in `packages/sanity-schemas/src/`. Changes there apply to both production and staging studios automatically — do not edit studio-local copies.
