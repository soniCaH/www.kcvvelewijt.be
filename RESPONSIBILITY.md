# Responsibility Finder - Hulp Systeem

**Status:** Active — data managed via Sanity CMS
**Last Updated:** March 2026

---

## Overview

An interactive "Hulp" (Help) system that helps visitors quickly find the right contact person by answering:

**"IK BEN [ROLE] EN IK [QUESTION]"**

### Current Status

- ✅ 11 questions configured across 6 categories
- ✅ Data managed via Sanity CMS (`responsibilityPath` document type)
- ✅ Server-side rendered with ISR (revalidate: 3600)

---

## Features

- **Smart Autocomplete**: Type and get instant suggestions
- **Role-Based Filtering**: Filter by speler, ouder, trainer, supporter, niet-lid
- **Fuzzy Matching**: Finds questions even with partial input
- **Complete Answers**: Shows contact person, steps, and links
- **Organigram Deep-Link**: Links to the relevant person in the organigram
- **Mobile Optimized**: Works on all devices

---

## Where to Find It

### Dedicated Page

- **URL**: `/hulp`
- **Component**: `apps/web/src/app/(main)/hulp/page.tsx`

### Homepage Block

- **Component**: `<ResponsibilityBlock />` — compact version for homepage integration

---

## How It Works

### Data Flow

```text
Sanity CMS (responsibilityPath docs)
  → GROQ query (responsibilityPaths.ts)
  → SanityService.getResponsibilityPaths()
  → mapped to ResponsibilityPath[]
  → page.tsx (server component, ISR)
  → <HelpPage paths={paths} />
  → <ResponsibilityFinder paths={paths} />
```

### Smart Matching Algorithm

1. **Role Match** (+30 points): Filters by selected role
2. **Exact Question Match** (+50 points): Question text contains search term
3. **Keyword Match** (+10 points per keyword): Keywords match search
4. **Word-by-Word** (+3–5 points): Individual words match

Results sorted by score, top 6 shown.

---

## Technical Stack

### Components

```text
src/components/responsibility/
├── ResponsibilityFinder.tsx    # Main interactive component
├── ResponsibilityBlock.tsx     # Homepage block version
├── __fixtures__/
│   └── responsibility-paths.fixture.ts  # Mock data for tests/stories
└── index.ts
```

### Data Layer

```text
src/lib/sanity/queries/responsibilityPaths.ts  # GROQ query + CONTACT_PROJECTION
src/lib/effect/services/SanityService.ts       # mapResponsibilityPath(), getResponsibilityPaths()
src/lib/effect/schemas/responsibility.schema.ts # Effect Schema validation
src/types/responsibility.ts                     # TypeScript interfaces
```

### Sanity Schema

Document type: `responsibilityPath`
Studio path: `apps/studio/schemaTypes/responsibilityPath.ts`

---

## Adding/Editing Questions

All content is managed in **Sanity Studio**:

1. Go to Sanity Studio → **Responsibility Paths**
2. Create a new document or edit an existing one
3. Fill in: title, slug, audience (roles), question, keywords, summary, category, icon, primaryContact, steps
4. Set `active: true` to publish
5. The website revalidates automatically every hour (ISR)

### Primary Contact

The `primaryContact` field accepts either:

- A **staffMember reference** (preferred): links to a Sanity `staffMember` doc; email/phone/department are pulled from there
- **Inline fields**: role, email, phone, department as fallback when no staff member record exists

### Departments

Valid values for `department` on contacts: `hoofdbestuur` | `jeugdbestuur` | `algemeen`

---

## Testing

### Unit Tests

```bash
pnpm --filter @kcvv/web test src/components/responsibility/ResponsibilityFinder.test.tsx
```

Tests use fixtures from `src/components/responsibility/__fixtures__/responsibility-paths.fixture.ts`.

### Local Preview

```bash
pnpm --filter @kcvv/web dev
# Visit http://localhost:3000/hulp
```

---

## Changelog

### March 2026 — Migrated to Sanity CMS

- Data moved from static `src/data/responsibility-paths.ts` to Sanity `responsibilityPath` documents
- `SanityService.getResponsibilityPaths()` maps Sanity DTOs to `ResponsibilityPath[]`
- Removed markdown pipeline (`content/responsibility/*.md`, build/watch scripts)
- Test/story fixtures consolidated in `__fixtures__/responsibility-paths.fixture.ts`

### November 2025 — Initial Release

- 15 pre-configured questions
- Smart autocomplete + large typography design
- Mobile optimization
- Dedicated `/hulp` page + homepage block
