# @kcvv/studio — Sanity Studio (production)

Sanity Studio for the KCVV Elewijt website, connected to the **production** dataset.

Schemas are not defined here — they are imported from the shared [`@kcvv/sanity-schemas`](../../packages/sanity-schemas/) package. Both studios (production and staging) consume identical schema definitions.

## Local development

```bash
pnpm --filter @kcvv/studio dev   # starts Studio at http://localhost:3333
```

> `dev` edits **production** data: the dataset is hardcoded to `production`, and no environment
> variable or `.env*` file can change it. Try unreleased studio code in `@kcvv/studio-staging`.

## Deploy

```bash
pnpm --filter @kcvv/studio run deploy
```

CI runs this on every merge to `main`; a manual deploy is the exception. Deploys to [kcvvelewijt.sanity.studio](https://kcvvelewijt.sanity.studio).

> Use `pnpm --filter @kcvv/studio run deploy` — **not** bare
> `pnpm --filter @kcvv/studio deploy`, which invokes pnpm's built-in `deploy` and errors.

## Editing schemas

All schema files live in `packages/sanity-schemas/src/`. Changes there apply to both production and staging studios automatically — do not edit studio-local copies.
