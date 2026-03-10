# Organigram → Sanity Live Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded `club-structure.ts` organigram with live Sanity `staffMember` data, add PSD coaching staff sync, and give non-technical editors full control over the organigram in Sanity Studio.

**Architecture:** `staffMember` documents gain five new fields (`parentMember`, `positionTitle`, `positionShort`, `responsibilities`, `inOrganigram`). A GROQ query fetches only documents where `inOrganigram == true`, maps them to `OrgChartNode[]` with a hardcoded root "KCVV Elewijt" node, and the organigram page renders live data with ISR (1h). PSD coaching staff are synced automatically; board members are managed manually in Studio.

**Tech Stack:** Sanity Studio (schema + structure), Effect (SanityService), GROQ, Next.js ISR, Vitest, Cloudflare Worker sync (apps/api)

**GitHub issue:** #755

---

## Key Decisions

- `inOrganigram: boolean` — **explicit toggle**. Organigram starts empty; editors opt-in one by one. Ghost/inactive staff are ignored until toggled.
- Root "KCVV Elewijt" node is **hardcoded** in the mapper (not a Sanity doc). Members with `inOrganigram == true` and no `parentMember` get `parentId: "club"` automatically.
- `positionTitle` — free-text display title (e.g. "Technisch Coördinator Jeugd"). Distinct from `role` enum.
- `positionShort` — short badge code (e.g. "T1", "VP"). Synced from PSD `functionTitle` for coaching staff; editors fill manually for board members.
- PSD sync uses ID pattern `staffMember-psd-{psdId}`. Drupal-migrated docs (`staff-coach-*`, `staff-board-*`) coexist. Editors should set `inOrganigram=true` on PSD-synced docs for coaching staff since those receive automatic updates.
- `responsibilities` — plain-text field; editors fill gradually. Modal hides the block when empty (already guarded in UI).
- Both `apps/studio/schemaTypes/` and `apps/studio/staging/schemaTypes/` must be kept in sync for every schema change.

---

## Task 1: Sanity Schema — staffMember extensions

**Files:**

- Modify: `apps/studio/schemaTypes/staffMember.ts`
- Modify: `apps/studio/staging/schemaTypes/staffMember.ts` (exact mirror)

### Step 1: Add five new fields to `staffMember.ts`

Add these `defineField` entries inside the `fields` array, **before** the `psdId` field at the bottom:

```typescript
defineField({
  name: 'inOrganigram',
  title: 'In organigram',
  type: 'boolean',
  initialValue: false,
  description: 'Zet aan om deze persoon in het organigram te tonen. Laat uit voor inactieve of onvolledige leden.',
}),
defineField({
  name: 'parentMember',
  title: 'Rapporteert aan',
  type: 'reference',
  to: [{type: 'staffMember'}],
  weak: true,
  description: 'Hiërarchisch bovenliggende persoon. Leeg = rootniveau (rechtstreeks onder KCVV Elewijt).',
  hidden: ({document}) => !document?.inOrganigram,
}),
defineField({
  name: 'positionTitle',
  title: 'Functietitel (organigram)',
  type: 'string',
  description: 'Vrije tekst zoals getoond in het organigram, bv. "Technisch Coördinator Jeugd". Mag afwijken van het Rol-veld.',
  hidden: ({document}) => !document?.inOrganigram,
}),
defineField({
  name: 'positionShort',
  title: 'Korte functiecode',
  type: 'string',
  description: 'Badge in het diagram, bv. "T1", "VP", "JC". Max 6 tekens. Gesynchroniseerd vanuit PSD voor trainers.',
  validation: (Rule) => Rule.max(6),
  hidden: ({document}) => !document?.inOrganigram,
}),
defineField({
  name: 'responsibilities',
  title: 'Verantwoordelijkheden',
  type: 'text',
  rows: 3,
  description: 'Korte beschrijving van taken en verantwoordelijkheden. Getoond in het detail-venster van het organigram.',
  hidden: ({document}) => !document?.inOrganigram,
}),
```

### Step 2: Mirror changes in staging schema

Copy the identical five `defineField` entries into `apps/studio/staging/schemaTypes/staffMember.ts` in the same position.

### Step 3: Commit

```bash
git add apps/studio/schemaTypes/staffMember.ts apps/studio/staging/schemaTypes/staffMember.ts
git commit -m "feat(schema): add organigram fields to staffMember (inOrganigram, parentMember, positionTitle, positionShort, responsibilities)"
```

---

## Task 2: Sanity Studio — Structure update

**Files:**

- Modify: `apps/studio/structure.ts`
- Modify: `apps/studio/staging/structure.ts` (exact mirror)

### Step 1: Update Staff section in `structure.ts`

Replace the current single-level Staff item:

```typescript
// BEFORE:
S.listItem()
  .title('Staff')
  .child(S.documentTypeList('staffMember').title('Staff')),
```

With a nested section:

```typescript
S.listItem()
  .title('Staff')
  .child(
    S.list()
      .title('Staff')
      .items([
        S.listItem()
          .title('Alle leden')
          .child(
            S.documentTypeList('staffMember')
              .title('Alle leden')
              .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
          ),
        S.listItem()
          .title('📋 Organigram beheer')
          .child(
            S.documentList()
              .title('In organigram')
              .filter('_type == "staffMember" && inOrganigram == true')
              .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
          ),
        S.listItem()
          .title('⚠️ Aanvullen vereist')
          .child(
            S.documentList()
              .title('Ontbrekende velden')
              .filter(
                '_type == "staffMember" && inOrganigram == true && (!defined(positionTitle) || !defined(photo))',
              )
              .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
          ),
        S.listItem()
          .title('🔄 PSD gesynchroniseerd')
          .child(
            S.documentList()
              .title('PSD gesynchroniseerd')
              .filter('_type == "staffMember" && defined(psdId)')
              .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
          ),
      ]),
  ),
```

### Step 2: Mirror in staging

Copy the identical replacement into `apps/studio/staging/structure.ts`.

### Step 3: Commit

```bash
git add apps/studio/structure.ts apps/studio/staging/structure.ts
git commit -m "feat(studio): add organigram management and enrichment views to Staff section"
```

---

## Task 3: PSD staff sync (apps/api)

**Files:**

- Modify: `apps/api/src/sanity/client.ts` — add `SanityStaffDoc` + `upsertStaff`
- Modify: `apps/api/src/sync/psd-sanity-sync.ts` — add `transformStaff` + staff sync loop
- Modify: `apps/api/src/sync/psd-sanity-sync.test.ts` — add `transformStaff` tests

### Step 1: Write failing test for `transformStaff`

In `apps/api/src/sync/psd-sanity-sync.test.ts`, add:

```typescript
import { transformStaff } from "./psd-sanity-sync";
import type { PsdMember } from "@kcvv/api-contract";

const baseStaff: PsdMember = {
  id: 99,
  firstName: "Marc",
  lastName: "Peeters",
  birthDate: "1975-04-12 00:00",
  nationality: "Belgium",
  profilePictureURL: null,
  keeper: false,
  bestPosition: null,
  active: true,
  status: "staff",
  functionTitle: "T1",
};

describe("transformStaff", () => {
  it("maps PSD staff to SanityStaffDoc", () => {
    const result = transformStaff(baseStaff);
    expect(result.psdId).toBe("99");
    expect(result.firstName).toBe("Marc");
    expect(result.lastName).toBe("Peeters");
    expect(result.birthDate).toBe("1975-04-12");
    expect(result.positionShort).toBe("T1");
  });

  it("handles null functionTitle", () => {
    const result = transformStaff({ ...baseStaff, functionTitle: null });
    expect(result.positionShort).toBeNull();
  });

  it("handles null birthDate", () => {
    const result = transformStaff({ ...baseStaff, birthDate: null });
    expect(result.birthDate).toBeNull();
  });
});
```

### Step 2: Run to confirm it fails

```bash
pnpm --filter @kcvv/api test --run
```

Expected: FAIL — `transformStaff` not found.

### Step 3: Add `SanityStaffDoc` and `upsertStaff` to `apps/api/src/sanity/client.ts`

Add interface after `SanityTeamDoc`:

```typescript
export interface SanityStaffDoc {
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null; // "YYYY-MM-DD"
  positionShort: string | null; // from PSD functionTitle
}
```

Add to `SanityWriteClientInterface`:

```typescript
readonly upsertStaff: (
  doc: SanityStaffDoc,
) => Effect.Effect<void, SanityWriteError>;
```

Add implementation inside `SanityWriteClientLive` return object:

```typescript
upsertStaff: (doc) =>
  upsert("staffMember", doc.psdId, {
    psdId: doc.psdId,
    firstName: doc.firstName,
    lastName: doc.lastName,
    birthDate: doc.birthDate,
    positionShort: doc.positionShort,
  }),
```

### Step 4: Add `transformStaff` to `apps/api/src/sync/psd-sanity-sync.ts`

Add import for `SanityStaffDoc`:

```typescript
import type {
  SanityPlayerDoc,
  SanityTeamDoc,
  SanityStaffDoc,
} from "../sanity/client";
```

Add `transformStaff` after `transformTeam`:

```typescript
/**
 * Convert a PSD staff member record into a Sanity staffMember document.
 * Only PSD-sourced fields are written — editorial fields (role, department,
 * parentMember, inOrganigram, positionTitle, responsibilities, photo) are never touched.
 */
export function transformStaff(psd: PsdMember): SanityStaffDoc {
  return {
    psdId: String(psd.id),
    firstName: psd.firstName,
    lastName: psd.lastName,
    birthDate: psd.birthDate ? psd.birthDate.split(" ")[0]! : null,
    positionShort: psd.functionTitle ?? null,
  };
}
```

### Step 5: Add staff sync loop to `runSync`

Inside the `Effect.forEach(teams, ...)` lambda, **after** the player upsert block and **before** `sanity.upsertTeam(...)`:

```typescript
// Sync coaching staff from PSD
const staffMembers = members.filter((m) => m.status === "staff" && m.active);
yield * Effect.log(`team ${team.id}: ${staffMembers.length} staff members`);
yield *
  Effect.forEach(
    staffMembers,
    (m) =>
      Effect.gen(function* () {
        const doc = transformStaff(m);
        yield* sanity.upsertStaff(doc);
      }),
    { concurrency: 3 },
  );
```

### Step 6: Run tests to confirm they pass

```bash
pnpm --filter @kcvv/api test --run
```

Expected: PASS.

### Step 7: Commit

```bash
git add apps/api/src/sanity/client.ts apps/api/src/sync/psd-sanity-sync.ts apps/api/src/sync/psd-sanity-sync.test.ts
git commit -m "feat(sync): add PSD coaching staff sync to staffMember documents"
```

---

## Task 4: GROQ query + SanityService.getStaffMembers (apps/web)

**Files:**

- Create: `apps/web/src/lib/sanity/queries/staffMembers.ts`
- Modify: `apps/web/src/lib/effect/services/SanityService.ts`
- Modify: `apps/web/src/lib/effect/services/SanityService.test.ts`

### Step 1: Write failing tests for `getStaffMembers`

In `SanityService.test.ts`, add a new describe block:

```typescript
describe("SanityService.getStaffMembers", () => {
  it("maps Sanity staffMember docs to OrgChartNode[] and prepends club root", async () => {
    const { sanityClient } = await import("../../sanity/client");
    vi.mocked(sanityClient.fetch).mockResolvedValueOnce([
      {
        _id: "staffMember-psd-42",
        firstName: "Jan",
        lastName: "Smeets",
        positionTitle: "Jeugdcoördinator",
        positionShort: "JC",
        department: "jeugdbestuur",
        email: "jeugd@kcvvelewijt.be",
        phone: null,
        photoUrl: "https://cdn.sanity.io/images/test/photo.jpg",
        responsibilities: "Coördinatie jeugdwerking",
        parentId: null,
      },
    ]);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getStaffMembers();
    }).pipe(Effect.provide(SanityServiceLive));

    const nodes = await Effect.runPromise(program);
    expect(nodes[0]?.id).toBe("club");
    expect(nodes[0]?.name).toBe("KCVV Elewijt");
    expect(nodes[0]?.parentId).toBeNull();
    expect(nodes[1]?.id).toBe("staffMember-psd-42");
    expect(nodes[1]?.name).toBe("Jan Smeets");
    expect(nodes[1]?.title).toBe("Jeugdcoördinator");
    expect(nodes[1]?.positionShort).toBe("JC");
    expect(nodes[1]?.parentId).toBe("club"); // null parentId → "club"
    expect(nodes[1]?.imageUrl).toBe(
      "https://cdn.sanity.io/images/test/photo.jpg",
    );
    expect(nodes[1]?.responsibilities).toBe("Coördinatie jeugdwerking");
  });

  it("preserves parentId when parentMember is set in Sanity", async () => {
    const { sanityClient } = await import("../../sanity/client");
    vi.mocked(sanityClient.fetch).mockResolvedValueOnce([
      {
        _id: "staffMember-psd-1",
        firstName: "Root",
        lastName: "Person",
        positionTitle: "Voorzitter",
        positionShort: "PRES",
        department: "hoofdbestuur",
        email: null,
        phone: null,
        photoUrl: null,
        responsibilities: null,
        parentId: null,
      },
      {
        _id: "staffMember-psd-2",
        firstName: "Child",
        lastName: "Person",
        positionTitle: "Secretaris",
        positionShort: "SEC",
        department: "hoofdbestuur",
        email: null,
        phone: null,
        photoUrl: null,
        responsibilities: null,
        parentId: "staffMember-psd-1",
      },
    ]);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getStaffMembers();
    }).pipe(Effect.provide(SanityServiceLive));

    const nodes = await Effect.runPromise(program);
    // nodes[0]=club root, nodes[1]=Root Person, nodes[2]=Child Person
    expect(nodes[2]?.parentId).toBe("staffMember-psd-1");
  });
});
```

### Step 2: Run to confirm it fails

```bash
pnpm --filter @kcvv/web test --run src/lib/effect/services/SanityService.test.ts
```

Expected: FAIL — `getStaffMembers` not found.

### Step 3: Create `apps/web/src/lib/sanity/queries/staffMembers.ts`

```typescript
/**
 * Fetches all staffMember documents marked for the organigram, ordered by last name.
 */
export const STAFF_MEMBERS_QUERY = `*[_type == "staffMember" && inOrganigram == true] | order(lastName asc) {
  _id,
  firstName,
  lastName,
  positionTitle,
  positionShort,
  department,
  email,
  phone,
  "photoUrl": photo.asset->url,
  responsibilities,
  "parentId": parentMember->_id
}`;
```

### Step 4: Add `SanityOrgMember`, mapper, and `getStaffMembers()` to `SanityService.ts`

Add import at top:

```typescript
import { STAFF_MEMBERS_QUERY } from "../../sanity/queries/staffMembers";
import type { OrgChartNode } from "../../../types/organigram";
```

Add interface after `SanityResponsibilityPath`:

```typescript
export interface SanityOrgMember {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  positionTitle: string | null;
  positionShort: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  responsibilities: string | null;
  parentId: string | null; // resolved from parentMember->_id
}
```

Add to `SanityServiceInterface`:

```typescript
readonly getStaffMembers: () => Effect.Effect<OrgChartNode[]>;
```

Add before `SanityServiceLive`:

```typescript
const CLUB_ROOT_NODE: OrgChartNode = {
  id: "club",
  name: "KCVV Elewijt",
  title: "Voetbalclub",
  imageUrl: "/images/logo-flat.png",
  department: "algemeen",
  parentId: null,
};

function mapOrgMember(m: SanityOrgMember): OrgChartNode {
  return {
    id: m._id,
    name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(),
    title: m.positionTitle ?? "",
    positionShort: m.positionShort ?? undefined,
    imageUrl: m.photoUrl ?? undefined,
    email: m.email ?? undefined,
    phone: m.phone ?? undefined,
    responsibilities: m.responsibilities ?? undefined,
    department: (m.department ?? undefined) as OrgChartNode["department"],
    parentId: m.parentId ?? "club",
  };
}
```

Add to `SanityServiceLive` return object:

```typescript
getStaffMembers: () =>
  fetchGroq<SanityOrgMember[]>(STAFF_MEMBERS_QUERY).pipe(
    Effect.map((members) => [CLUB_ROOT_NODE, ...members.map(mapOrgMember)]),
  ),
```

### Step 5: Run tests to confirm they pass

```bash
pnpm --filter @kcvv/web test --run src/lib/effect/services/SanityService.test.ts
```

Expected: PASS.

### Step 6: Commit

```bash
git add apps/web/src/lib/sanity/queries/staffMembers.ts apps/web/src/lib/effect/services/SanityService.ts apps/web/src/lib/effect/services/SanityService.test.ts
git commit -m "feat(sanity): add STAFF_MEMBERS_QUERY and SanityService.getStaffMembers()"
```

---

## Task 5: Responsibility deep-link — wire `memberId`

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/responsibilityPaths.ts`
- Modify: `apps/web/src/lib/effect/services/SanityService.ts`
- Modify: `apps/web/src/lib/effect/services/SanityService.test.ts`

### Step 1: Write failing test

Add to `SanityService.test.ts`:

```typescript
describe("SanityService.getResponsibilityPaths — memberId", () => {
  it("forwards memberId from staffMember reference", async () => {
    const { sanityClient } = await import("../../sanity/client");
    vi.mocked(sanityClient.fetch).mockResolvedValueOnce([
      {
        id: "test-path",
        role: ["ouder"],
        question: "Wie contacteer ik?",
        keywords: ["contact"],
        summary: "Contacteer de coördinator.",
        category: "algemeen",
        icon: null,
        primaryContact: {
          role: "Jeugdcoördinator",
          email: "jeugd@kcvvelewijt.be",
          phone: null,
          department: "jeugdbestuur",
          name: "Jan Smeets",
          memberId: "staffMember-psd-42",
        },
        steps: [],
        relatedPaths: [],
      },
    ]);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getResponsibilityPaths();
    }).pipe(Effect.provide(SanityServiceLive));

    const paths = await Effect.runPromise(program);
    expect(paths[0]?.primaryContact.memberId).toBe("staffMember-psd-42");
  });
});
```

### Step 2: Run to confirm it fails

```bash
pnpm --filter @kcvv/web test --run src/lib/effect/services/SanityService.test.ts
```

Expected: FAIL — `memberId` is `undefined`.

### Step 3: Update `CONTACT_PROJECTION`

Add `"memberId": staffMember->_id` as the last line inside the projection:

```typescript
const CONTACT_PROJECTION = `{
  "role": role,
  "email": select(defined(staffMember) => staffMember->email, email),
  "phone": select(defined(staffMember) => staffMember->phone, phone),
  "department": select(defined(staffMember) => staffMember->department, department),
  "name": select(
    defined(staffMember) => staffMember->firstName + " " + staffMember->lastName,
    null
  ),
  "memberId": staffMember->_id
}`;
```

### Step 4: Add `memberId` to `SanityResponsibilityContact` and `mapContact()`

Update the interface:

```typescript
export interface SanityResponsibilityContact {
  role: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  name: string | null;
  memberId: string | null;
}
```

Update `mapContact()` — add after the `department` spread:

```typescript
...(c.memberId ? { memberId: c.memberId } : {}),
```

### Step 5: Run tests to confirm they pass

```bash
pnpm --filter @kcvv/web test --run src/lib/effect/services/SanityService.test.ts
```

Expected: PASS.

### Step 6: Commit

```bash
git add apps/web/src/lib/sanity/queries/responsibilityPaths.ts apps/web/src/lib/effect/services/SanityService.ts apps/web/src/lib/effect/services/SanityService.test.ts
git commit -m "feat(sanity): wire memberId through CONTACT_PROJECTION and mapContact() for organigram deep-link"
```

---

## Task 6: Organigram page — fetch from Sanity

**Files:**

- Modify: `apps/web/src/app/(main)/club/organigram/page.tsx`

### Step 1: Update `page.tsx`

Remove the static import:

```typescript
// DELETE this line:
import { clubStructure } from "@/data/club-structure";
```

Replace the `Effect.gen` block and `members` prop:

```typescript
export default async function OrganigramPage() {
  const [members, responsibilityPaths] = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* Effect.all([
        sanity.getStaffMembers(),
        sanity.getResponsibilityPaths(),
      ]);
    }),
  );

  return (
    // ... existing JSX unchanged ...
    // Change: members={clubStructure}  →  members={members}
  );
}
```

Keep `export const revalidate = 3600;` unchanged.

### Step 2: Type-check

```bash
pnpm --filter @kcvv/web typecheck
```

Expected: no errors.

### Step 3: Commit

```bash
git add "apps/web/src/app/(main)/club/organigram/page.tsx"
git commit -m "feat(organigram): fetch members from SanityService.getStaffMembers() replacing static clubStructure"
```

---

## Task 7: Cleanup — fixture, stories, delete `club-structure.ts`

**Files:**

- Create: `apps/web/src/components/organigram/__fixtures__/staff-members.fixture.ts`
- Modify (8 files): all story files importing from `@/data/club-structure`
  - `src/components/organigram/UnifiedOrganigramClient.stories.tsx`
  - `src/components/organigram/chart/EnhancedOrgChart.stories.tsx`
  - `src/components/organigram/chart/MobileNavigationDrawer.stories.tsx`
  - `src/components/organigram/chart/ContactOverlay.stories.tsx`
  - `src/components/organigram/card-hierarchy/CardHierarchy.stories.tsx`
  - `src/components/organigram/card-hierarchy/HierarchyLevel.stories.tsx`
  - `src/components/organigram/card-hierarchy/ExpandableCard.stories.tsx`
  - Any other files found by: `grep -r "club-structure" apps/web/src/ -l`
- Delete: `apps/web/src/data/club-structure.ts`

### Step 1: Create fixture

Create `apps/web/src/components/organigram/__fixtures__/staff-members.fixture.ts`:

```typescript
import type { OrgChartNode } from "@/types/organigram";

/** Minimal fixture matching the shape returned by SanityService.getStaffMembers() */
export const mockStaffMembers: OrgChartNode[] = [
  {
    id: "club",
    name: "KCVV Elewijt",
    title: "Voetbalclub",
    imageUrl: "/images/logo-flat.png",
    department: "algemeen",
    parentId: null,
  },
  {
    id: "staffMember-psd-001",
    name: "Pieter Claes",
    title: "Voorzitter",
    positionShort: "PRES",
    department: "hoofdbestuur",
    email: "voorzitter@kcvvelewijt.be",
    parentId: "club",
  },
  {
    id: "staffMember-psd-002",
    name: "Luc Martens",
    title: "Secretaris",
    positionShort: "SEC",
    department: "hoofdbestuur",
    email: "secretaris@kcvvelewijt.be",
    parentId: "staffMember-psd-001",
  },
  {
    id: "staffMember-psd-003",
    name: "Ann Desmet",
    title: "Jeugdcoördinator",
    positionShort: "JC",
    department: "jeugdbestuur",
    email: "jeugd@kcvvelewijt.be",
    parentId: "staffMember-psd-001",
  },
  {
    id: "staffMember-psd-004",
    name: "Tom Willems",
    title: "Hoofdtrainer",
    positionShort: "T1",
    department: "hoofdbestuur",
    parentId: "staffMember-psd-001",
  },
  {
    id: "staffMember-psd-005",
    name: "Dirk Pieters",
    title: "Assistent-trainer",
    positionShort: "T2",
    department: "hoofdbestuur",
    parentId: "staffMember-psd-004",
  },
];
```

### Step 2: Update all story files

For each story file, replace:

```typescript
import { clubStructure } from "@/data/club-structure";
// or any named import from "@/data/club-structure"
```

with:

```typescript
import { mockStaffMembers } from "../__fixtures__/staff-members.fixture";
// (adjust relative path per file — e.g. card-hierarchy stories need ../../__fixtures__/...)
```

Replace all usages of `clubStructure` with `mockStaffMembers`.

If `getHierarchicalStructure()` is called in a story, remove it — d3-org-chart and CardHierarchy both accept the flat `OrgChartNode[]` array directly.

### Step 3: Delete `club-structure.ts`

```bash
rm apps/web/src/data/club-structure.ts
```

### Step 4: Verify no remaining imports

```bash
grep -r "club-structure" apps/web/src/
```

Expected: no output.

### Step 5: Run full checks

```bash
pnpm --filter @kcvv/web lint:fix
pnpm --filter @kcvv/web typecheck
pnpm --filter @kcvv/web test --run
```

Expected: all pass.

### Step 6: Commit

```bash
git add -A
git commit -m "feat(organigram): replace club-structure.ts with Sanity fixture, update all stories (#755)"
```

---

## Task 8: OrgChartNode type cleanup

**Files:**

- Modify: `apps/web/src/types/organigram.ts`

### Step 1: Update `profileUrl` JSDoc

```typescript
// BEFORE:
/** Link to staff profile */
profileUrl?: string;

// AFTER:
/** Link to staff profile page (future use — not currently populated by Sanity) */
profileUrl?: string;
```

### Step 2: Commit

```bash
git add apps/web/src/types/organigram.ts
git commit -m "docs(organigram): update OrgChartNode.profileUrl JSDoc to remove Drupal reference"
```

---

## Task 9: Final verification & GitHub update

### Step 1: Run full check

```bash
pnpm --filter @kcvv/web check-all
pnpm --filter @kcvv/api typecheck
pnpm --filter @kcvv/api test --run
```

Expected: all pass.

### Step 2: Manual verification checklist

- [ ] `/club/organigram` loads (club root node only — no staff until `inOrganigram` is toggled)
- [ ] In Studio → Staff → Organigram beheer → toggle `inOrganigram = true` on one member → appears in organigram after revalidate
- [ ] Setting `parentMember` nests the member under the correct parent in the chart
- [ ] Studio → Staff → Aanvullen vereist shows members missing `positionTitle` or `photo`
- [ ] Studio → Staff → PSD gesynchroniseerd shows synced coaching staff
- [ ] From `/hulp`, clicking "Bekijk in organigram" for a path with a `staffMember` reference correctly opens that member's modal in the organigram
- [ ] `club-structure.ts` is gone — no import errors

### Step 3: Push and update GitHub issue #755

```bash
git push -u origin docs/organigram-sanity-live-data-plan
```

Add a comment on issue #755 linking to this plan and check off completed tasks as work progresses.

---

## Executor notes

- **Staging studio** (`apps/studio/staging/`) must always mirror production studio. Every schema and structure change has a staging equivalent — do not skip.
- **PSD sync duplicates**: Drupal-migrated coaching staff (`staff-coach-*`) and PSD-synced staff (`staffMember-psd-*`) coexist. Editors should prefer PSD-synced docs for the organigram (they auto-update). Drupal docs can be ignored or eventually deleted.
- **Photo URL optimization**: tracked in issue #760 — do NOT add image transform params here.
- **`positionShort` max 6 chars** validated in Sanity. PSD `functionTitle` (e.g. "Keeperstrainer") exceeds 6 chars and will be stored as-is; editors can shorten manually. Consider trimming to 6 in `transformStaff` if validation errors appear in sync logs.
- **`responsibilities`** is hidden in the modal when null/undefined — no UI change needed, it degrades gracefully.
