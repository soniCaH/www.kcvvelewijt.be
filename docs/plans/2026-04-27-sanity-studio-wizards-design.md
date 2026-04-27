# Sanity Studio Editor UX Rework — Design

**Date:** 2026-04-27
**Status:** Approved (brainstorming complete, awaiting implementation plan)
**Initiative:** [Sanity Studio UX rework](../../packages/sanity-studio/CLAUDE.md) — full editor-focused rework of `apps/studio` and `apps/studio-staging`.

## Problem

Both Sanity studios use the default form layouts for every document type. Editors face long flat lists of fields, conditional sections that appear/disappear without explanation, and no guidance on what each field does or what's required. The current editor (one person — the project owner) is comfortable but feels the friction; near-future editors will include volunteers with low Sanity literacy and a mix of power/occasional contributors.

The goal is to make the editor experience genuinely _not lame_: discoverable creation flows, clearly grouped forms, smart inputs for gnarly nested objects, and in-form guidance that explains the impact of each field.

## Approach

A **launcher Tool + improved form** model (chosen from three options during brainstorming):

1. A new top-nav **`✨ Create` Tool** in the Studio renders a card grid grouped by document type. Each card teaches the editor when and why to pick this kind of document.
2. Cards trigger Sanity's native Initial Value Templates. **Templates only seed fields that change the form shape** (e.g. `articleType`) — never editorial defaults the editor must override. The launcher card copy itself is the teaching moment.
3. Document forms are restructured: **field groups** (tabs), **rich descriptions**, **smart placeholders**, **validation copy that teaches**, **section-level helper text**, and a docked **`<GuidedSidebar>`** showing required-field progress + "why this matters" expanders + a preview link.
4. **Custom inputs** replace the worst nested-object form areas. First instance: `<ContactPicker>` swallows the `contactType` radio + 8 conditional fields on `responsibility`'s contact objects, replacing them with a single search-driven picker.

Tracer-bullet through `responsibility` (Phase 1), then `article` (Phase 2), then propagate (Phase 3+). All shared infrastructure (`LauncherTool`, `GuidedSidebar`, `ContactPicker`, helper wrappers) is extracted as standalone modules in `packages/sanity-studio/` from day one so Phase 2's article work proves the abstractions before we declare them done.

## Decisions log (from brainstorming)

| #   | Decision                                                                                                     | Rationale                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| D1  | Full rework, articles + responsibility first, every doc type eventually                                      | User priority                                                                               |
| D2  | Design for current editor (one power user) but architect for future volunteer + mixed-skill audiences        | Prefill + modal-only flows would optimize for the wrong audience                            |
| D3  | Launcher (IVTs) + improved form, **not** multi-step modal                                                    | Newcomer on-ramp without trapping power users in modals                                     |
| D4  | Tracer-bullet on `responsibility` with launcher + ContactPicker extracted as standalone modules from day one | Real UX in Phase 1; abstractions tested by Phase 2's `article` consumer                     |
| D5  | Approach 1 — Custom Tool launcher in top nav (vs structure-node or +Create-button override)                  | Total UI control; clean module boundary; ceiling on editor-experience quality               |
| D6  | **Templates seed only structural shape variations** (no editorial defaults)                                  | Defaults editors have to override are an anti-pattern; investment moves to in-form guidance |
| D7  | Add `<GuidedSidebar>` as a v1 deliverable                                                                    | Highest-leverage guidance affordance                                                        |
| D8  | Section helper text via fake leading field with `components.field` renderer                                  | Most flexible mechanism without writing a fully custom form layout                          |
| D9  | Guidance content (`<schema>-guidance.ts`) lives in `packages/sanity-studio/`                                 | UI concern, not schema concern; keeps `packages/sanity-schemas` React-free                  |
| D10 | Telemetry-free in v1                                                                                         | Measure success via screen-share with the user after each phase                             |

## Architecture & module layout

All new code lives under `packages/sanity-studio/src/` (ships to both studios automatically). Schema edits land in `packages/sanity-schemas/src/`.

```text
packages/sanity-studio/src/
├── tools/
│   └── launcher/
│       ├── launcher-tool.tsx          ← createTool() registration + root component
│       ├── launcher-grid.tsx          ← card grid UI (search, group-by-doctype)
│       ├── launcher-card.tsx          ← single template card
│       ├── use-templates.ts           ← reads registered IVTs, filters to ones with `ui` extension
│       ├── use-recents.ts             ← localStorage-backed recents (per-user)
│       └── *.test.tsx
├── inputs/
│   ├── contact-picker.tsx             ← replaces primaryContact + step.contact UX
│   ├── apply-contact-picker.ts        ← components.input registration helper
│   ├── placeholder-field.tsx          ← generic placeholder wrapper
│   ├── apply-placeholder.ts           ← withPlaceholder('bijv. ...') helper
│   ├── section-intro.tsx              ← renderless "field" producing a section-header block
│   ├── apply-section-intro.ts         ← sectionIntro('text') helper
│   └── *.test.tsx
├── guided-sidebar/
│   ├── guided-sidebar.tsx             ← right-docked panel (checklist + why + preview link)
│   ├── with-guided-sidebar.tsx        ← document layout wrapper, per-doc-type opt-in
│   ├── compute-required-fields.ts     ← walks schema validation rules
│   └── *.test.tsx
├── guidance/
│   ├── responsibility-guidance.ts     ← Dutch copy + previewUrl resolver
│   ├── article-guidance.ts            ← Phase 2
│   └── types.ts                       ← SchemaGuidance interface
├── templates/
│   ├── responsibility-templates.ts    ← 1 template, no prefill
│   ├── article-templates.ts           ← Phase 2 — 4 templates, only articleType seeded
│   ├── types.ts                       ← LauncherTemplate (extends Sanity Template + ui object)
│   └── index.ts                       ← barrel
└── index.ts                           ← package barrel: tool, inputs, sidebar, templates, guidance
```

Wiring in `apps/studio/sanity.config.ts` and `apps/studio-staging/sanity.config.ts` (identical, both updated in same PR per dual-environment policy):

```typescript
import {
  launcherTool,
  responsibilityTemplates,
  articleTemplates,
  withGuidedSidebar,
  responsibilityGuidance,
  articleGuidance,
} from "@kcvv/sanity-studio";

export default defineConfig({
  // ...
  tools: (prev) => [...prev, launcherTool()],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      ...responsibilityTemplates,
      ...articleTemplates,
    ],
  },
  document: {
    components: {
      layout: withGuidedSidebar({
        responsibility: responsibilityGuidance,
        article: articleGuidance,
      }),
    },
  },
});
```

**Sanity primitives used (all native, no plugins):** `createTool()`, native `templates` API, `useRouter().navigateIntent('create', ...)`, `defineField({ group, components: { input | field } })`, `defineType({ groups: [...] })`, `components.document.layout`.

## Launcher Tool — UX & data model

**Entry point:** new top-nav tab `✨ Create` next to "Desk" and "Vision". Click → full-pane route at `/create`.

**Layout (v1):** stacked single page — search box, "Recently used" (only if non-empty, ≤6 items, localStorage scoped per user id), then template cards grouped by `ui.group`.

**Card content:** Lucide icon + Dutch title + 1-line "when to use" description + small badge with target doc type. Click triggers:

```typescript
router.navigateIntent("create", {
  type: template.schemaType,
  template: template.id,
});
```

Sanity routes the intent to a new draft seeded by the template's `value`.

**Template manifest entry:**

```typescript
export interface LauncherTemplate extends Template {
  id: string;
  title: string;
  schemaType: string;
  value: Record<string, unknown>; // structural-only; no editorial defaults
  ui: {
    icon: string; // Lucide icon name
    description: string; // Dutch, ≤ 100 chars, "when to use this"
    group: string; // 'Responsibilities' | 'Articles' | ...
  };
}
```

Templates without `ui` are ignored by the launcher (still work via default `+ Create`). Coexists gracefully with Sanity-default templates.

**Search:** client-side `String.includes()` over `title + description + group + schemaType`. No fuzzy library needed for <50 templates.

**Out of v1 scope:** per-template parameters; server-side persistence of recents; per-user template visibility/permissions; card thumbnails/illustrations.

## In-form guidance

Four threads, all applied to `responsibility` in Phase 1, `article` in Phase 2.

### Field descriptions

Convention: 1–3 Dutch sentences = _what_ + _concrete example_ + _public-site impact_. Stored as plain `description: '...'` on `defineField` in `packages/sanity-schemas/`. No React, DDD boundary intact.

### Smart placeholders

`<PlaceholderField>` wrapper in `packages/sanity-studio/src/inputs/`. Used via `defineField({ ..., components: withPlaceholder("bijv. 'Trainer Aboutaleb verlengt contract'") })`. Placeholder visible while empty, never persisted.

### Validation copy that teaches

`Rule.required().error('msg')` — sweep `responsibility` and `article` to replace bare `r.required()` with copy that explains _why_ the field matters. Example:

```typescript
validation: (r) => r.required().error(
  'Verplicht. Zonder titel verschijnt het artikel niet in zoekresultaten of de homepage feed.',
),
```

### Section-level helper text

Implemented as a fake leading field per group (`_intro_<group>`) with a `<SectionIntro>` renderless input that renders a styled descriptive header. Field has no value and is omitted from queries.

### `<GuidedSidebar>`

Right-docked panel registered via `components.document.layout`. Wraps Sanity's default layout. Shows:

- **Required-field checklist** — derived from `computeRequiredFields()` walking the schema's validation rules (single source of truth: the schema)
- **"Why this matters" expanders** per group — content from `<schema>-guidance.ts`
- **Preview link** — `previewUrl(doc)` returns URL or null; disabled state when null

Per-doc-type opt-in via `withGuidedSidebar(map)`. Doc types not in the map render Sanity's default layout untouched.

**Failure modes (additive, never blocks editing):**

- Required-field detection failure on custom validators → field omitted from checklist (no false ✅), sidebar still renders.
- Doc value undefined / mid-write → checklist shows all ⭕, no crash.
- Doc type not in `withGuidedSidebar` map → fall through to default layout.

## Tracer-bullet on `responsibility` (Phase 1)

### Field groups

```typescript
groups: [
  { name: "vraag", title: "Vraag", default: true },
  { name: "antwoord", title: "Antwoord" },
  { name: "contact", title: "Contact" },
  { name: "meta", title: "Meta" },
];
```

| Group    | Fields                                              |
| -------- | --------------------------------------------------- |
| vraag    | title, slug, question, audience, category, keywords |
| antwoord | summary, steps                                      |
| contact  | primaryContact                                      |
| meta     | active, icon, relatedPaths                          |

### Initial Value Template

One entry. Zero prefill. Card copy is the teaching moment.

```typescript
export const responsibilityTemplates: LauncherTemplate[] = [
  {
    id: "responsibility-new",
    title: "Nieuwe responsibility",
    schemaType: "responsibility",
    value: {},
    ui: {
      icon: "help-circle",
      description:
        "Voor info-paden zoals 'Hoe meld ik een blessure?' — gebruikers vinden dit via zoeken op de site.",
      group: "Responsibilities",
    },
  },
];
```

### `<ContactPicker>` custom input

Replaces the entire `primaryContact` object UI (8 fields + 3 conditional branches via `contactType` radio) with a single search-driven picker. Reused for both `primaryContact` and the per-step `contact` field via `applyContactPicker()`. Same patch shape persisted → no schema migration.

**States:**

- Empty: single search box "Zoek positie, teamrol of voeg handmatig toe…"
- Searching: dropdown grouped by source (Posities, Teamrollen, ✏️ Handmatig)
- Selected (position): chip showing position + holder name + ✕
- Selected (team-role): chip + secondary "Fallback teamrol" select expands inline (the only conditional that survives — it's a real editorial choice)
- Selected (manual): chip showing summary; click chip to expand inline form (rol/email/telefoon/afdeling)
- Orphan `_ref`: chip renders "⚠️ Verwijderd contact (id: xyz)" + ✕ to clear

**Patch shapes (unchanged from today's `contactFields`):**

- Position → `{ contactType: 'position', organigramNode: { _type: 'reference', _ref } }`
- Team-role → `{ contactType: 'team-role', teamRole, teamRoleFallback? }`
- Manual → `{ contactType: 'manual', role?, email?, phone?, department? }`

**Implementation notes:**

- `props.onChange(set(value))` writes the whole nested object atomically (avoids in-between invalid states triggering validation flicker)
- `useClient().observable.fetch(...)` for `organigramNode` list, cached in component state
- `@sanity/ui` `Autocomplete` primitive for the combobox
- Existing `validation` rules on `primaryContact` and `solutionStep.contact` are unchanged — they validate data shape, not UI

## Failure modes

| Failure                                                             | Where                 | Behavior                                                                                 |
| ------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `ContactPicker`: organigramNode fetch fails                         | network/Sanity outage | Picker degrades to "Manual contact only" mode + small error notice; never blocks editing |
| `ContactPicker`: selected `_ref` becomes orphan                     | runtime               | Chip renders as warning + ✕ to clear; same shape persists, no schema corruption          |
| Launcher: template registered with bad `schemaType`                 | dev-time              | `useTemplates()` filters out unknown-schemaType templates; logs once to console          |
| Launcher: `useCurrentUser()` returns null (auth race)               | runtime               | "Recently used" disabled; rest of grid renders normally                                  |
| `GuidedSidebar`: required-field detection fails (custom validators) | runtime               | Field omitted from checklist (no false ✅); sidebar still renders                        |
| `withGuidedSidebar`: doc type not in map                            | by design             | Sanity's default layout renders untouched                                                |

**Principle:** all new components are additive. If any of them fail, the editor must always be able to fall through to the underlying Sanity form and ship work. No new single point of failure.

## Testing

Mirrors the existing pattern in `packages/sanity-studio/`. Vitest + React Testing Library, peer-style with the unit it tests.

| Module                                                 | Test type     | What's covered                                                                                                        |
| ------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `contact-picker.tsx`                                   | RTL component | Each contact-type branch produces the right patch shape; orphan `_ref` warning chip; manual fallback when fetch fails |
| `apply-contact-picker.ts`                              | unit          | `components.input` patch shape stable (regression guard)                                                              |
| `launcher-grid.tsx`                                    | RTL component | Templates grouped by `ui.group`; search filters case-insensitively; recents pinned to top when present                |
| `use-templates.ts`                                     | unit          | Filters out templates without `ui`; filters out unknown `schemaType`                                                  |
| `guided-sidebar.tsx`                                   | RTL component | Checklist reflects form value; "why" expanders toggle; preview link disabled when slug missing                        |
| `compute-required-fields.ts`                           | unit          | Walks schema validation rules correctly for required/optional/conditional                                             |
| `responsibility-guidance.ts`                           | unit          | `previewUrl` returns null for empty slug, URL for present slug                                                        |
| `responsibility-templates.ts` / `article-templates.ts` | unit          | Each template's `value` decodes against its declared `schemaType` (catches typos / shape drift)                       |

No e2e for v1 — `apps/studio` has no Playwright config. Manual smoke before merge: launcher → click each card → form opens → fill required → publish on local Studio against staging dataset.

## Delivery sequencing

### Phase 1 — `responsibility` tracer-bullet (one PR)

1. Generic infra (no doc-type binding): `withPlaceholder`, `sectionIntro`, `withGuidedSidebar`
2. `LauncherTool` + `use-templates` + `use-recents`
3. `ContactPicker` + `applyContactPicker`
4. `responsibility-templates.ts` (1 entry, no prefill)
5. `responsibility-guidance.ts`
6. Schema edits to `packages/sanity-schemas/src/responsibility.ts`: groups, descriptions, validation copy, placeholder wrappers, `applyContactPicker` on both contact fields, section-intro fields
7. Wire in both `apps/studio/sanity.config.ts` and `apps/studio-staging/sanity.config.ts` — same PR
8. Tests for everything above
9. Update `packages/sanity-studio/CLAUDE.md` and `packages/sanity-schemas/CLAUDE.md` with the new conventions

**Open question for plan:** split into "scaffolding PR" → "responsibility-applied PR"? Default is single PR per the C-sequencing decision; reconsider if the PR exceeds reviewable size.

### Phase 2 — `article` (one PR)

1. `article-templates.ts` (4 entries — interview / announcement / transfer / event — only `articleType` seeded)
2. `article-guidance.ts`
3. Schema edits to `article.ts`: groups, descriptions, validation copy, placeholder wrappers, section intros
4. Generalize `LauncherTool` / `GuidedSidebar` based on Phase 1 learnings
5. Tests + sanity.config.ts wiring + CLAUDE.md updates

### Phase 3+ — propagation (one PR per doc type)

`player`, `team`, `staffMember`, `sponsor`, `event`, `page`, `banner`, `homePage`, `jeugdLandingPage`. Each follows the established convention: groups + descriptions + guidance + (optional) custom inputs where the field genuinely needs them. No new infrastructure expected.

Each phase is independently shippable — partial rollout never breaks editing of types not yet touched.

## Out of scope (v1)

- Per-template parameters (e.g. "New interview about player X")
- Server-side persistence of "recently used"
- Per-user template visibility/permissions
- Card thumbnails / illustrations
- Auto-suggested next action ("Now fill in the Audience field") — the checklist is self-explanatory; explicit nudges would feel patronizing
- Editorial workflow status (draft/review/published) — Sanity's draft/publish indicator already exists
- Telemetry / analytics on editor behavior — measure via direct conversation
- i18n of launcher copy (Dutch only)
- Dedicated dark-mode theming (inherits Sanity's)
- Editor-facing accessibility audit (assumed adequate via `@sanity/ui` primitives; revisit if a future audit flags issues)
