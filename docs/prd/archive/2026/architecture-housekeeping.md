---
status: completed
completed_at: 2026-04-02
completed_in: "#1193"
---

# PRD: Architecture Housekeeping — Dead Schema + Domain Rework

**Status**: Completed
**Date**: 2026-04-02
**Issues**: #1193

---

## 1. Problem Statement

Two housekeeping items discovered during architecture review:

**Dead schema file (originally identified)**: The PRD originally described
`packages/sanity-schemas/src/responsibilityPath.ts` as a 206-line duplicate of
`responsibility.ts`. **Verification (2026-04-26)**: This file does not exist in
the repo — it was either removed before this PRD was implemented, or was removed
as part of the ubiquitous language rename milestone without this PRD being closed.
The barrel `index.ts` exports `responsibility` (not `responsibilityPath`), and
all GROQ queries in `apps/web` use `_type == "responsibility"`. Phase 1 is
therefore already complete with no action required.

**BFF domain rework**: Issue #1083 plans `bff.kcvvelewijt.be` as the Worker
custom domain, but the `footbalisto.be` domain is owned, unused, memorable, and
dedicated to this purpose. Rework #1083 to use `footbalisto.be` instead.

## 2. Verification Results (2026-04-26)

- `packages/sanity-schemas/src/responsibilityPath.ts` — **does not exist**
- `packages/sanity-schemas/src/responsibility.ts` — **exists** ✅
- `packages/sanity-schemas/src/index.ts` — exports `responsibility`, no reference to `responsibilityPath` ✅
- `apps/web` GROQ queries — all use `_type == "responsibility"` ✅
- No imports of `responsibilityPath` found anywhere in the codebase ✅

Phase 1 was already complete before this PRD was picked up.

## 3. Scope

**Packages touched**: `apps/api` + `apps/web` (domain rework only — schema cleanup was already done)

**Phase 1 status**: ✅ Already completed (file was absent; no deletion needed)

**Phase 2 in scope**:

- Update #1083 body to reference `footbalisto.be` instead of `bff.kcvvelewijt.be`

**Out of scope**:

- Migrating existing Sanity documents from `_type: "responsibilityPath"` to
  `_type: "responsibility"` — GROQ queries already use `_type == "responsibility"`;
  the rename milestone handled any document migration.
- DNS migration itself (that's #1083 execution, not this PRD)

## 4. Phases

```text
Phase 1: Delete dead responsibilityPath.ts schema — ALREADY COMPLETED (file absent)
Phase 2: Rework #1083 for footbalisto.be domain
```

## 5. Acceptance Criteria per Phase

### Phase 1: Delete dead schema — ✅ Already completed

- ✅ `packages/sanity-schemas/src/responsibilityPath.ts` absent (was never present or already removed)
- ✅ Grep confirms zero imports of `responsibilityPath` from `@kcvv/sanity-schemas` in any app
- ✅ `packages/sanity-schemas/src/index.ts` barrel exports `responsibility` only
- ✅ All GROQ queries use `_type == "responsibility"`

### Phase 2: Rework #1083

- [ ] Issue #1083 body updated: `bff.kcvvelewijt.be` → `footbalisto.be` throughout
- [ ] Issue #1083 title updated to reflect `footbalisto.be`
- [ ] Acceptance criteria in #1083 updated (curl endpoints, Vercel env var, Sanity webhook URL)
- [ ] Note added: `bff.kcvvelewijt.be` is no longer planned; `footbalisto.be` is the production domain

## 6. Effect Schema / api-contract Changes

None.

## 7. Open Questions

- [ ] Does `footbalisto.be` DNS need to be migrated to Cloudflare separately from `kcvvelewijt.be`? — Check current registrar/DNS. May require separate Cloudflare zone setup.

## 8. Discovered Unknowns

- `responsibilityPath.ts` was absent at implementation time. The barrel file never referenced it, and all queries were already using `_type == "responsibility"`. The rename was completed in an earlier milestone without updating this PRD.
