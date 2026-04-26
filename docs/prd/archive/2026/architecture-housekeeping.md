# PRD: Architecture Housekeeping — Dead Schema + Domain Rework

**Status**: Ready for implementation
**Date**: 2026-04-02
**Issues**: #1193

---

## 1. Problem Statement

Two housekeeping items discovered during architecture review:

**Dead schema file**: `packages/sanity-schemas/src/responsibilityPath.ts` (206 lines) is a byte-for-byte duplicate of `responsibility.ts`, left over from the ubiquitous language rename milestone. The barrel file (`index.ts`) does not export it — it's dead code. GROQ queries in `apps/web` already use `_type == "responsibility"`. The file's existence is confusing and creates a maintenance trap (someone might edit it thinking it matters).

**BFF domain rework**: Issue #1083 plans `bff.kcvvelewijt.be` as the Worker custom domain, but the `footbalisto.be` domain is owned, unused, memorable, and dedicated to this purpose. Rework #1083 to use `footbalisto.be` instead.

## 2. Scope

**Packages touched**: `packages/sanity-schemas` (schema cleanup), `apps/api` + `apps/web` (domain rework)

**In scope**:

- Delete `packages/sanity-schemas/src/responsibilityPath.ts`
- Verify no imports reference it (barrel already doesn't export it)
- Update #1083 body to reference `footbalisto.be` instead of `bff.kcvvelewijt.be`

**Out of scope**:

- Migrating existing Sanity documents from `_type: "responsibilityPath"` to `_type: "responsibility"` (if any exist in the dataset — check during implementation, but this was likely handled during the ubiquitous language milestone)
- DNS migration itself (that's #1083 execution, not this PRD)

## 3. Tracer Bullet

Delete `responsibilityPath.ts` and verify the build:

- `rm packages/sanity-schemas/src/responsibilityPath.ts`
- Confirm barrel `index.ts` has no import of it (already verified: it doesn't)
- `pnpm --filter @kcvv/sanity-schemas check-all` passes (or equivalent)
- `pnpm --filter @kcvv/web check-all` passes

## 4. Phases

```text
Phase 1: Delete dead responsibilityPath.ts schema
Phase 2: Rework #1083 for footbalisto.be domain
```

## 5. Acceptance Criteria per Phase

### Phase 1: Delete dead schema

- [ ] `packages/sanity-schemas/src/responsibilityPath.ts` deleted
- [ ] Grep confirms zero imports of `responsibilityPath` from `@kcvv/sanity-schemas` in any app
- [ ] Both studios build successfully
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2: Rework #1083

- [ ] Issue #1083 body updated: `bff.kcvvelewijt.be` → `footbalisto.be` throughout
- [ ] Issue #1083 title updated to reflect `footbalisto.be`
- [ ] Acceptance criteria in #1083 updated (curl endpoints, Vercel env var, Sanity webhook URL)
- [ ] Note added: `bff.kcvvelewijt.be` is no longer planned; `footbalisto.be` is the production domain

## 6. Effect Schema / api-contract Changes

None.

## 7. Open Questions

- [ ] Are there existing Sanity documents with `_type: "responsibilityPath"` in production/staging datasets? — Check via Sanity Vision query before deleting schema. If yes, migrate them or confirm they're unused.
- [ ] Does `footbalisto.be` DNS need to be migrated to Cloudflare separately from `kcvvelewijt.be`? — Check current registrar/DNS. May require separate Cloudflare zone setup.

## 8. Discovered Unknowns

_(filled during implementation)_
