# PRD: Organigram — Role-Centric Node Schema

**Date:** 2026-03-28
**Status:** Draft

---

## 1. Problem statement

The current organigram embeds hierarchy directly on each `staffMember` document: one `role`, one `parentMember`, one `roleLabel`. This breaks two real-world club scenarios: a person holding multiple roles (e.g. the Voorzitter who also acts as Sportief Verantwoordelijke) can only appear at one position in the hierarchy; and a role shared by two people (e.g. two co-Penningmeesters) has no way to model that both people share the same position node. The organigram also cannot represent vacant positions — if no one is assigned, the role simply disappears. The result is a chart that forces a 1-to-1 person-to-node mapping that does not reflect how the club actually organises itself.

---

## 2. Scope

**Packages touched:**

- `packages/sanity-schemas` — new `organigramNode` document type; remove organigram fields from `staffMember`
- `apps/web` — updated `OrgChartNode` type, GROQ queries, repository, NodeRenderer, ContactOverlay, MemberDetailsModal, staff detail page (`/staf/[slug]`)
- `apps/studio` / `apps/studio-staging` — consume updated schemas automatically; optional structure builder addition

**Out of scope:**

- Sanity data migration (no production organigram data exists)
- PSD sync changes — `staffMember.psdId` and sync logic are untouched
- Responsibility (`/hulp`) flow itself — only the reverse lookup on the staff detail page is added
- Public staff listing page (not planned)
- Studio structure builder reverse reference tabs (nice-to-have, separate issue if wanted)

---

## 3. Tracer bullet

A single `organigramNode` document created manually in Studio (title: "Voorzitter", one linked `staffMember`) is fetched via the updated GROQ query and rendered in the live organigram chart at `/club/organigram` — node shows the person's name and photo. No vacant-node styling, no shared-node styling, no staff detail page changes. Proves the schema, query, type, and repository chain end-to-end.

---

## 4. Phases

```
Phase 1: Tracer bullet — organigramNode schema + OrgChartNode type + GROQ query (#1115)
Phase 2: Full renderer — vacant and shared node states + ContactOverlay/MemberDetailsModal (#1116)
Phase 3: staffMember cleanup — remove organigram fields, regenerate sanity.types (#1117)
Phase 4: Staff detail page — organigram positions + responsibility path reverse lookups (#1118)
Phase 5: Analytics — update hashMemberId usage for new node/member ID model (#1119)
```

---

## 5. Acceptance criteria per phase

### Phase 1 — Tracer bullet

- [ ] `organigramNode` schema exists in `packages/sanity-schemas/src/organigramNode.ts` and is exported from the barrel
- [ ] Schema fields: `title` (required), `description`, `roleCode` (max 6), `department` (enum), `parentNode` (weak ref), `members` (array of refs to staffMember), `active` (boolean, default true)
- [ ] `STAFF_MEMBERS_QUERY` replaced by `ORGANIGRAM_NODES_QUERY` targeting `organigramNode`; GROQ dereferences `members[]->{ _id, firstName, lastName, imageUrl, email, phone, psdId }`
- [ ] `OrgChartNode` type updated: flat `name`/`imageUrl`/`email`/`phone`/`responsibilities`/`profileUrl` replaced by `members: Array<{ id, name, imageUrl?, email?, phone?, href? }>` and `description?`
- [ ] `toOrgChartNode` in `staff.repository.ts` maps from new query result shape
- [ ] One manually-created `organigramNode` in Studio renders correctly in the chart (manual check)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Full renderer

- [ ] `NodeRenderer` handles 3 states: vacant (`members.length === 0`), single (`=== 1`), shared (`>= 2`)
- [ ] Vacant node: position title + muted description text, no photo placeholder
- [ ] Shared node: position title header + stacked photo/name chips (one per member)
- [ ] `MemberDetailsModal` / `ContactOverlay`: position title prominent; one contact block per member with link to `/staf/{psdId}`; vacant nodes show description only
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] Storybook stories updated for all 3 node states

### Phase 3 — staffMember cleanup

- [ ] Remove from `staffMember` schema: `role`, `parentMember`, `roleLabel`, `roleCode`, `inOrganigram`, `department`, `responsibilities`
- [ ] `sanity.types.ts` regenerated; no TypeScript errors in `apps/web`
- [ ] `ROLE_DISPLAY` / `DEPARTMENT_DISPLAY` maps in `staff.repository.ts` removed or updated
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 — Staff detail page

- [ ] Depends on `feat/issue-914` merged to main
- [ ] `StaffRepository.findByPsdId` GROQ query includes two reverse lookups: `organigramPositions` and `responsibilityPaths`
- [ ] `StaffDetailVM` replaces `roleDisplay`/`roleLabel`/`departmentDisplay` with `organigramPositions: Array<{ title, roleCode?, department? }>` and `responsibilityPaths: Array<{ title, slug, category?, icon? }>`
- [ ] `/staf/[slug]` page renders both sections; responsibility path cards link to `/hulp?pad=<slug>`
- [ ] Staff member with no organigram position: section hidden (not rendered empty)
- [ ] Staff member with no responsibility paths: section hidden
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 5 — Analytics

- [ ] `hashMemberId` calls in organigram analytics hooks updated: use `members[0].id` for single/shared nodes; omit member identifier for vacant nodes
- [ ] Analytics events that previously used `node.id` (organigramNode.\_id) vs. `staffMember._id` are consistent and documented
- [ ] No raw internal IDs sent to analytics (existing privacy rule)
- [ ] `pnpm --filter @kcvv/web check-all` passes

---

## 6. Effect Schema / api-contract changes

None. The organigram is served directly from Sanity via GROQ — it does not go through the BFF (`apps/api`) or `packages/api-contract`. No new HttpApi endpoints.

---

## 7. Open questions

- `[ ]` **Shared node rendering** — for `members.length >= 2`: should the chart show one card with stacked chips, or two separate sibling nodes that both point to the same parent? _Decided in design session: 1 node._ Implementation detail: how the custom NodeRenderer sizes the card when it contains 3+ members is TBD — answered by tracer bullet rendering.
- `[ ]` **`generateStaticParams` for `/staf/[slug]`** — currently returns only members with a `psdId`. After Phase 3, non-PSD staff members have no organigram or responsibility path exposure issue, but they also have no public page. Confirm: is it acceptable that staff members without `psdId` have no profile page?
- `[ ]` **Studio structure builder tabs** — read-only "Posities" and "Verantwoordelijkheden" reverse-reference tabs on `staffMember` documents. Out of scope for now; raise as a separate issue if wanted.
- `[ ]` **`parentNode` filter in Studio** — should the `parentNode` reference field filter out inactive (`active == false`) nodes? Needs a decision before Phase 1 Studio usage.

---

## 8. Discovered unknowns

_(Filled during implementation)_
