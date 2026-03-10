# Sanity Dynamic Club Pages Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded `/club/register`, `/club/cashless`, and `/club/downloads` pages with a single dynamic Next.js route that fetches `page` documents from Sanity, so editors can update content without a code deploy.

**Architecture:** A `[slug]` dynamic route under `apps/web/src/app/(main)/club/` fetches any Sanity `page` document by slug and renders it via the existing `SanityArticleBody` (PortableText) component. Existing specific routes (`bestuur`, `jeugdbestuur`, `organigram`, etc.) continue to take priority via Next.js route resolution. A new `SanityService.getPage(slug)` method handles the fetch. Content for the three pages is migrated via `scripts/drupal-to-sanity/src/migrate-pages.ts`, which uploads PDFs as Sanity file assets and creates the `page` documents in both staging and production datasets. Post-migration edits (e.g. price changes, new downloads) are made directly in Sanity Studio.

**Tech Stack:** Next.js 15 App Router, Effect, Sanity GROQ, `@portabletext/react` (already installed), `SanityArticleBody` component (already exists)

---

## Task 1: Add GROQ query + Sanity interface

**Files:**

- Create: `apps/web/src/lib/sanity/queries/pages.ts`
- Modify: `apps/web/src/lib/effect/services/SanityService.ts`

**Step 1: Create the query file**

```typescript
// apps/web/src/lib/sanity/queries/pages.ts
export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  body[]{ ..., "fileUrl": file.asset->url, "asset": select(_type == "image" => asset->{ url }) }
}`;
```

**Step 2: Add `SanityPage` interface to SanityService.ts** (after existing interfaces, before `SanityServiceInterface`)

```typescript
export interface SanityPage {
  _id: string;
  title: string;
  slug: { current: string };
  body: unknown[] | null;
}
```

**Step 3: Add `getPage` to `SanityServiceInterface`**

```typescript
readonly getPage: (slug: string) => Effect.Effect<SanityPage | null>;
```

**Step 4: Add `getPage` implementation** (inside the `SanityService` object, alongside other methods)

```typescript
getPage: (slug) =>
  fetchGroq<SanityPage | null>(PAGE_BY_SLUG_QUERY, { slug }),
```

**Step 5: Add the import** for `PAGE_BY_SLUG_QUERY` at the top of SanityService.ts

**Step 6: Run type-check**

```bash
pnpm --filter @kcvv/web tsc --noEmit
```

Expected: no errors

**Step 7: Commit**

```bash
git add apps/web/src/lib/sanity/queries/pages.ts apps/web/src/lib/effect/services/SanityService.ts
git commit -m "feat(sanity): add PAGE_BY_SLUG_QUERY and SanityService.getPage"
```

---

## Task 2: Add `getPage` test

**Files:**

- Modify: `apps/web/src/lib/effect/services/SanityService.test.ts`

**Step 1: Add test for `getPage` returning a page**

Add a new `describe("getPage")` block at the end of the test file:

```typescript
describe("getPage", () => {
  it("returns a SanityPage when found", async () => {
    const mockPage = {
      _id: "page-123",
      title: "Praktische Info",
      slug: { current: "register" },
      body: [{ _type: "block", children: [{ text: "Hello" }] }],
    };
    mockFetch(mockPage);

    const result = await Effect.runPromise(
      SanityService.getPage("register").pipe(
        Effect.provide(Layer.succeed(SanityService, makeSanityServiceLive())),
      ),
    );

    expect(result).not.toBeNull();
    expect(result?._id).toBe("page-123");
    expect(result?.title).toBe("Praktische Info");
    expect(vi.mocked(sanityClient.fetch)).toHaveBeenCalledWith(
      PAGE_BY_SLUG_QUERY,
      expect.objectContaining({ slug: "register" }),
    );
  });

  it("returns null when page not found", async () => {
    mockFetch(null);

    const result = await Effect.runPromise(
      SanityService.getPage("unknown-slug").pipe(
        Effect.provide(Layer.succeed(SanityService, makeSanityServiceLive())),
      ),
    );

    expect(result).toBeNull();
  });
});
```

Also add `PAGE_BY_SLUG_QUERY` to the imports from the queries file.

**Step 2: Run tests**

```bash
pnpm --filter @kcvv/web test src/lib/effect/services/SanityService.test.ts
```

Expected: all pass

**Step 3: Commit**

```bash
git add apps/web/src/lib/effect/services/SanityService.test.ts
git commit -m "test(sanity): add getPage tests"
```

---

## Task 3: Create dynamic `[slug]` route under `/club/`

**Files:**

- Create: `apps/web/src/app/(main)/club/[slug]/page.tsx`

**Step 1: Create the dynamic page**

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { PageTitle } from "@/components/layout";
import { SanityArticleBody } from "@/components/article/SanityArticleBody/SanityArticleBody";
import type { PortableTextBlock } from "@portabletext/react";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchPage(slug: string) {
  return runPromise(
    SanityService.getPage(slug).pipe(Effect.orDie),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return {};

  return {
    title: `${page.title} | KCVV Elewijt`,
    openGraph: {
      title: `${page.title} - KCVV Elewijt`,
      type: "website",
    },
  };
}

export const revalidate = 3600;

export default async function DynamicClubPage({ params }: Props) {
  const { slug } = await params;
  const page = await fetchPage(slug);

  if (!page) notFound();

  return (
    <>
      <PageTitle title={page.title} />
      <div className="mx-auto max-w-inner-lg px-4 py-8 content">
        <SanityArticleBody content={page.body as PortableTextBlock[]} />
      </div>
    </>
  );
}
```

**Step 2: Run type-check**

```bash
pnpm --filter @kcvv/web tsc --noEmit
```

Expected: no errors

**Step 3: Build check**

```bash
pnpm turbo build --filter=@kcvv/web
```

Expected: build succeeds

**Step 4: Commit**

```bash
git add "apps/web/src/app/(main)/club/[slug]/page.tsx"
git commit -m "feat(web): add dynamic Sanity-backed club/[slug] page route"
```

---

## Task 4: Delete hardcoded pages

**Files:**

- Delete: `apps/web/src/app/(main)/club/register/` (entire directory)
- Delete: `apps/web/src/app/(main)/club/cashless/` (entire directory)
- Delete: `apps/web/src/app/(main)/club/downloads/` (entire directory)

**Step 1: Check for any imports of these pages**

```bash
grep -r "club/register\|club/cashless\|club/downloads\|RegisterPage\|CashlessPage\|DownloadsPage" apps/web/src --include="*.ts" --include="*.tsx" -l
```

Expected: only the page files themselves (no external imports)

**Step 2: Delete the directories**

```bash
git rm -r "apps/web/src/app/(main)/club/register" "apps/web/src/app/(main)/club/cashless" "apps/web/src/app/(main)/club/downloads"
```

**Step 3: Run type-check**

```bash
pnpm --filter @kcvv/web tsc --noEmit
```

Expected: no errors

**Step 4: Commit**

```bash
git commit -m "feat(web): remove hardcoded register, cashless, downloads pages"
```

---

## Task 5: Migrate page content to Sanity

> Content is migrated via script — no manual Studio entry required.

Run `scripts/drupal-to-sanity/src/migrate-pages.ts` against both datasets:

```bash
# staging
SANITY_DATASET=staging pnpm migrate:pages

# production
SANITY_DATASET=production pnpm migrate:pages
```

The script:

- Uploads the three PDFs from `apps/web/public/downloads/` as Sanity file assets
- Creates `page` documents with slugs `cashless`, `register`, `downloads` using structured Portable Text body content
- Uses `createOrReplace` so it is safe to re-run

Post-migration, editors can update page content directly in Sanity Studio without a code deploy.

**Verification:**

- Visit `http://localhost:3000/club/register` — should render Sanity content
- Visit `http://localhost:3000/club/cashless` — should render Sanity content
- Visit `http://localhost:3000/club/downloads` — should render Sanity content
- Visit `http://localhost:3000/club/organigram` — should still work (specific route takes priority)
- Visit `http://localhost:3000/club/unknown-slug` — should return 404 / Not Found

---

## Task 6: Final checks + push

**Step 1: Run full check**

```bash
pnpm --filter @kcvv/web check-all
```

Expected: lint, type-check, and tests all pass

**Step 2: Push**

```bash
git push -u origin feat/sanity-dynamic-club-pages
```
