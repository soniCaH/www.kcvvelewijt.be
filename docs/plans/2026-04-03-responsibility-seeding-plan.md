# Responsibility Finder Seeding — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Seed ~28 static responsibility documents with organigramNode-based contacts, replacing the unused staffMember ref model.

**Architecture:** Schema change (contactType discriminator + organigramNode refs) → GROQ query updates → frontend type update → contact component update → seeding script → run on staging then production. New organigramNode "Gerechtelijk Correspondent" created as prerequisite.

**Tech Stack:** Sanity schemas (defineField/defineType), GROQ projections, TypeScript strict, Vitest, Sanity client mutations

**Design doc:** `docs/plans/2026-04-03-responsibility-seeding-design.md`
**PRD:** `docs/prd/staff-migration-organigram-seeding.md`

---

### Task 1: Create worktree and branch

**Step 1: Create worktree**

```bash
ISSUE_NUM=1207
BRANCH="feat/issue-${ISSUE_NUM}"
WORKTREE_PATH="../kcvv-issue-${ISSUE_NUM}"
git fetch origin
git worktree add "$WORKTREE_PATH" -b "$BRANCH" origin/main
cd "$WORKTREE_PATH"
pnpm install
```

**Step 2: Comment on issue**

```bash
gh issue comment 1207 --body "Starting implementation on branch \`feat/issue-1207\`. Worktree: \`../kcvv-issue-1207\`"
```

---

### Task 2: Schema — replace contactFields with contactType discriminator

**Files:**
- Modify: `packages/sanity-schemas/src/responsibility.ts:4-32` (contactFields)
- Modify: `packages/sanity-schemas/src/responsibility.ts:129-142` (primaryContact validation)

**Step 1: Replace `contactFields` (lines 4-32)**

Replace the entire `contactFields` array with the new contactType-discriminated version. See design doc "Schema changes" section for exact code. Key changes:
- Remove `staffMember` reference field
- Add `contactType` string field with radio layout (`position` | `team-role` | `manual`)
- Add `organigramNode` reference field (hidden unless contactType === `position`)
- Add `teamRole` string field (hidden unless contactType === `team-role`)
- Keep `role`, `email`, `phone`, `department` but hide unless contactType === `manual`
- All labels in Dutch

**Step 2: Update primaryContact validation (lines 134-142)**

Replace the custom validation to switch on `contactType`:
- `position` → require `organigramNode` ref
- `team-role` → require `teamRole` value
- `manual` → require at least one of `role`, `email`, `phone`

**Step 3: Verify both studios build**

```bash
pnpm --filter @kcvv/studio check-all
pnpm --filter @kcvv/studio-staging check-all
```

**Step 4: Commit**

```bash
git add packages/sanity-schemas/src/responsibility.ts
git commit -m "feat(schema): replace staffMember contacts with contactType discriminator

Contacts now reference organigramNode positions instead of individual
staffMember documents. Three types: position (organigram ref),
team-role (dynamic, for #1220), manual (fallback).

Refs #1207"
```

---

### Task 3: Preview — update responsibility preview to use organigramNode

**Files:**
- Modify: `packages/sanity-schemas/src/preview/responsibility-preview.ts:6-13` (select) and `:24-36` (prepare)

**Step 1: Update preview select (lines 6-13)**

Change the select object:
- Remove: `contactFirstName: 'primaryContact.staffMember->firstName'` (line 10)
- Remove: `contactLastName: 'primaryContact.staffMember->lastName'` (line 11)
- Add: `contactNodeTitle: 'primaryContact.organigramNode->title'`
- Add: `contactRole: 'primaryContact.role'`
- Add: `contactType: 'primaryContact.contactType'`

**Step 2: Update prepare function (lines 24-36)**

Update subtitle logic:
- If `contactType === 'position'` and `contactNodeTitle`: show node title
- If `contactType === 'team-role'`: show "Teamrol (dynamisch)"
- If `contactType === 'manual'` and `contactRole`: show role
- Else: show "(geen contact)"

**Step 3: Verify studios build**

```bash
pnpm --filter @kcvv/studio check-all
```

**Step 4: Commit**

```bash
git add packages/sanity-schemas/src/preview/responsibility-preview.ts
git commit -m "feat(schema): update responsibility preview for organigramNode contacts

Subtitle now shows organigram position title instead of staff member
name. Supports all three contactType variants.

Refs #1207"
```

---

### Task 4: Update responsibility repository GROQ query — write failing tests first

**Files:**
- Modify: `apps/web/src/lib/repositories/responsibility.repository.test.ts`
- Modify: `apps/web/src/types/responsibility.ts:21-36` (Contact interface)
- Modify: `apps/web/src/lib/repositories/responsibility.repository.ts:9-45` (GROQ query)

**Step 1: Update the Contact type** (`apps/web/src/types/responsibility.ts:21-36`)

Replace the `Contact` interface:

```typescript
interface Contact {
  contactType: 'position' | 'team-role' | 'manual'
  // position (organigramNode)
  position?: string
  roleCode?: string
  members?: Array<{ id: string; name: string; email?: string; phone?: string }>
  nodeId?: string
  // team-role (dynamic, resolved at runtime by #1220)
  teamRole?: 'trainer' | 'afgevaardigde'
  // manual (inline fallback)
  role?: string
  email?: string
  phone?: string
  department?: 'hoofdbestuur' | 'jeugdbestuur' | 'algemeen'
}
```

Remove `memberId` and `name` top-level fields — replaced by `members[]` array and `position`.

**Step 2: Update the `SolutionStep` interface** if it references Contact — ensure it uses the same type.

**Step 3: Update tests** (`responsibility.repository.test.ts`)

Update the mocked Sanity response shape in existing tests (lines 83-200) to match the new GROQ projection output. The mock data should return:
- `contactType: 'position'` with `position`, `members[]`, `nodeId`
- Test case for `contactType: 'manual'` with inline fields
- Test case for step contact being null (already tested)

**Step 4: Run tests to verify they fail**

```bash
cd apps/web && pnpm vitest run src/lib/repositories/responsibility.repository.test.ts
```

Expected: FAIL — GROQ projection still returns old shape.

**Step 5: Update the GROQ query** (`responsibility.repository.ts:9-45`)

Replace the `primaryContact` projection (lines 18-28):

```groq
"primaryContact": primaryContact {
  contactType,
  teamRole,
  "position": organigramNode->title,
  "roleCode": organigramNode->roleCode,
  "members": organigramNode->members[]->{
    "id": _id,
    "name": firstName + " " + lastName,
    email, phone
  },
  "nodeId": organigramNode->_id,
  "role": role,
  "email": email,
  "phone": phone,
  "department": department,
},
```

Replace the `steps[].contact` projection (lines 32-42) with the same pattern.

**Step 6: Run tests to verify they pass**

```bash
cd apps/web && pnpm vitest run src/lib/repositories/responsibility.repository.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add apps/web/src/types/responsibility.ts apps/web/src/lib/repositories/responsibility.repository.ts apps/web/src/lib/repositories/responsibility.repository.test.ts
git commit -m "feat(web): update responsibility GROQ query for organigramNode contacts

Contact type now resolves through organigramNode reference instead of
staffMember. Supports position, team-role, and manual contact types.

Refs #1207"
```

---

### Task 5: Update staff repository reverse query — write failing tests first

**Files:**
- Modify: `apps/web/src/lib/repositories/staff.repository.test.ts:375-448`
- Modify: `apps/web/src/lib/repositories/staff.repository.ts:55`

The reverse query on line 55 currently checks `primaryContact.staffMember._ref == ^._id`. With organigramNode-based contacts, a staff member is linked to a responsibility **through** an organigramNode's `members[]` array. The new query must:

1. Find all organigramNodes where this staff member is a member
2. Find all responsibilities where primaryContact or step contact references one of those nodes

**Step 1: Update tests** (`staff.repository.test.ts`)

Update the responsibility paths test assertions. The mock data should reflect the new query shape — responsibility paths still return `{ title, slug, category, icon }` so the **output shape is unchanged**, but the **mock Sanity response** may need adjusting depending on how the test mocks work.

Read the existing test carefully — if it mocks the full Sanity `fetch` response, the GROQ change is transparent to the test. If it asserts specific GROQ strings, update those.

**Step 2: Run tests to see current state**

```bash
cd apps/web && pnpm vitest run src/lib/repositories/staff.repository.test.ts
```

**Step 3: Update the reverse GROQ query** (line 55)

Replace:
```groq
primaryContact.staffMember._ref == ^._id || ^._id in steps[].contact.staffMember._ref
```

With:
```groq
primaryContact.organigramNode._ref in *[_type == "organigramNode" && ^.^._id in members[]._ref]._id
||
steps[].contact.organigramNode._ref in *[_type == "organigramNode" && ^.^._id in members[]._ref]._id
```

Note: This is a more complex GROQ subquery. If performance is a concern, an alternative approach is to first resolve the staff member's organigramNode IDs, then filter. However, since this runs at page-load time for a single staff member with ~37 total organigramNodes, the subquery approach is fine.

**Step 4: Run tests**

```bash
cd apps/web && pnpm vitest run src/lib/repositories/staff.repository.test.ts
```

**Step 5: Commit**

```bash
git add apps/web/src/lib/repositories/staff.repository.ts apps/web/src/lib/repositories/staff.repository.test.ts
git commit -m "feat(web): update staff→responsibility reverse query for organigramNode

Staff detail page now resolves linked responsibilities through
organigramNode members instead of direct staffMember refs.

Refs #1207"
```

---

### Task 6: Update PSD sync protection query

**Files:**
- Modify: `apps/api/src/sanity/projection.ts:148-156`
- Create or modify: `apps/api/src/sanity/projection.test.ts` (add test for getProtectedStaffPsdIds if none exists)

**Step 1: Write a test for getProtectedStaffPsdIds**

Check the test file first — the exploration found no dedicated test. Write one that verifies the GROQ string includes organigramNode-based checks.

Alternatively, if this function returns a GROQ string (not executing it), test the string content. If it executes a query, mock the Sanity client.

**Step 2: Run test to verify it fails**

```bash
cd apps/api && pnpm vitest run src/sanity/projection.test.ts
```

**Step 3: Update the GROQ subquery** (lines 148-156)

The organigramNode check (line 150) stays the same. Replace the responsibility checks (lines 152, 154):

Before:
```groq
_id in *[_type == "responsibility" && active == true].primaryContact.staffMember._ref
||
_id in *[_type == "responsibility" && active == true].steps[].contact.staffMember._ref
```

After — dereference through organigramNode → members:
```groq
_id in *[_type == "responsibility" && active == true].primaryContact.organigramNode->members[]._ref
||
_id in *[_type == "responsibility" && active == true].steps[].contact.organigramNode->members[]._ref
```

This works because GROQ `->` dereferences inline and `members[]._ref` gives us the staffMember IDs.

**Step 4: Run test**

```bash
cd apps/api && pnpm vitest run src/sanity/projection.test.ts
```

**Step 5: Run full API checks**

```bash
pnpm --filter @kcvv/api check-all
```

**Step 6: Commit**

```bash
git add apps/api/src/sanity/projection.ts apps/api/src/sanity/projection.test.ts
git commit -m "fix(api): update PSD sync protection for organigramNode contacts

Protection query now resolves responsibility contacts through
organigramNode→members instead of direct staffMember refs.

Refs #1207"
```

---

### Task 7: Update frontend Contact component rendering

**Files:**
- Modify: the component(s) that render Contact cards in the responsibility finder

Before starting, find the exact component files:

```bash
grep -rn "memberId\|primaryContact\|contact\.name\|contact\.email" apps/web/src/components/ --include="*.tsx" | head -20
```

**Step 1: Identify all Contact rendering locations**

Search for how Contact is currently rendered. Key patterns to find:
- `contact.name` → becomes `contact.members?.[0]?.name` or iterate `members[]`
- `contact.memberId` → becomes `contact.nodeId`
- `contact.role` → becomes `contact.position` (for position type) or `contact.role` (for manual type)
- `mailto:${contact.email}` → for position type, use `contact.members?.[0]?.email`
- `tel:${contact.phone}` → same pattern

**Step 2: Update rendering to switch on contactType**

```typescript
function renderContact(contact: Contact) {
  switch (contact.contactType) {
    case 'position':
      // Title from contact.position
      // List contact.members[] with name/email/phone
      // "Bekijk in organigram" link using contact.nodeId
      break
    case 'team-role':
      // Placeholder: "Trainer van je ploeg" or "Afgevaardigde van je ploeg"
      // #1220 will add team selection + runtime resolution
      break
    case 'manual':
      // Title from contact.role
      // Inline contact.email / contact.phone
      break
  }
}
```

**Step 3: Handle multi-member positions**

For `contactType === 'position'` with `members.length > 1` (e.g., Kledij):
- Show position title as header
- List each member on a separate line with their name + contact info

**Step 4: Run the web check-all**

```bash
pnpm --filter @kcvv/web check-all
```

**Step 5: Commit**

```bash
git add apps/web/src/components/
git commit -m "feat(ui): update contact rendering for organigramNode-based contacts

Contact cards now render position title + member list for organigram
positions, placeholder for team-role (resolved in #1220), and inline
fields for manual contacts. Multi-member positions show all members.

Refs #1207"
```

---

### Task 8: Create Gerechtelijk Correspondent organigramNode

**Files:**
- Create: `scripts/responsibility-seeding/package.json`
- Create: `scripts/responsibility-seeding/tsconfig.json`
- Create: `scripts/responsibility-seeding/src/sanity-client.ts` (copy from `scripts/staff-cleanup/src/sanity-client.ts`)
- Create: `scripts/responsibility-seeding/src/create-gc-node.ts`

**Step 1: Scaffold the script package**

Copy `scripts/staff-cleanup/package.json` and `tsconfig.json`, update the name. Copy `sanity-client.ts` as-is.

**Step 2: Write the GC node creation script**

```typescript
import { client } from "./sanity-client";

const gcNode = {
  _id: "organigramNode-gerechtelijk-correspondent",
  _type: "organigramNode",
  title: "Gerechtelijk Correspondent",
  department: "hoofdbestuur",
  parentNode: { _type: "reference", _ref: "organigramNode-voorzitter", _weak: true },
  members: [{ _type: "reference", _ref: "staffMember-psd-245", _key: "staffMemberpsd245" }],
  active: true,
  sortOrder: 95,
  roleCode: "GC",
};

async function main() {
  const dataset = process.env.SANITY_DATASET;
  if (!dataset) throw new Error("SANITY_DATASET required");
  if (dataset === "production" && process.env.CONFIRM_PRODUCTION_SEED !== "yes") {
    throw new Error("Set CONFIRM_PRODUCTION_SEED=yes for production");
  }
  console.log(`Creating GC node in dataset: ${dataset}`);
  await client.createIfNotExists(gcNode);
  console.log("Done — organigramNode-gerechtelijk-correspondent created");
}

main().catch(console.error);
```

**Step 3: Run on staging**

```bash
cd scripts/responsibility-seeding
SANITY_DATASET=staging SANITY_API_TOKEN=$SANITY_TOKEN tsx src/create-gc-node.ts
```

**Step 4: Verify in Sanity Studio** — check the node appears under Voorzitter in Organigram beheer → Hoofdbestuur.

**Step 5: Run on production**

```bash
CONFIRM_PRODUCTION_SEED=yes SANITY_DATASET=production SANITY_API_TOKEN=$SANITY_TOKEN tsx src/create-gc-node.ts
```

**Step 6: Commit**

```bash
git add scripts/responsibility-seeding/
git commit -m "data(schema): create Gerechtelijk Correspondent organigramNode

Club-wide role under Voorzitter for sports accident reporting.
Kevin Van Ransbeeck (staffMember-psd-245) assigned.

Refs #1207"
```

---

### Task 9: Write the responsibility seeding script

**Files:**
- Create: `scripts/responsibility-seeding/src/seed-responsibilities.ts`

**Step 1: Define the responsibility data array**

Create the full array of ~28 responsibility documents. Each document has:
- `_id`: `responsibility-{slug}`
- `_type`: `responsibility`
- `title`: Short display title
- `slug`: `{ _type: "slug", current: "{slug}" }`
- `active`: `true`
- `audience`: array of role strings
- `question`: lowercase, conversational
- `keywords`: array of search synonyms (be generous — these feed Vectorize)
- `summary`: 1-2 sentences
- `category`: one of the 6 categories
- `icon`: Lucide icon name
- `primaryContact`: `{ contactType: "position", organigramNode: { _type: "reference", _ref: "organigramNode-..." } }` or manual variant
- `steps`: array of solution steps with optional contact overrides

Use the complete question list from the design doc (`docs/plans/2026-04-03-responsibility-seeding-design.md`, "Complete question list" section).

**Important — keywords**: Be generous. Each question should have 5-15 keywords including:
- Dutch synonyms and common misspellings
- Related concepts (e.g., "transfer" → ["overstap", "transfer", "aansluiting", "andere club", "wissel", "overschrijving"])
- The question text words themselves

**Important — steps**: Most questions have 1-2 steps. For FC-N1 (opmerking over trainer), create 5 steps:
1. JC Onderbouw (organigramNode ref)
2. JC Middenbouw (organigramNode ref)
3. JC Bovenbouw (organigramNode ref)
4. Jeugdvoorzitter (organigramNode ref)
5. TVJO (organigramNode ref)

For FC-S5 (sportongeval senioren): single step → GC directly.

For BP-AL5 (klacht indienen): step 1 = Secretaris, step 2 = API (if gedragsgerelateerd).

**Step 2: Write preflight validation**

Before mutating, verify:
- All referenced organigramNode IDs exist in the dataset
- No duplicate `_id` values
- All required fields present

**Step 3: Write the seeding logic**

```typescript
for (const doc of responsibilities) {
  await client.createIfNotExists(doc);
  // Patch to upsert — createIfNotExists won't update existing docs
  await client.patch(doc._id).set(omit(doc, ["_id", "_type"])).commit();
  console.log(`✓ ${doc._id}`);
}
```

**Step 4: Commit the script (don't run yet)**

```bash
git add scripts/responsibility-seeding/src/seed-responsibilities.ts
git commit -m "feat(schema): responsibility seeding script — 28 static questions

Maps all static flows from Contactpersonen Jeugdwerking flow chart
and brainstorm plan to organigramNode-based responsibility documents.

Refs #1207"
```

---

### Task 10: Quality gate

**Step 1: Run all checks**

```bash
pnpm --filter @kcvv/web check-all
pnpm --filter @kcvv/api check-all
pnpm --filter @kcvv/studio check-all
pnpm --filter @kcvv/studio-staging check-all
pnpm --filter @kcvv/sanity-schemas check-all
```

**Step 2: Fix any issues**

**Step 3: Commit fixes if needed**

---

### Task 11: Run seeding on staging

**Step 1: Run the seed script on staging**

```bash
cd scripts/responsibility-seeding
SANITY_DATASET=staging SANITY_API_TOKEN=$SANITY_TOKEN tsx src/seed-responsibilities.ts
```

**Step 2: Verify in Sanity Studio (staging)**

- Check all ~28 documents appear in Verantwoordelijkheden desk structure
- Check category grouping works
- Check each document's primaryContact shows the correct organigram position in preview
- Check "Zonder contactpersoon" filter is empty (all docs have contacts)

**Step 3: Verify on web (staging/local dev)**

- Navigate to `/hulp` — responsibility finder should show the seeded questions
- Test search: type "kledij" → should find the kledij question
- Test a result card: click a question → should show contact with position title + member names
- Test organigram link: "Bekijk in organigram" should deep-link correctly
- Test staff detail page: navigate to a staff member in an organigram position → "Verantwoordelijkheden" section should show linked responsibilities

---

### Task 12: Run seeding on production

**Step 1: Run on production**

```bash
CONFIRM_PRODUCTION_SEED=yes SANITY_DATASET=production SANITY_API_TOKEN=$SANITY_TOKEN tsx src/seed-responsibilities.ts
```

**Step 2: Spot-check in Sanity Studio (production)**

**Step 3: Commit any adjustments**

---

### Task 13: Update CLAUDE.md if needed

Check if the architecture section in `.claude/CLAUDE.md` needs updating for:
- The new `contactType` discriminator pattern on responsibility schema
- The `scripts/responsibility-seeding/` directory

---

### Task 14: Final quality gate and PR

**Step 1: Run full quality gate**

```bash
pnpm --filter @kcvv/web check-all
pnpm turbo build --filter=@kcvv/web
```

**Step 2: Push and create PR**

```bash
git push -u origin feat/issue-1207
gh pr create \
  --title "feat(schema): seed responsibility finder questions (#1207)" \
  --body "$(cat <<'EOF'
Closes #1207

## Changes

- **Schema**: Replace `staffMember` contact refs with `contactType` discriminator (position/team-role/manual) + `organigramNode` reference
- **Data**: Create Gerechtelijk Correspondent organigramNode (club-wide, under Voorzitter)
- **Data**: Seed ~28 static responsibility documents from Contactpersonen Jeugdwerking flow chart
- **GROQ**: Update responsibility, staff, and PSD sync protection queries for organigramNode dereferencing
- **Frontend**: Update Contact rendering for position (multi-member), team-role (placeholder for #1220), and manual types
- **Preview**: Responsibility subtitle shows organigram position title

## Prepares for

- #1220 (dynamic team-level routing) — schema supports `team-role` contactType, frontend shows placeholder

## Testing

- All `check-all` commands pass (web, api, studio, studio-staging, sanity-schemas)
- Seeded on staging, verified in Studio + web
- Seeded on production
- Responsibility finder renders contact cards correctly
- Staff detail pages show linked responsibilities
- PSD sync does not archive staff in active organigram/responsibility positions

EOF
)" \
  --label "ready-for-review"
```
