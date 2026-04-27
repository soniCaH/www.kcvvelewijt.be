# PRD: Sanity Studio Editor UX Rework

**Date:** 2026-04-27
**Status:** Draft
**Design doc:** `docs/plans/2026-04-27-sanity-studio-wizards-design.md`
**Milestone:** [sanity-studio-editor-ux-rework](https://github.com/soniCaH/www.kcvvelewijt.be/milestone/39)

---

## 1. Problem statement

Both Sanity studios (`apps/studio`, `apps/studio-staging`) use the default form layouts for every document type. Editors face long flat lists of fields, conditional sections that appear/disappear without explanation, no guidance on what each field does, and no discoverable on-ramp for creating new content. Today's sole editor (the project owner) is comfortable but feels the friction; the near-future audience includes volunteers with low Sanity literacy and a mix of power and occasional contributors. Without a rework, every new editor will need hand-holding to know which document type to create, which fields are required, and what the on-site impact of their choices will be — and prefilled "placeholder" content from poorly designed defaults will keep leaking to production.

This rework introduces a launcher Tool, restructured forms (field groups + custom inputs), and in-form guidance that explains itself — turning the studios from "configurable databases" into editor-first authoring tools.

---

## 2. Scope

**Packages touched:**

- `packages/sanity-studio` — new `LauncherTool`, `ContactPicker` input, `GuidedSidebar` document layout wrapper, generic `withPlaceholder` / `sectionIntro` helpers, per-schema guidance and template manifests
- `packages/sanity-schemas` — field `groups`, expanded `description` copy, validation copy that teaches, `components` patches that consume the new helpers (no React added to the package itself; helpers are imported from `@kcvv/sanity-studio`)
- `apps/studio` — wire `launcherTool()`, `templates`, and `withGuidedSidebar(...)` in `sanity.config.ts`
- `apps/studio-staging` — same wiring as above (must stay in sync per dual-environment policy)

**Out of scope:**

- `apps/web`, `apps/api`, `packages/api-contract` — this rework is Studio-only; no public site or BFF changes
- Per-template parameters (e.g. "New interview about player X")
- Server-side persistence of "Recently used" templates (localStorage only in v1)
- Per-user template visibility / role-gated templates
- Card thumbnails / illustrations on the launcher (icon + text only in v1)
- Editorial workflow status (draft/review/published custom states) — Sanity's draft/publish indicator is sufficient
- Telemetry / analytics on editor behavior — measure success via direct conversation with the user
- i18n of launcher copy (Dutch only; matches current studio copy convention)
- Dark-mode theming (inherits Sanity's)
- Editor-facing accessibility audit (assumed adequate via `@sanity/ui` primitives; revisit if a future audit flags issues)
- Sanity AI Assist integration (separate decision; not part of this rework)

---

## 3. Tracer bullet

A single `LauncherTool` registered in `apps/studio` and `apps/studio-staging` with **one** `responsibility-new` Initial Value Template (zero data prefill). Click the card → Sanity's intent system opens a new `responsibility` draft. The form for `responsibility` shows **field groups** (Vraag / Antwoord / Contact / Meta) with at least one expanded `description` per group and one `Rule.required().error(...)` rewritten to teach. No `ContactPicker`, no `GuidedSidebar`, no smart placeholders yet. Proves: launcher Tool registration, IVT wiring, intent navigation, field-group rendering, and the dual-studio sync workflow — end-to-end.

---

## 4. Phases

```text
Phase 1: Tracer bullet — LauncherTool + responsibility groups + 1 IVT (#1499)
Phase 2: Responsibility full slice — ContactPicker, GuidedSidebar, all guidance copy, placeholders, validation copy (#1500)
Phase 3: Article — 4 IVTs by articleType, full guidance + groups + validation copy (#1501)
Phase 4: Generic studio infra hardening — extract any generalization needs surfaced by Phases 1–3, document conventions in CLAUDE.md (#1502)
Phase 5+: Propagation — one issue per remaining doc type
  - player (#1503)
  - team (#1504)
  - staffMember (#1505)
  - sponsor (#1506)
  - event (#1507)
  - page (#1508)
  - banner (#1509)
  - homePage (#1510)
  - jeugdLandingPage (#1511)
```

Each phase is independently shippable. Partial rollout never breaks editing of types not yet touched (per `withGuidedSidebar`'s opt-in map, and IVTs being additive to the default `+ Create` button).

---

## 5. Acceptance criteria per phase

### Phase 1 — Tracer bullet

- [ ] `LauncherTool` lives at `packages/sanity-studio/src/tools/launcher/launcher-tool.tsx` and is exported from the package barrel
- [ ] Tool appears as `✨ Create` tab in top nav of both studios
- [ ] `LauncherTemplate` interface defined in `packages/sanity-studio/src/templates/types.ts` (extends Sanity `Template` + adds required `ui: { icon, description, group }`)
- [ ] `useTemplates()` filters out templates without `ui` and templates with unknown `schemaType`; logs once to console for unknown types
- [ ] Single template `responsibility-new` registered with empty `value: {}` and Dutch description
- [ ] Card click triggers `router.navigateIntent('create', { type: 'responsibility', template: 'responsibility-new' })` and lands the editor in a new draft
- [ ] `responsibility.ts` schema declares `groups: [vraag, antwoord, contact, meta]` (Vraag is `default: true`)
- [ ] All fields assigned to a group per the design doc mapping
- [ ] At least 4 field `description`s expanded to the new convention (1–3 Dutch sentences with example + impact); document which in PR description
- [ ] At least 4 `Rule.required()` calls rewritten with `.error('teaching message')`
- [ ] `apps/studio/sanity.config.ts` and `apps/studio-staging/sanity.config.ts` updated identically — `tools` and `templates` config wired
- [ ] Vitest tests for `useTemplates` and `LauncherCard` (RTL); manual smoke check on local studio against staging dataset
- [ ] `pnpm --filter @kcvv/sanity-studio check-all` and `pnpm --filter @kcvv/studio check-all` pass
- [ ] `packages/sanity-studio/CLAUDE.md` updated with `tools/launcher/` conventions

### Phase 2 — Responsibility full slice

- [ ] `ContactPicker` component at `packages/sanity-studio/src/inputs/contact-picker.tsx` with `applyContactPicker()` helper
- [ ] Picker handles 4 states: empty, position-selected, team-role-selected (with fallback expansion), manual-selected (with inline expansion)
- [ ] Orphan `_ref` renders warning chip with clear-action ✕
- [ ] Picker degrades gracefully to "manual-only" when `organigramNode` fetch fails
- [ ] `applyContactPicker` patch shape stable (regression-tested)
- [ ] Picker wired on `responsibility.primaryContact` AND each `solutionStep.contact` — no schema migration (patch shape unchanged)
- [ ] `GuidedSidebar` at `packages/sanity-studio/src/guided-sidebar/guided-sidebar.tsx` with `withGuidedSidebar(map)` document layout wrapper
- [ ] Sidebar renders required-field checklist driven by `computeRequiredFields()` walking schema validation rules
- [ ] "Why this matters" expanders per group (content from `responsibility-guidance.ts`)
- [ ] Preview link disabled when slug not set; opens `/info/{slug}` in new tab when set
- [ ] Doc types not in `withGuidedSidebar` map render Sanity's default layout (no regression)
- [ ] `withPlaceholder` + `sectionIntro` helpers exported from package barrel
- [ ] All eligible string/text fields on `responsibility` get `withPlaceholder("bijv. ...")`
- [ ] Section-intro fields (`_intro_vraag` etc.) added per group with helper text per design
- [ ] Every required field on `responsibility` has a `.error(...)` teaching message
- [ ] Every field on `responsibility` has a description that meets the 1–3 sentence convention
- [ ] Vitest tests: `contact-picker` (RTL — each branch + orphan + fallback), `guided-sidebar` (RTL — checklist, expanders, preview link), `compute-required-fields` (unit), `responsibility-guidance` (unit — previewUrl)
- [ ] Manual smoke: create new responsibility via launcher → fill all fields via picker → publish → view on staging site
- [ ] `pnpm --filter @kcvv/sanity-studio check-all` and `pnpm --filter @kcvv/studio check-all` pass

### Phase 3 — Article

- [ ] `article-templates.ts` exports 4 templates: `article-interview` / `article-announcement` / `article-transfer` / `article-event`
- [ ] Each template seeds **only** `articleType` (no other defaults; per D6 — no editorial-content prefill)
- [ ] All 4 cards appear in the launcher under "Articles" group with teaching descriptions
- [ ] `article.ts` schema declares groups (proposed: `type` / `inhoud` / `publicatie` / `gerelateerd`) — finalize during implementation
- [ ] Every field on `article` assigned to a group; every required field gets `.error(...)` teaching message; every field has the 1–3 sentence description
- [ ] `article-guidance.ts` registered via `withGuidedSidebar` map
- [ ] All eligible fields get `withPlaceholder` examples
- [ ] Section-intro fields per group
- [ ] Vitest: `article-templates` decode test; `article-guidance` previewUrl test
- [ ] Manual smoke: create one of each article type via launcher → publish → view on staging
- [ ] If `LauncherTool` / `GuidedSidebar` need generalization based on Phase 2 learnings, do it here (track changes in PR)
- [ ] `pnpm --filter @kcvv/sanity-studio check-all` and `pnpm --filter @kcvv/studio check-all` pass

### Phase 4 — Infra hardening + convention docs

- [ ] Any generalization debt accumulated in Phases 1–3 retired (refactors, naming sweeps, `apply-*` helper consistency)
- [ ] `packages/sanity-studio/CLAUDE.md` documents the full convention: how to add a template, a guidance file, a custom input, a placeholder, a section intro
- [ ] `packages/sanity-schemas/CLAUDE.md` documents the new field-description / validation-copy conventions
- [ ] Add a one-page "How to add a new doc type to the rework" checklist to `packages/sanity-studio/CLAUDE.md` for use by Phase 5+ issues
- [ ] `pnpm --filter @kcvv/sanity-studio check-all` and `pnpm --filter @kcvv/studio check-all` pass

### Phase 5+ — Propagation (one issue per doc type)

For each of `player`, `team`, `staffMember`, `sponsor`, `event`, `page`, `banner`, `homePage`, `jeugdLandingPage`:

- [ ] Field groups defined per the doc type's natural sections
- [ ] Every field gets a description meeting the new convention
- [ ] Every required field has a teaching `.error(...)` message
- [ ] Eligible string/text fields get `withPlaceholder`
- [ ] Section-intro fields per group
- [ ] `<docType>-guidance.ts` added and registered in both `sanity.config.ts` files
- [ ] If the doc type has a launcher card it earns (i.e. has shape variation worth seeding), add to templates manifest
- [ ] Manual smoke + `check-all` pass

---

## 6. Effect Schema / api-contract changes

**None.** This rework is purely Studio-side (UI + schema config + descriptions). No `apps/web`, `apps/api`, or `packages/api-contract` changes. Existing public-site data shapes are untouched. The `ContactPicker` deliberately writes back the same shape as today's `contactFields`, so no Sanity data migration is required.

---

## 7. Open questions

- [ ] **Phase 1 PR shape — single PR or split?** The design doc flags this. Default is single PR per the C-sequencing decision. Reconsider during planning if Phase 2 looks too large to review in one chunk.
- [ ] **Article field groups — final naming?** Proposal: `type` / `inhoud` / `publicatie` / `gerelateerd`. Finalize during Phase 3 implementation, not before.
- [ ] **`section-intro` mechanism — fake field or fully custom layout?** Design picks fake field for v1 because it's the cheapest route. If it visibly clutters the form (extra spacing, error counts, etc.), re-evaluate during Phase 1 — possibly switch to a `fieldset` with rich `description` markdown, or a fully custom form layout.
- [ ] **Sanity `placeholder` API path — is `components.field` wrapper actually needed, or is there a built-in option?** Confirm during Phase 1 implementation. If Sanity v5.22 already exposes a `placeholder` field option, drop the custom wrapper.
- [ ] **`computeRequiredFields` and conditional `hidden:` fields** — the checklist should NOT count fields whose `hidden:` evaluates true for the current document. Edge case to confirm during Phase 2.
- [ ] **`responsibility-new` card vs. dropping it** — design keeps one zero-prefill card. If the launcher feels cluttered with single-template doc types, drop and let editors use Sanity's default `+ Create` for those. Decide after Phase 2 ships and a real editor has used it.
- [ ] **Future Sanity AI Assist integration** — out of scope for this PRD, but flagged so a separate PRD can pick it up if/when adopted.

---

## 8. Discovered unknowns

(Filled during implementation. Format: `- [date] Discovered: [what] → [action]`)
