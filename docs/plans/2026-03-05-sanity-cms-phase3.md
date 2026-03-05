# Phase 3 — Sanity CMS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Drupal with Sanity CMS — set up Studio, sync PSD player/team data nightly via Cloudflare Worker cron, migrate editorial content (sponsors, events, articles, staff) from Drupal, and switch all `apps/web` pages from `DrupalService` to `SanityService` incrementally.

**Architecture:** Cloudflare Worker `scheduled` handler upserts PSD teams + players into Sanity nightly (touching only PSD-sourced fields). Editorial enrichment (transparent images, training schedules, bios) lives exclusively in Sanity Studio. `apps/web` reads all content from Sanity via a typed `SanityService` using GROQ queries. The BFF (`apps/api`) continues handling live match + ranking data only.

**Tech stack:** Sanity v3 (`sanity`, `@sanity/client`), `@portabletext/to-portable-text` (HTML → Portable Text migration), Cloudflare Workers `scheduled` event, Effect Schema (PSD player/team schemas), Vitest (unit tests), GROQ (Sanity queries), Turborepo workspace.

**Design doc:** `docs/plans/2026-03-05-sanity-cms-design.md`

**Reference files:**

- Existing PSD client: `apps/api/src/footbalisto/client.ts`
- Existing Worker env: `apps/api/src/env.ts`
- Existing Worker entry: `apps/api/src/index.ts`
- Existing DrupalService: `apps/web/src/lib/effect/services/DrupalService.ts`
- Existing Drupal schemas: `apps/web/src/lib/effect/schemas/`
- Wrangler config: `apps/api/wrangler.toml`

---

## Task 1: Create Sanity project and Studio workspace

**Context:** `apps/studio/` does not exist yet. Sanity Studio v3 is a Vite-based React app. We initialise it inside the monorepo then wire it into Turborepo.

**Files:**

- Create: `apps/studio/` (entire directory via `sanity init`)
- Modify: `turbo.json`
- Modify: `package.json` (root workspace)

**Step 1: Create the Sanity project on sanity.io**

Go to https://sanity.io, log in, create a new project named `kcvv-elewijt`. Note the Project ID (format: `abc12345`). Create two datasets:

- `production` (public)
- `staging` (public)

**Step 2: Initialise Studio in the monorepo**

```bash
cd apps
npx sanity@latest init --project <PROJECT_ID> --dataset production --output-path studio
cd studio
```

When prompted:

- Project: select the project you just created
- Dataset: `production`
- Template: "Clean project with no predefined schemas"
- TypeScript: yes

**Step 3: Verify the generated structure**

```
apps/studio/
  package.json
  sanity.config.ts
  tsconfig.json
  src/
    schemaTypes/
      index.ts
    App.tsx (or similar)
```

**Step 4: Update root `package.json` workspaces** (if not auto-added)

Open `package.json` at repo root. Verify `apps/studio` is listed in `workspaces`. It should be if using pnpm workspaces — check `pnpm-workspace.yaml`.

**Step 5: Add Studio to `turbo.json` pipeline**

Open `turbo.json`. Add `@kcvv/studio` tasks to the pipeline (dev, build). Follow the existing pattern for `@kcvv/web`.

**Step 6: Install dependencies and verify Studio runs**

```bash
pnpm install
pnpm --filter @kcvv/studio dev
```

Open http://localhost:3333 — Sanity Studio should load.

**Step 7: Commit**

```bash
git add apps/studio/ pnpm-lock.yaml turbo.json
git commit -m "feat(migration): add sanity studio v3 workspace to monorepo"
```

---

## Task 2: Define Sanity schemas

**Context:** Sanity schemas are TypeScript objects exported from `apps/studio/src/schemaTypes/`. Each schema file defines one document type. Sanity has no migrations for adding fields — it's additive.

Reference: `docs/plans/2026-03-05-sanity-cms-design.md` for full field list.

**Files:**

- Create: `apps/studio/src/schemaTypes/player.ts`
- Create: `apps/studio/src/schemaTypes/team.ts`
- Create: `apps/studio/src/schemaTypes/staffMember.ts`
- Create: `apps/studio/src/schemaTypes/article.ts`
- Create: `apps/studio/src/schemaTypes/sponsor.ts`
- Create: `apps/studio/src/schemaTypes/event.ts`
- Create: `apps/studio/src/schemaTypes/page.ts`
- Modify: `apps/studio/src/schemaTypes/index.ts`

**Step 1: Create `player.ts`**

```typescript
// apps/studio/src/schemaTypes/player.ts
import { defineField, defineType } from "sanity";

export const player = defineType({
  name: "player",
  title: "Player",
  type: "document",
  fields: [
    // PSD-synced (never edit manually)
    defineField({
      name: "psdId",
      title: "PSD ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "firstName",
      title: "First name",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "lastName",
      title: "Last name",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "jerseyNumber",
      title: "Jersey number",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "positionPsd",
      title: "Position (PSD)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "birthDate",
      title: "Birth date",
      type: "date",
      readOnly: true,
    }),
    defineField({
      name: "nationality",
      title: "Nationality",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "height",
      title: "Height (cm)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "weight",
      title: "Weight (kg)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "joinDate",
      title: "Join date",
      type: "date",
      readOnly: true,
    }),
    defineField({
      name: "leaveDate",
      title: "Leave date",
      type: "date",
      readOnly: true,
    }),
    defineField({
      name: "psdImageUrl",
      title: "PSD image URL",
      type: "url",
      readOnly: true,
    }),
    // Editorial enrichment
    defineField({
      name: "transparentImage",
      title: "Transparent image",
      type: "image",
      options: { hotspot: true },
      description:
        "PNG with transparent background — replaces PSD image on site",
    }),
    defineField({
      name: "celebrationImage",
      title: "Celebration image",
      type: "image",
      options: { hotspot: true },
      description: "Used for first-team Instagram share cards",
    }),
    defineField({
      name: "positionOverride",
      title: "Position override",
      type: "string",
      description:
        "Full Dutch name (Keeper, Verdediger, Middenvelder, Aanvaller). Overrides PSD position code.",
      options: {
        list: ["Keeper", "Verdediger", "Middenvelder", "Aanvaller", "Speler"],
      },
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      media: "transparentImage",
    },
    prepare({ firstName, lastName, media }) {
      return { title: `${firstName ?? ""} ${lastName ?? ""}`.trim(), media };
    },
  },
});
```

**Step 2: Create `team.ts`**

```typescript
// apps/studio/src/schemaTypes/team.ts
import { defineField, defineType } from "sanity";

const trainingDay = defineType({
  name: "trainingSession",
  title: "Training session",
  type: "object",
  fields: [
    defineField({
      name: "day",
      title: "Day",
      type: "string",
      options: {
        list: [
          "Maandag",
          "Dinsdag",
          "Woensdag",
          "Donderdag",
          "Vrijdag",
          "Zaterdag",
          "Zondag",
        ],
      },
    }),
    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description: "e.g. 19:30",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description: "e.g. Sportpark Elewijt - Veld 1",
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: ["Training", "Fysiek", "Tactisch", "Keeperstraining", "Andere"],
      },
    }),
  ],
});

export const team = defineType({
  name: "team",
  title: "Team",
  type: "document",
  fields: [
    // PSD-synced
    defineField({
      name: "psdId",
      title: "PSD ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      readOnly: true,
    }),
    defineField({
      name: "leagueId",
      title: "League ID",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "league",
      title: "League",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "division",
      title: "Division",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "divisionFull",
      title: "Division (full)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "season",
      title: "Season",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "players",
      title: "Players",
      type: "array",
      of: [{ type: "reference", to: [{ type: "player" }] }],
      readOnly: true,
    }),
    // Editorial
    defineField({ name: "tagline", title: "Tagline", type: "string" }),
    defineField({
      name: "body",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "contactInfo",
      title: "Contact info",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "teamImage",
      title: "Team image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "trainingSchedule",
      title: "Training schedule",
      type: "array",
      of: [{ type: "trainingSession" }],
    }),
    defineField({
      name: "staff",
      title: "Staff",
      type: "array",
      of: [{ type: "reference", to: [{ type: "staffMember" }] }],
    }),
  ],
  preview: {
    select: { title: "name", media: "teamImage" },
  },
});

export { trainingDay };
```

**Step 3: Create `staffMember.ts`**

```typescript
// apps/studio/src/schemaTypes/staffMember.ts
import { defineField, defineType } from "sanity";

export const staffMember = defineType({
  name: "staffMember",
  title: "Staff member",
  type: "document",
  fields: [
    defineField({ name: "firstName", title: "First name", type: "string" }),
    defineField({ name: "lastName", title: "Last name", type: "string" }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: [
          { title: "Hoofdtrainer", value: "hoofdtrainer" },
          { title: "Assistent-trainer", value: "assistent" },
          { title: "Keeperstrainer", value: "keeperstrainer" },
          { title: "TVJO", value: "tvjo" },
          { title: "Ploegdelegatie", value: "ploegdelegatie" },
          { title: "Afgevaardigde", value: "afgevaardigde" },
          { title: "Coach", value: "coach" },
          { title: "Bestuur", value: "bestuur" },
          { title: "Andere", value: "other" },
        ],
      },
    }),
    defineField({ name: "birthDate", title: "Birth date", type: "date" }),
    defineField({ name: "joinDate", title: "Join date", type: "date" }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "psdId",
      title: "PSD ID (future sync)",
      type: "string",
      description: "Leave blank until Phase 4 PSD staff sync is implemented",
    }),
  ],
  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      role: "role",
      media: "photo",
    },
    prepare({ firstName, lastName, role, media }) {
      return {
        title: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        subtitle: role,
        media,
      };
    },
  },
});
```

**Step 4: Create `article.ts`**

```typescript
// apps/studio/src/schemaTypes/article.ts
import { defineField, defineType } from "sanity";

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "publishAt", title: "Publish at", type: "datetime" }),
    defineField({
      name: "unpublishAt",
      title: "Unpublish at",
      type: "datetime",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "relatedArticles",
      title: "Related articles",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
    }),
  ],
  preview: {
    select: { title: "title", media: "coverImage", publishAt: "publishAt" },
    prepare({ title, media, publishAt }) {
      return {
        title,
        subtitle: publishAt
          ? new Date(publishAt).toLocaleDateString("nl-BE")
          : "No date",
        media,
      };
    },
  },
});
```

**Step 5: Create `sponsor.ts`**

```typescript
// apps/studio/src/schemaTypes/sponsor.ts
import { defineField, defineType } from "sanity";

export const sponsor = defineType({
  name: "sponsor",
  title: "Sponsor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "url", title: "Website", type: "url" }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Crossing", value: "crossing" },
          { title: "Training", value: "training" },
          { title: "White", value: "white" },
          { title: "Green", value: "green" },
          { title: "Panel", value: "panel" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "name", media: "logo", type: "type" },
    prepare({ title, media, type }) {
      return { title, subtitle: type, media };
    },
  },
});
```

**Step 6: Create `event.ts`**

```typescript
// apps/studio/src/schemaTypes/event.ts
import { defineField, defineType } from "sanity";

export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "dateStart",
      title: "Start date",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({ name: "dateEnd", title: "End date", type: "datetime" }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "externalLink",
      title: "External link",
      type: "object",
      fields: [
        defineField({ name: "url", title: "URL", type: "url" }),
        defineField({ name: "label", title: "Label", type: "string" }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "coverImage", dateStart: "dateStart" },
    prepare({ title, media, dateStart }) {
      return {
        title,
        subtitle: dateStart
          ? new Date(dateStart).toLocaleDateString("nl-BE")
          : "",
        media,
      };
    },
  },
});
```

**Step 7: Create `page.ts`**

```typescript
// apps/studio/src/schemaTypes/page.ts
import { defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    }),
  ],
});
```

**Step 8: Register all schemas in `index.ts`**

```typescript
// apps/studio/src/schemaTypes/index.ts
import { player } from "./player";
import { team, trainingDay } from "./team";
import { staffMember } from "./staffMember";
import { article } from "./article";
import { sponsor } from "./sponsor";
import { event } from "./event";
import { page } from "./page";

export const schemaTypes = [
  player,
  team,
  trainingDay,
  staffMember,
  article,
  sponsor,
  event,
  page,
];
```

**Step 9: Update `sanity.config.ts` to use the schemas**

Open the generated `sanity.config.ts` and ensure it imports from `./src/schemaTypes`:

```typescript
import { schemaTypes } from "./src/schemaTypes";
// schema: { types: schemaTypes }
```

**Step 10: Verify schemas load in Studio**

```bash
pnpm --filter @kcvv/studio dev
```

Open http://localhost:3333 — all 7 document types should appear in the sidebar.

**Step 11: Commit**

```bash
git add apps/studio/src/schemaTypes/
git commit -m "feat(migration): define sanity schema types for all 7 content types"
```

---

## Task 3: Custom Studio desk structure ("Needs enrichment" view)

**Context:** Sanity Studio's default desk structure lists all documents of each type. We add a custom pinned view that filters players with no `transparentImage`.

**Files:**

- Create: `apps/studio/src/structure.ts`
- Modify: `apps/studio/sanity.config.ts`

**Step 1: Create `structure.ts`**

```typescript
// apps/studio/src/structure.ts
import { defineStructure } from "sanity";

export const structure = defineStructure((S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Players")
        .child(
          S.list()
            .title("Players")
            .items([
              S.listItem()
                .title("All players")
                .child(S.documentTypeList("player").title("All players")),
              S.listItem()
                .title("Needs enrichment")
                .child(
                  S.documentList()
                    .title("Missing transparent image")
                    .filter('_type == "player" && !defined(transparentImage)')
                    .defaultOrdering([{ field: "lastName", direction: "asc" }]),
                ),
            ]),
        ),
      S.listItem()
        .title("Teams")
        .child(S.documentTypeList("team").title("Teams")),
      S.listItem()
        .title("Staff")
        .child(S.documentTypeList("staffMember").title("Staff")),
      S.divider(),
      S.listItem()
        .title("Articles")
        .child(S.documentTypeList("article").title("Articles")),
      S.listItem()
        .title("Sponsors")
        .child(S.documentTypeList("sponsor").title("Sponsors")),
      S.listItem()
        .title("Events")
        .child(S.documentTypeList("event").title("Events")),
      S.listItem()
        .title("Pages")
        .child(S.documentTypeList("page").title("Pages")),
    ]),
);
```

**Step 2: Register structure in `sanity.config.ts`**

```typescript
import { structure } from "./src/structure";
// In defineConfig: desk: structure
```

**Step 3: Verify in Studio**

```bash
pnpm --filter @kcvv/studio dev
```

Check that "Players > Needs enrichment" appears and filters correctly (empty for now — no documents yet).

**Step 4: Commit**

```bash
git add apps/studio/src/structure.ts apps/studio/sanity.config.ts
git commit -m "feat(migration): add custom studio desk structure with needs-enrichment view"
```

---

## Task 4: Investigate PSD team and player endpoints

**Context:** The BFF (`apps/api`) currently only implements match, ranking, and stats endpoints. Player and team data comes from Drupal today. We need to discover what PSD endpoints expose team rosters and player profiles before implementing the sync.

The PSD base URL is `https://clubapi.prosoccerdata.com`. Auth headers: `x-api-key`, `x-api-club`, `Authorization`. These are already set up in `apps/api/src/footbalisto/client.ts`.

**Step 1: Probe known PSD endpoints**

Using `wrangler dev` or a direct curl (with actual secrets from wrangler), try these likely endpoints:

```bash
# List all club teams
curl -H "x-api-key: $PSD_API_KEY" -H "x-api-club: $PSD_API_CLUB" -H "Authorization: $PSD_API_AUTH" \
  https://clubapi.prosoccerdata.com/teams

# Players for a specific team (use a known teamId from existing DrupalService data)
curl ... https://clubapi.prosoccerdata.com/teams/{teamId}/players

# Player detail
curl ... https://clubapi.prosoccerdata.com/players/{playerId}
```

**Step 2: Document the response shapes**

Record the actual JSON response fields in a comment at the top of a new file `apps/api/src/footbalisto/schemas-player-team.ts`. This becomes the source of truth for the schemas in Task 5.

**Step 3: Note any surprises**

If field names differ from expectations (e.g. position is a code vs full name, team roster is paginated, etc.) — document it in `docs/plans/2026-03-05-sanity-cms-design.md` under a "## PSD API Learnings" section. Also append to `.claude/skills/drupal-api-analyzer/` if relevant.

---

## Task 5: Add PSD player and team schemas to `api-contract`

**Context:** The `packages/api-contract` package currently has match, ranking, and stats schemas. Player and team schemas for the sync live here — but NOT in the `PsdApi` HttpApi groups (those are only for BFF HTTP endpoints). These are plain Effect schemas used by the sync handler in `apps/api`.

**Important:** `moduleResolution` is `bundler` — never add `.js` extensions to imports.

**Files:**

- Create: `packages/api-contract/src/schemas/player.ts`
- Create: `packages/api-contract/src/schemas/team.ts`
- Modify: `packages/api-contract/src/schemas/index.ts`

**Step 1: Write a failing test for player schema validation**

```typescript
// packages/api-contract/src/schemas/player.test.ts
import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import { PsdPlayer } from "./player";

describe("PsdPlayer schema", () => {
  it("decodes a valid PSD player", () => {
    const raw = {
      id: 42,
      firstName: "Jan",
      lastName: "Janssen",
      // add actual fields from Task 4 investigation
    };
    const result = S.decodeUnknownSync(PsdPlayer)(raw);
    expect(result.psdId).toBe("42");
  });

  it("fails on missing required id", () => {
    expect(() => S.decodeUnknownSync(PsdPlayer)({})).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @kcvv/api-contract test --run
```

Expected: FAIL — `PsdPlayer` not defined.

**Step 3: Create `player.ts` schema** (based on actual PSD response from Task 4)

```typescript
// packages/api-contract/src/schemas/player.ts
import { Schema as S } from "effect";

// Adapt field names to match actual PSD API response from Task 4 investigation
export class PsdPlayer extends S.Class<PsdPlayer>("PsdPlayer")({
  id: S.Number,
  firstName: S.optional(S.NullOr(S.String)),
  lastName: S.optional(S.NullOr(S.String)),
  jerseyNumber: S.optional(S.NullOr(S.Number)),
  position: S.optional(S.NullOr(S.String)),
  birthDate: S.optional(S.NullOr(S.String)),
  nationality: S.optional(S.NullOr(S.String)),
  height: S.optional(S.NullOr(S.Number)),
  weight: S.optional(S.NullOr(S.Number)),
  joinDate: S.optional(S.NullOr(S.String)),
  leaveDate: S.optional(S.NullOr(S.String)),
  imageUrl: S.optional(S.NullOr(S.String)),
}) {}

export const PsdPlayersArray = S.Array(PsdPlayer);
```

**Step 4: Create `team.ts` schema** (based on actual PSD response from Task 4)

```typescript
// packages/api-contract/src/schemas/team.ts
import { Schema as S } from "effect";
import { PsdPlayer } from "./player";

export class PsdTeam extends S.Class<PsdTeam>("PsdTeam")({
  id: S.Number,
  name: S.String,
  leagueId: S.optional(S.NullOr(S.Number)),
  league: S.optional(S.NullOr(S.String)),
  division: S.optional(S.NullOr(S.String)),
  divisionFull: S.optional(S.NullOr(S.String)),
  season: S.optional(S.NullOr(S.String)),
}) {}

export class PsdTeamWithPlayers extends S.Class<PsdTeamWithPlayers>(
  "PsdTeamWithPlayers",
)({
  ...PsdTeam.fields,
  players: S.optional(S.Array(PsdPlayer)),
}) {}

export const PsdTeamsArray = S.Array(PsdTeam);
```

**Step 5: Export from `index.ts`**

Open `packages/api-contract/src/schemas/index.ts`. Add:

```typescript
export * from "./player";
export * from "./team";
```

Check for duplicate exports — see the barrel duplicate export gotcha in root `CLAUDE.md`.

**Step 6: Run tests**

```bash
pnpm --filter @kcvv/api-contract test --run
```

Expected: PASS.

**Step 7: Build to verify no Turbopack issues**

```bash
pnpm turbo build --filter=@kcvv/web
```

Expected: successful build.

**Step 8: Commit**

```bash
git add packages/api-contract/src/schemas/player.ts packages/api-contract/src/schemas/team.ts packages/api-contract/src/schemas/index.ts
git commit -m "feat(schema): add PSD player and team schemas to api-contract"
```

---

## Task 6: Add Sanity write client to `apps/api`

**Context:** The Cloudflare Worker needs to write to Sanity. We use `@sanity/client` with a write token. The `WorkerEnv` interface gets three new secrets: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN` (write token).

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/env.ts`
- Create: `apps/api/src/sanity/client.ts`
- Modify: `apps/api/wrangler.toml`

**Step 1: Get a Sanity write token**

In Sanity Studio dashboard (sanity.io/manage), go to your project → API → Tokens → Add API token. Name: `kcvv-api-sync`, permissions: `Editor`. Copy the token.

**Step 2: Install `@sanity/client`**

```bash
pnpm --filter @kcvv/api add @sanity/client
```

**Step 3: Add env vars to `WorkerEnv`**

Open `apps/api/src/env.ts`. Add:

```typescript
readonly SANITY_PROJECT_ID: string;
readonly SANITY_DATASET: string;   // "production" or "staging"
readonly SANITY_API_TOKEN: string; // write token — wrangler secret
```

**Step 4: Add vars to `wrangler.toml`**

```toml
[vars]
# existing vars...
SANITY_PROJECT_ID = "your-project-id"
SANITY_DATASET = "production"
# SANITY_API_TOKEN is a secret — set via: wrangler secret put SANITY_API_TOKEN

[env.staging.vars]
# existing staging vars...
SANITY_PROJECT_ID = "your-project-id"
SANITY_DATASET = "staging"
```

**Step 5: Set the secret in Wrangler**

```bash
cd apps/api
npx wrangler secret put SANITY_API_TOKEN
# paste the token from Step 1
npx wrangler secret put SANITY_API_TOKEN --env staging
```

**Step 6: Create `apps/api/src/sanity/client.ts`**

```typescript
// apps/api/src/sanity/client.ts
import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

export interface SanityWriteClientInterface {
  readonly upsertPlayer: (
    doc: SanityPlayerDoc,
  ) => Effect.Effect<void, SanityWriteError>;
  readonly upsertTeam: (
    doc: SanityTeamDoc,
  ) => Effect.Effect<void, SanityWriteError>;
}

export interface SanityPlayerDoc {
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  positionPsd: string | null;
  birthDate: string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  joinDate: string | null;
  leaveDate: string | null;
  psdImageUrl: string | null;
}

export interface SanityTeamDoc {
  psdId: string;
  name: string;
  slug: string;
  leagueId: number | null;
  league: string | null;
  division: string | null;
  divisionFull: string | null;
  season: string | null;
  playerPsdIds: string[];
}

export class SanityWriteError extends Error {
  readonly _tag = "SanityWriteError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class SanityWriteClient extends Context.Tag("SanityWriteClient")<
  SanityWriteClient,
  SanityWriteClientInterface
>() {}

/**
 * Upsert strategy: patch by psdId, setIfMissing for editorial fields.
 * Never overwrites transparentImage, celebrationImage, positionOverride, bio, trainingSchedule, staff.
 */
export const SanityWriteClientLive = Layer.effect(
  SanityWriteClient,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: "2024-01-01",
      token: env.SANITY_API_TOKEN,
      useCdn: false,
    });

    const docId = (type: string, psdId: string) => `${type}-psd-${psdId}`;

    const upsert = <T extends Record<string, unknown>>(
      type: string,
      psdId: string,
      psdFields: T,
    ) =>
      Effect.tryPromise({
        try: () =>
          client
            .transaction()
            .createIfNotExists({ _id: docId(type, psdId), _type: type, psdId })
            .patch(docId(type, psdId), (p) => p.set(psdFields))
            .commit(),
        catch: (cause) =>
          new SanityWriteError(`Failed to upsert ${type} ${psdId}`, cause),
      });

    return {
      upsertPlayer: (doc) =>
        upsert("player", doc.psdId, {
          firstName: doc.firstName,
          lastName: doc.lastName,
          jerseyNumber: doc.jerseyNumber,
          positionPsd: doc.positionPsd,
          birthDate: doc.birthDate,
          nationality: doc.nationality,
          height: doc.height,
          weight: doc.weight,
          joinDate: doc.joinDate,
          leaveDate: doc.leaveDate,
          psdImageUrl: doc.psdImageUrl,
        }).pipe(Effect.asVoid),

      upsertTeam: (doc) =>
        upsert("team", doc.psdId, {
          name: doc.name,
          slug: { _type: "slug", current: doc.slug },
          leagueId: doc.leagueId,
          league: doc.league,
          division: doc.division,
          divisionFull: doc.divisionFull,
          season: doc.season,
          players: doc.playerPsdIds.map((id) => ({
            _type: "reference",
            _ref: `player-psd-${id}`,
            _key: id,
          })),
        }).pipe(Effect.asVoid),
    };
  }),
);
```

**Step 7: Commit**

```bash
git add apps/api/src/sanity/ apps/api/src/env.ts apps/api/wrangler.toml apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add sanity write client to cloudflare worker"
```

---

## Task 7: Implement nightly PSD → Sanity sync handler

**Context:** Cloudflare Workers support a `scheduled()` export alongside `fetch()`. This runs on cron. We add a nightly sync that fetches all club teams and their players from PSD, then upserts into Sanity.

**Files:**

- Create: `apps/api/src/sync/psd-sanity-sync.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/wrangler.toml`

**Step 1: Write a failing test for the transform logic**

```typescript
// apps/api/src/sync/psd-sanity-sync.test.ts
import { describe, it, expect } from "vitest";
import { transformPlayer, transformTeam } from "./psd-sanity-sync";

describe("transformPlayer", () => {
  it("converts PSD player to Sanity doc", () => {
    const psdPlayer = {
      id: 42,
      firstName: "Jan",
      lastName: "Janssen",
      jerseyNumber: 9,
      position: "a",
      birthDate: "1995-01-15",
      nationality: "BE",
      height: 180,
      weight: 75,
      joinDate: "2020-07-01",
      leaveDate: null,
      imageUrl: "https://example.com/player.jpg",
    };
    const result = transformPlayer(psdPlayer);
    expect(result.psdId).toBe("42");
    expect(result.firstName).toBe("Jan");
    expect(result.positionPsd).toBe("a");
    expect(result.psdImageUrl).toBe("https://example.com/player.jpg");
  });
});

describe("transformTeam", () => {
  it("converts PSD team to Sanity doc with slugified name", () => {
    const psdTeam = {
      id: 7,
      name: "Eerste Ploeg",
      leagueId: 1,
      league: "3de Afdeling",
      division: "B",
      divisionFull: "3de Afdeling VV B",
      season: "2024-2025",
    };
    const playerIds = ["42", "43"];
    const result = transformTeam(psdTeam, playerIds);
    expect(result.psdId).toBe("7");
    expect(result.slug).toBe("eerste-ploeg");
    expect(result.playerPsdIds).toEqual(["42", "43"]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @kcvv/api test --run
```

Expected: FAIL — module not found.

**Step 3: Create `psd-sanity-sync.ts`**

```typescript
// apps/api/src/sync/psd-sanity-sync.ts
import { Effect, Layer } from "effect";
import type { PsdPlayer, PsdTeam } from "@kcvv/api-contract";
import type { SanityPlayerDoc, SanityTeamDoc } from "../sanity/client";
import { SanityWriteClient } from "../sanity/client";
import { FootbalistoClient } from "../footbalisto/client";

export function transformPlayer(psd: PsdPlayer): SanityPlayerDoc {
  return {
    psdId: String(psd.id),
    firstName: psd.firstName ?? null,
    lastName: psd.lastName ?? null,
    jerseyNumber: psd.jerseyNumber ?? null,
    positionPsd: psd.position ?? null,
    birthDate: psd.birthDate ?? null,
    nationality: psd.nationality ?? null,
    height: psd.height ?? null,
    weight: psd.weight ?? null,
    joinDate: psd.joinDate ?? null,
    leaveDate: psd.leaveDate ?? null,
    psdImageUrl: psd.imageUrl ?? null,
  };
}

export function transformTeam(
  psd: PsdTeam,
  playerPsdIds: string[],
): SanityTeamDoc {
  const slug = psd.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    psdId: String(psd.id),
    name: psd.name,
    slug,
    leagueId: psd.leagueId ?? null,
    league: psd.league ?? null,
    division: psd.division ?? null,
    divisionFull: psd.divisionFull ?? null,
    season: psd.season ?? null,
    playerPsdIds,
  };
}

/**
 * Main sync effect: fetch all club teams from PSD, then players per team,
 * and upsert everything into Sanity.
 */
export const runSync = Effect.gen(function* () {
  const psd = yield* FootbalistoClient;
  const sanity = yield* SanityWriteClient;

  const teams = yield* psd.getRawTeams();

  yield* Effect.forEach(
    teams,
    (team) =>
      Effect.gen(function* () {
        const players = yield* psd.getRawPlayers(team.id);

        // Upsert all players first (team references them)
        yield* Effect.forEach(
          players,
          (p) => sanity.upsertPlayer(transformPlayer(p)),
          { concurrency: 5 },
        );

        const playerPsdIds = players.map((p) => String(p.id));
        yield* sanity.upsertTeam(transformTeam(team, playerPsdIds));
      }),
    { concurrency: 1 }, // teams sequentially to avoid rate limits
  );
}).pipe(
  Effect.tapError((e) => Effect.log(`Sync failed: ${String(e)}`)),
  Effect.annotateLogs({ service: "psd-sanity-sync" }),
);
```

**Step 4: Add `getRawTeams` and `getRawPlayers` to `FootbalistoClient`**

Open `apps/api/src/footbalisto/client.ts`. Add to the interface and implementation (using endpoint URLs discovered in Task 4):

```typescript
// Add to FootbalistoClientInterface:
readonly getRawTeams: () => Effect.Effect<readonly PsdTeam[], FootbalistoClientError>;
readonly getRawPlayers: (teamId: number) => Effect.Effect<readonly PsdPlayer[], FootbalistoClientError>;

// Add to FootbalistoClientLive implementation:
getRawTeams: () =>
  fetchJson(`${base}/teams`, PsdTeamsArray, psdHeaders),

getRawPlayers: (teamId: number) =>
  fetchJson(`${base}/teams/${teamId}/players`, PsdPlayersArray, psdHeaders),
```

**Step 5: Run tests to verify pass**

```bash
pnpm --filter @kcvv/api test --run
```

Expected: PASS.

**Step 6: Add `scheduled` export to `apps/api/src/index.ts`**

Open `apps/api/src/index.ts`. Add the `scheduled` handler alongside the existing `fetch`:

```typescript
import { Effect, Layer } from "effect";
import { runSync } from "./sync/psd-sanity-sync";
import { SanityWriteClientLive } from "./sanity/client";

// ... existing buildAppLayer ...

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // existing implementation unchanged
  },

  async scheduled(
    _event: ScheduledEvent,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const layer = Layer.mergeAll(
      FootbalistoClientLive,
      KvCacheLive,
      SanityWriteClientLive,
      Layer.succeed(WorkerEnvTag, env),
    );
    const program = Effect.provide(runSync, layer);
    ctx.waitUntil(Effect.runPromise(program));
  },
};
```

**Step 7: Add cron trigger to `wrangler.toml`**

```toml
[triggers]
crons = ["0 2 * * *"]  # 02:00 UTC daily
```

**Step 8: Test the cron locally**

```bash
cd apps/api
npx wrangler dev --test-scheduled
# In another terminal:
curl "http://localhost:8787/__scheduled?cron=0+2+*+*+*"
```

Check Cloudflare Worker logs — should see sync log entries.

**Step 9: Deploy and verify**

```bash
npx wrangler deploy
```

Check Cloudflare dashboard → Workers → `kcvv-api` → Triggers → Cron Triggers. Verify cron appears. Manually trigger from dashboard and check logs.

**Step 10: Commit**

```bash
git add apps/api/src/sync/ apps/api/src/index.ts apps/api/src/footbalisto/client.ts apps/api/wrangler.toml
git commit -m "feat(api): add nightly PSD to sanity sync via cloudflare worker cron"
```

---

## Task 8: Add `SanityService` to `apps/web`

**Context:** `apps/web` needs a typed Effect service that reads from Sanity via GROQ queries. This replaces `DrupalService` incrementally.

**Files:**

- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/sanity/client.ts`
- Create: `apps/web/src/lib/sanity/queries/players.ts`
- Create: `apps/web/src/lib/sanity/queries/teams.ts`
- Create: `apps/web/src/lib/sanity/queries/articles.ts`
- Create: `apps/web/src/lib/sanity/queries/sponsors.ts`
- Create: `apps/web/src/lib/sanity/queries/events.ts`
- Create: `apps/web/src/lib/effect/services/SanityService.ts`
- Create: `apps/web/src/lib/effect/services/SanityService.test.ts`

**Step 1: Install `@sanity/client`**

```bash
pnpm --filter @kcvv/web add @sanity/client
```

**Step 2: Create Sanity client config**

Add to `.env.local` (and `.env.local.example`):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=your-read-token
```

Get a read-only token from Sanity dashboard → API → Tokens → Add API token (Viewer).

```typescript
// apps/web/src/lib/sanity/client.ts
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true,
  token: process.env.SANITY_API_READ_TOKEN,
});
```

**Step 3: Write a failing test for `SanityService`**

```typescript
// apps/web/src/lib/effect/services/SanityService.test.ts
import { describe, it, expect, vi } from "vitest";
import { Effect } from "effect";
import { SanityService, SanityServiceLive } from "./SanityService";

vi.mock("../../sanity/client", () => ({
  sanityClient: {
    fetch: vi
      .fn()
      .mockResolvedValue([
        {
          _id: "player-psd-42",
          psdId: "42",
          firstName: "Jan",
          lastName: "Janssen",
        },
      ]),
  },
}));

describe("SanityService.getPlayers", () => {
  it("returns players from Sanity", async () => {
    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getPlayers();
    }).pipe(Effect.provide(SanityServiceLive));

    const players = await Effect.runPromise(program);
    expect(players).toHaveLength(1);
    expect(players[0]?.psdId).toBe("42");
  });
});
```

**Step 4: Run test to verify it fails**

```bash
pnpm --filter @kcvv/web test --run src/lib/effect/services/SanityService.test.ts
```

Expected: FAIL — module not found.

**Step 5: Create GROQ queries**

```typescript
// apps/web/src/lib/sanity/queries/players.ts
export const PLAYERS_QUERY = `*[_type == "player"] | order(lastName asc) {
  _id, psdId, firstName, lastName, jerseyNumber, positionPsd, positionOverride,
  birthDate, nationality, height, weight, joinDate, leaveDate,
  psdImageUrl,
  "transparentImageUrl": transparentImage.asset->url,
  "celebrationImageUrl": celebrationImage.asset->url,
  bio
}`;

export const PLAYER_BY_SLUG_QUERY = `*[_type == "player" && psdId == $psdId][0] {
  _id, psdId, firstName, lastName, jerseyNumber, positionPsd, positionOverride,
  birthDate, nationality, height, weight, joinDate, leaveDate,
  psdImageUrl,
  "transparentImageUrl": transparentImage.asset->url,
  "celebrationImageUrl": celebrationImage.asset->url,
  bio
}`;
```

```typescript
// apps/web/src/lib/sanity/queries/teams.ts
export const TEAMS_QUERY = `*[_type == "team"] | order(name asc) {
  _id, psdId, name, slug, leagueId, league, division, divisionFull, season,
  tagline, body, contactInfo,
  "teamImageUrl": teamImage.asset->url,
  trainingSchedule,
  players[]-> { _id, psdId, firstName, lastName, jerseyNumber, positionPsd, positionOverride, psdImageUrl, "transparentImageUrl": transparentImage.asset->url },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url }
}`;

export const TEAM_BY_SLUG_QUERY = `*[_type == "team" && slug.current == $slug][0] {
  _id, psdId, name, slug, leagueId, league, division, divisionFull, season,
  tagline, body, contactInfo,
  "teamImageUrl": teamImage.asset->url,
  trainingSchedule,
  players[]-> { _id, psdId, firstName, lastName, jerseyNumber, positionPsd, positionOverride, psdImageUrl, "transparentImageUrl": transparentImage.asset->url },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url }
}`;
```

```typescript
// apps/web/src/lib/sanity/queries/articles.ts
export const ARTICLES_QUERY = `*[_type == "article"] | order(publishAt desc) {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url,
  body
}`;

export const ARTICLE_BY_SLUG_QUERY = `*[_type == "article" && slug.current == $slug][0] {
  _id, title, slug, publishAt, featured, tags,
  "coverImageUrl": coverImage.asset->url,
  body,
  relatedArticles[]-> { _id, title, slug, publishAt, "coverImageUrl": coverImage.asset->url }
}`;
```

```typescript
// apps/web/src/lib/sanity/queries/sponsors.ts
export const SPONSORS_QUERY = `*[_type == "sponsor" && active == true] | order(name asc) {
  _id, name, url, type, "logoUrl": logo.asset->url
}`;
```

```typescript
// apps/web/src/lib/sanity/queries/events.ts
export const EVENTS_QUERY = `*[_type == "event"] | order(dateStart asc) {
  _id, title, dateStart, dateEnd, externalLink,
  "coverImageUrl": coverImage.asset->url
}`;
```

**Step 6: Create `SanityService.ts`**

```typescript
// apps/web/src/lib/effect/services/SanityService.ts
import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../../sanity/client";
import {
  PLAYERS_QUERY,
  PLAYER_BY_SLUG_QUERY,
} from "../../sanity/queries/players";
import { TEAMS_QUERY, TEAM_BY_SLUG_QUERY } from "../../sanity/queries/teams";
import {
  ARTICLES_QUERY,
  ARTICLE_BY_SLUG_QUERY,
} from "../../sanity/queries/articles";
import { SPONSORS_QUERY } from "../../sanity/queries/sponsors";
import { EVENTS_QUERY } from "../../sanity/queries/events";

// Keep these simple — no Effect Schema validation yet. Add per content type as pages are cut over.
export interface SanityPlayer {
  _id: string;
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  positionPsd: string | null;
  positionOverride: string | null;
  transparentImageUrl: string | null;
  celebrationImageUrl: string | null;
  psdImageUrl: string | null;
  bio: unknown;
  birthDate: string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
}

export interface SanityTeam {
  _id: string;
  psdId: string;
  name: string;
  slug: { current: string };
  leagueId: number | null;
  league: string | null;
  division: string | null;
  divisionFull: string | null;
  season: string | null;
  tagline: string | null;
  teamImageUrl: string | null;
  trainingSchedule: SanityTrainingSession[];
  players: SanityPlayer[];
  staff: SanityStaffMember[];
  body: unknown;
  contactInfo: unknown;
}

export interface SanityTrainingSession {
  day: string;
  time: string;
  location: string;
  type: string;
}

export interface SanityStaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  photoUrl: string | null;
}

export interface SanityArticle {
  _id: string;
  title: string;
  slug: { current: string };
  publishAt: string | null;
  featured: boolean;
  tags: string[];
  coverImageUrl: string | null;
  body: unknown;
  relatedArticles?: SanityArticle[];
}

export interface SanitySponsor {
  _id: string;
  name: string;
  url: string | null;
  type: string;
  logoUrl: string | null;
}

export interface SanityEvent {
  _id: string;
  title: string;
  dateStart: string;
  dateEnd: string | null;
  externalLink: { url: string; label: string } | null;
  coverImageUrl: string | null;
}

export interface SanityServiceInterface {
  readonly getPlayers: () => Effect.Effect<SanityPlayer[]>;
  readonly getPlayerByPsdId: (
    psdId: string,
  ) => Effect.Effect<SanityPlayer | null>;
  readonly getTeams: () => Effect.Effect<SanityTeam[]>;
  readonly getTeamBySlug: (slug: string) => Effect.Effect<SanityTeam | null>;
  readonly getArticles: () => Effect.Effect<SanityArticle[]>;
  readonly getArticleBySlug: (
    slug: string,
  ) => Effect.Effect<SanityArticle | null>;
  readonly getSponsors: () => Effect.Effect<SanitySponsor[]>;
  readonly getEvents: () => Effect.Effect<SanityEvent[]>;
}

export class SanityService extends Context.Tag("SanityService")<
  SanityService,
  SanityServiceInterface
>() {}

const fetch = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise<T>({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  });

export const SanityServiceLive = Layer.succeed(SanityService, {
  getPlayers: () => fetch<SanityPlayer[]>(PLAYERS_QUERY),
  getPlayerByPsdId: (psdId) =>
    fetch<SanityPlayer | null>(PLAYER_BY_SLUG_QUERY, { psdId }),
  getTeams: () => fetch<SanityTeam[]>(TEAMS_QUERY),
  getTeamBySlug: (slug) =>
    fetch<SanityTeam | null>(TEAM_BY_SLUG_QUERY, { slug }),
  getArticles: () => fetch<SanityArticle[]>(ARTICLES_QUERY),
  getArticleBySlug: (slug) =>
    fetch<SanityArticle | null>(ARTICLE_BY_SLUG_QUERY, { slug }),
  getSponsors: () => fetch<SanitySponsor[]>(SPONSORS_QUERY),
  getEvents: () => fetch<SanityEvent[]>(EVENTS_QUERY),
});
```

**Step 7: Run tests**

```bash
pnpm --filter @kcvv/web test --run src/lib/effect/services/SanityService.test.ts
```

Expected: PASS.

**Step 8: Commit**

```bash
git add apps/web/src/lib/sanity/ apps/web/src/lib/effect/services/SanityService.ts apps/web/src/lib/effect/services/SanityService.test.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(migration): add sanity service and groq queries to apps/web"
```

---

## Task 9: Migration script scaffolding

**Context:** A one-time script that reads from Drupal JSON:API and writes to Sanity. Runs locally. Targets the `staging` dataset first.

**Files:**

- Create: `scripts/drupal-to-sanity/package.json`
- Create: `scripts/drupal-to-sanity/src/drupal-fetcher.ts`
- Create: `scripts/drupal-to-sanity/src/sanity-uploader.ts`
- Create: `scripts/drupal-to-sanity/src/index.ts`

**Step 1: Set up the script package**

```bash
mkdir -p scripts/drupal-to-sanity/src
```

```json
// scripts/drupal-to-sanity/package.json
{
  "name": "drupal-to-sanity",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "migrate:sponsors": "tsx src/migrate-sponsors.ts",
    "migrate:events": "tsx src/migrate-events.ts",
    "migrate:articles": "tsx src/migrate-articles.ts",
    "migrate:staff": "tsx src/migrate-staff.ts"
  },
  "dependencies": {
    "@sanity/client": "*",
    "effect": "*",
    "@portabletext/to-portable-text": "^1.0.0",
    "node-html-parser": "^6.0.0"
  },
  "devDependencies": {
    "tsx": "*"
  }
}
```

**Step 2: Create `drupal-fetcher.ts`** (reuses DrupalService patterns from `apps/web/src/lib/effect/services/DrupalService.ts`)

```typescript
// scripts/drupal-to-sanity/src/drupal-fetcher.ts
const DRUPAL_BASE = process.env.DRUPAL_BASE_URL!;

export async function fetchAllPages<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    if (!res.ok) throw new Error(`Drupal fetch failed: ${res.status} ${next}`);
    const json = (await res.json()) as {
      data: T[];
      links?: { next?: { href: string } };
    };
    results.push(...json.data);
    next = json.links?.next?.href ?? null;
  }
  return results;
}

export function drupalUrl(path: string) {
  return `${DRUPAL_BASE}/jsonapi/${path}`;
}
```

**Step 3: Create `sanity-uploader.ts`**

```typescript
// scripts/drupal-to-sanity/src/sanity-uploader.ts
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? "staging",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

export async function uploadImageFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: url.split("/").pop(),
    });
    return asset._id;
  } catch {
    return null;
  }
}

export async function createDoc(doc: Record<string, unknown>): Promise<void> {
  await client.createOrReplace(doc);
}

export { client };
```

**Step 4: Create `.env` file for the script**

```bash
# scripts/drupal-to-sanity/.env (gitignored)
DRUPAL_BASE_URL=https://www.kcvvelewijt.be
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=staging
SANITY_API_TOKEN=your-write-token
```

**Step 5: Install dependencies**

```bash
cd scripts/drupal-to-sanity && pnpm install
```

**Step 6: Commit scaffolding**

```bash
git add scripts/drupal-to-sanity/
git commit -m "feat(migration): add drupal to sanity migration script scaffolding"
```

---

## Task 10: Migrate sponsors

**Files:**

- Create: `scripts/drupal-to-sanity/src/migrate-sponsors.ts`

**Step 1: Create migration script**

```typescript
// scripts/drupal-to-sanity/src/migrate-sponsors.ts
import "dotenv/config";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

// Look at apps/web/src/lib/effect/schemas/sponsor.schema.ts for Drupal field names
interface DrupalSponsor {
  id: string;
  attributes: {
    title: string;
    field_type: string;
    status: boolean;
    field_website?: { uri: string } | null;
  };
  relationships: {
    field_media_image?: { data: { id: string } | null };
  };
}

interface DrupalMediaImage {
  id: string;
  attributes: { field_media_image?: { data: { id: string } } };
  relationships?: unknown;
}

interface DrupalFile {
  id: string;
  attributes: { uri: { url: string } };
}

async function main() {
  console.log("Fetching sponsors from Drupal...");
  const sponsors = await fetchAllPages<DrupalSponsor>(
    drupalUrl(
      "node/sponsor?include=field_media_image.field_media_image&page[limit]=50",
    ),
  );
  console.log(`Found ${sponsors.length} sponsors`);

  // Fetch included media to resolve image URLs
  // The DrupalService mapIncluded pattern is the reference — see DrupalService.ts
  // For simplicity in this script, re-fetch each sponsor's image via the relationships

  for (const sponsor of sponsors) {
    const imageRef = sponsor.relationships.field_media_image?.data;
    let logoAssetId: string | null = null;

    if (imageRef) {
      // Fetch the media entity to get the file URL
      const mediaRes = await fetch(
        drupalUrl(`media/image/${imageRef.id}?include=field_media_image`),
      );
      if (mediaRes.ok) {
        const mediaJson = (await mediaRes.json()) as {
          data: DrupalMediaImage;
          included?: DrupalFile[];
        };
        const file = mediaJson.included?.[0];
        if (file?.attributes.uri.url) {
          const fullUrl = file.attributes.uri.url.startsWith("http")
            ? file.attributes.uri.url
            : `${process.env.DRUPAL_BASE_URL}${file.attributes.uri.url}`;
          console.log(`  Uploading logo for ${sponsor.attributes.title}...`);
          logoAssetId = await uploadImageFromUrl(fullUrl);
        }
      }
    }

    await createDoc({
      _id: `sponsor-drupal-${sponsor.id}`,
      _type: "sponsor",
      name: sponsor.attributes.title,
      type: sponsor.attributes.field_type ?? "other",
      url: sponsor.attributes.field_website?.uri ?? null,
      active: sponsor.attributes.status,
      ...(logoAssetId
        ? {
            logo: {
              _type: "image",
              asset: { _type: "reference", _ref: logoAssetId },
            },
          }
        : {}),
    });

    console.log(`  Migrated: ${sponsor.attributes.title}`);
  }

  console.log("Sponsors migration complete.");
}

main().catch(console.error);
```

**Step 2: Run against staging**

```bash
cd scripts/drupal-to-sanity
SANITY_DATASET=staging pnpm migrate:sponsors
```

**Step 3: Verify in Studio**

Open Sanity Studio, switch dataset to `staging`, open Sponsors. Verify all sponsors appear with correct type and logo.

**Step 4: Commit**

```bash
git add scripts/drupal-to-sanity/src/migrate-sponsors.ts
git commit -m "feat(migration): add sponsor migration script (drupal to sanity)"
```

---

## Task 11: Migrate events

**Files:**

- Create: `scripts/drupal-to-sanity/src/migrate-events.ts`

**Step 1: Create migration script** (follows same pattern as Task 10, referencing `event.schema.ts`)

```typescript
// scripts/drupal-to-sanity/src/migrate-events.ts
import "dotenv/config";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

interface DrupalEvent {
  id: string;
  attributes: {
    title: string;
    status: boolean;
    field_daterange?: { value: string; end_value?: string } | null;
    field_event_link?: { uri?: string; title?: string } | null;
  };
  relationships: {
    field_media_image?: { data: { id: string } | null };
  };
}

interface DrupalFile {
  id: string;
  attributes: { uri: { url: string } };
}

async function main() {
  console.log("Fetching events from Drupal...");
  const events = await fetchAllPages<DrupalEvent>(
    drupalUrl(
      "node/event?include=field_media_image.field_media_image&filter[status]=1&page[limit]=50",
    ),
  );
  console.log(`Found ${events.length} events`);

  for (const ev of events) {
    const imageRef = ev.relationships.field_media_image?.data;
    let coverAssetId: string | null = null;

    if (imageRef) {
      const mediaRes = await fetch(
        drupalUrl(`media/image/${imageRef.id}?include=field_media_image`),
      );
      if (mediaRes.ok) {
        const mediaJson = (await mediaRes.json()) as {
          included?: DrupalFile[];
        };
        const file = mediaJson.included?.[0];
        if (file?.attributes.uri.url) {
          const fullUrl = file.attributes.uri.url.startsWith("http")
            ? file.attributes.uri.url
            : `${process.env.DRUPAL_BASE_URL}${file.attributes.uri.url}`;
          coverAssetId = await uploadImageFromUrl(fullUrl);
        }
      }
    }

    await createDoc({
      _id: `event-drupal-${ev.id}`,
      _type: "event",
      title: ev.attributes.title,
      dateStart:
        ev.attributes.field_daterange?.value ?? new Date().toISOString(),
      dateEnd: ev.attributes.field_daterange?.end_value ?? null,
      externalLink: ev.attributes.field_event_link?.uri
        ? {
            url: ev.attributes.field_event_link.uri,
            label: ev.attributes.field_event_link.title ?? ev.attributes.title,
          }
        : null,
      ...(coverAssetId
        ? {
            coverImage: {
              _type: "image",
              asset: { _type: "reference", _ref: coverAssetId },
            },
          }
        : {}),
    });

    console.log(`  Migrated: ${ev.attributes.title}`);
  }

  console.log("Events migration complete.");
}

main().catch(console.error);
```

**Step 2: Run and verify** (same pattern as Task 10)

```bash
SANITY_DATASET=staging pnpm migrate:events
```

**Step 3: Commit**

```bash
git add scripts/drupal-to-sanity/src/migrate-events.ts
git commit -m "feat(migration): add event migration script (drupal to sanity)"
```

---

## Task 12: Migrate articles

**Context:** Articles are the most complex migration — the `body.processed` HTML field needs to be converted to Sanity Portable Text. Images embedded in the body need to be uploaded to Sanity assets. Review migrated articles in Studio after running.

**Files:**

- Create: `scripts/drupal-to-sanity/src/migrate-articles.ts`

**Step 1: Install HTML → Portable Text converter**

```bash
pnpm --filter drupal-to-sanity add @portabletext/to-portable-text
```

**Step 2: Create migration script**

```typescript
// scripts/drupal-to-sanity/src/migrate-articles.ts
import "dotenv/config";
import { htmlToBlocks } from "@portabletext/to-portable-text";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

interface DrupalArticle {
  id: string;
  attributes: {
    title: string;
    status: boolean;
    path?: { alias?: string };
    body?: { processed?: string } | null;
    publish_on?: string | null;
    field_featured?: boolean;
  };
  relationships: {
    field_media_article_image?: { data: { id: string } | null };
    field_tags?: { data: Array<{ id: string }> };
  };
}

interface DrupalFile {
  id: string;
  attributes: { uri: { url: string } };
}
interface DrupalTerm {
  id: string;
  attributes: { name: string };
}

async function main() {
  console.log("Fetching articles from Drupal...");
  const articles = await fetchAllPages<DrupalArticle>(
    drupalUrl(
      "node/article?include=field_media_article_image.field_media_image,field_tags&filter[status]=1&sort=-publish_on&page[limit]=50",
    ),
  );
  console.log(`Found ${articles.length} articles`);

  for (const article of articles) {
    // Cover image
    const imageRef = article.relationships.field_media_article_image?.data;
    let coverAssetId: string | null = null;
    if (imageRef) {
      const mediaRes = await fetch(
        drupalUrl(`media/image/${imageRef.id}?include=field_media_image`),
      );
      if (mediaRes.ok) {
        const mediaJson = (await mediaRes.json()) as {
          included?: DrupalFile[];
        };
        const file = mediaJson.included?.[0];
        if (file?.attributes.uri.url) {
          const fullUrl = file.attributes.uri.url.startsWith("http")
            ? file.attributes.uri.url
            : `${process.env.DRUPAL_BASE_URL}${file.attributes.uri.url}`;
          coverAssetId = await uploadImageFromUrl(fullUrl);
        }
      }
    }

    // Tags
    const tags: string[] = [];
    for (const tagRef of article.relationships.field_tags?.data ?? []) {
      const termRes = await fetch(drupalUrl(`taxonomy_term/tags/${tagRef.id}`));
      if (termRes.ok) {
        const termJson = (await termRes.json()) as { data: DrupalTerm };
        tags.push(termJson.data.attributes.name);
      }
    }

    // Body: HTML → Portable Text
    const body = article.attributes.body?.processed
      ? htmlToBlocks(article.attributes.body.processed, {
          parseHtml: (html) =>
            new DOMParser().parseFromString(html, "text/html"),
        })
      : [];

    // Slug from Drupal path alias (/news/my-article → my-article)
    const slug =
      article.attributes.path?.alias?.replace("/news/", "") ?? article.id;

    await createDoc({
      _id: `article-drupal-${article.id}`,
      _type: "article",
      title: article.attributes.title,
      slug: { _type: "slug", current: slug },
      publishAt: article.attributes.publish_on ?? null,
      featured: article.attributes.field_featured ?? false,
      tags,
      body,
      ...(coverAssetId
        ? {
            coverImage: {
              _type: "image",
              asset: { _type: "reference", _ref: coverAssetId },
            },
          }
        : {}),
    });

    console.log(`  Migrated: ${article.attributes.title}`);
  }

  console.log(
    "Articles migration complete. IMPORTANT: Review rich text in Studio — HTML conversion may need manual cleanup.",
  );
}

main().catch(console.error);
```

**Step 3: Run against staging and review**

```bash
SANITY_DATASET=staging pnpm migrate:articles
```

Open Studio → Articles. Spot-check 5-10 articles. Look for:

- Broken rich text blocks
- Missing images in body
- Incorrect slugs

Fix any systematic issues in the script and re-run.

**Step 4: Commit**

```bash
git add scripts/drupal-to-sanity/src/migrate-articles.ts
git commit -m "feat(migration): add article migration script with html to portable text conversion"
```

---

## Task 13: Migrate staff

**Context:** Drupal staff are split across two types: `node--player` (coaches, stored as players with `field_position_short`: T1/T2/TK/TVJO/PDG/AF/CO) and `node--staff` (board members with `field_position_staff`). Both become `staffMember` in Sanity.

Reference: `apps/web/src/app/(main)/team/[slug]/utils.ts` — `transformStaffToMember()` for the role mapping logic.

**Files:**

- Create: `scripts/drupal-to-sanity/src/migrate-staff.ts`

**Step 1: Create migration script**

```typescript
// scripts/drupal-to-sanity/src/migrate-staff.ts
import "dotenv/config";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

const COACH_ROLE_MAP: Record<string, string> = {
  T1: "hoofdtrainer",
  T2: "assistent",
  TK: "keeperstrainer",
  TVJO: "tvjo",
  PDG: "ploegdelegatie",
  AF: "afgevaardigde",
  CO: "coach",
};

interface DrupalPlayer {
  id: string;
  attributes: {
    field_firstname?: string | null;
    field_lastname?: string | null;
    field_position_short?: string | null;
    field_birth_date?: string | null;
    field_join_date?: string | null;
  };
  relationships: { field_image?: { data: { id: string } | null } };
}

interface DrupalStaff {
  id: string;
  attributes: {
    field_firstname?: string | null;
    field_lastname?: string | null;
    field_position_staff?: string | null;
    field_position_short?: string | null;
    field_birth_date?: string | null;
    field_join_date?: string | null;
  };
  relationships: { field_image?: { data: { id: string } | null } };
}

interface DrupalFile {
  id: string;
  attributes: { uri: { url: string } };
}

async function resolveImage(
  ref: { id: string } | null | undefined,
): Promise<string | null> {
  if (!ref) return null;
  const mediaRes = await fetch(
    drupalUrl(`media/image/${ref.id}?include=field_media_image`),
  );
  if (!mediaRes.ok) return null;
  const mediaJson = (await mediaRes.json()) as { included?: DrupalFile[] };
  const file = mediaJson.included?.[0];
  if (!file?.attributes.uri.url) return null;
  const fullUrl = file.attributes.uri.url.startsWith("http")
    ? file.attributes.uri.url
    : `${process.env.DRUPAL_BASE_URL}${file.attributes.uri.url}`;
  return uploadImageFromUrl(fullUrl);
}

async function main() {
  // Migrate node--player coaching staff (those with a position_short role code)
  console.log("Fetching coaches (node--player with role codes) from Drupal...");
  const allPlayers = await fetchAllPages<DrupalPlayer>(
    drupalUrl(
      "node/player?include=field_image.field_media_image&page[limit]=100",
    ),
  );
  const coaches = allPlayers.filter(
    (p) =>
      p.attributes.field_position_short &&
      COACH_ROLE_MAP[p.attributes.field_position_short],
  );

  for (const coach of coaches) {
    const photoAssetId = await resolveImage(
      coach.relationships.field_image?.data,
    );
    const role =
      COACH_ROLE_MAP[coach.attributes.field_position_short ?? ""] ?? "other";

    await createDoc({
      _id: `staff-coach-${coach.id}`,
      _type: "staffMember",
      firstName: coach.attributes.field_firstname ?? "",
      lastName: coach.attributes.field_lastname ?? "",
      role,
      birthDate: coach.attributes.field_birth_date ?? null,
      joinDate: coach.attributes.field_join_date ?? null,
      ...(photoAssetId
        ? {
            photo: {
              _type: "image",
              asset: { _type: "reference", _ref: photoAssetId },
            },
          }
        : {}),
    });
    console.log(
      `  Migrated coach: ${coach.attributes.field_firstname} ${coach.attributes.field_lastname} (${role})`,
    );
  }

  // Migrate node--staff board members
  console.log("Fetching board staff (node--staff) from Drupal...");
  const boardMembers = await fetchAllPages<DrupalStaff>(
    drupalUrl(
      "node/staff?include=field_image.field_media_image&page[limit]=100",
    ),
  );

  for (const member of boardMembers) {
    const photoAssetId = await resolveImage(
      member.relationships.field_image?.data,
    );
    await createDoc({
      _id: `staff-board-${member.id}`,
      _type: "staffMember",
      firstName: member.attributes.field_firstname ?? "",
      lastName: member.attributes.field_lastname ?? "",
      role: "bestuur",
      birthDate: member.attributes.field_birth_date ?? null,
      joinDate: member.attributes.field_join_date ?? null,
      ...(photoAssetId
        ? {
            photo: {
              _type: "image",
              asset: { _type: "reference", _ref: photoAssetId },
            },
          }
        : {}),
    });
    console.log(
      `  Migrated board: ${member.attributes.field_firstname} ${member.attributes.field_lastname}`,
    );
  }

  console.log("Staff migration complete.");
}

main().catch(console.error);
```

**Step 2: Run against staging and verify**

```bash
SANITY_DATASET=staging pnpm migrate:staff
```

**Step 3: Commit**

```bash
git add scripts/drupal-to-sanity/src/migrate-staff.ts
git commit -m "feat(migration): add staff migration script (merges drupal node--player coaches + node--staff board)"
```

---

## Task 14: Switch sponsors page to Sanity

**Context:** First cutover. After verifying sponsors in Studio (staging and then production), update `apps/web` to read sponsors from `SanityService` instead of `DrupalService`.

**Files:**

- Modify: `apps/web/src/app/(main)/sponsors/page.tsx`
- Delete: `apps/web/src/lib/effect/schemas/sponsor.schema.ts`
- Modify: `apps/web/src/lib/effect/services/DrupalService.ts` (remove sponsor methods)

**Step 1: Run migration against production**

```bash
SANITY_DATASET=production pnpm migrate:sponsors
```

Verify in Studio (production dataset).

**Step 2: Update `sponsors/page.tsx`**

Open the file. Replace `DrupalService.getSponsors()` call with `SanityService.getSponsors()`. Map `SanitySponsor` fields to what the existing component expects. `logoUrl` from Sanity replaces the Drupal image URL.

**Step 3: Run tests**

```bash
pnpm --filter @kcvv/web test --run
```

Fix any test failures from the changed data shape.

**Step 4: Delete Drupal sponsor schema**

```bash
rm apps/web/src/lib/effect/schemas/sponsor.schema.ts
```

Remove its export from `apps/web/src/lib/effect/schemas/index.ts`. Remove `getSponsors` method from `DrupalService.ts`.

**Step 5: Run full check**

```bash
pnpm --filter @kcvv/web check-all
```

**Step 6: Commit**

```bash
git add apps/web/src/app/(main)/sponsors/ apps/web/src/lib/effect/services/DrupalService.ts
git rm apps/web/src/lib/effect/schemas/sponsor.schema.ts
git commit -m "feat(migration): switch sponsors page from drupal to sanity"
```

---

## Task 15: Switch events page to Sanity

Same pattern as Task 14. Files: `apps/web/src/app/(main)/events/page.tsx`, delete `event.schema.ts`.

Run `pnpm migrate:events` against production, update page, delete schema, run checks, commit:

```bash
git commit -m "feat(migration): switch events page from drupal to sanity"
```

---

## Task 16: Switch news/articles pages to Sanity

Same pattern. Files: `apps/web/src/app/(main)/news/page.tsx` and `apps/web/src/app/(main)/news/[slug]/page.tsx`. Delete `article.schema.ts`.

Run `pnpm migrate:articles` against production. Review article rich text on staging before promoting to production.

```bash
git commit -m "feat(migration): switch news pages from drupal to sanity"
```

---

## Task 17: Switch staff and organigram to Sanity

Same pattern. Files: `apps/web/src/app/(main)/club/organigram/page.tsx`, `apps/web/src/app/(main)/club/bestuur/page.tsx`, etc. Delete `staff.schema.ts`.

Update pages to use `SanityService.getStaffMembers()` — add this query if not yet in `SanityService`.

```bash
git commit -m "feat(migration): switch staff and organigram pages from drupal to sanity"
```

---

## Task 18: Switch team and player pages to Sanity

**Context:** This requires the cron sync to have run at least once (so players and teams exist in Sanity). Trigger a manual cron run via Cloudflare dashboard before switching.

**Files:**

- Modify: `apps/web/src/app/(main)/team/[slug]/page.tsx` and related
- Modify: `apps/web/src/app/(main)/players/[slug]/page.tsx` and related
- Modify: `apps/web/src/app/(main)/team/[slug]/utils.ts` (update transform functions for Sanity types)
- Delete: `apps/web/src/lib/effect/schemas/team.schema.ts`
- Delete: `apps/web/src/lib/effect/schemas/player.schema.ts`

**Step 1: Trigger manual cron run**

In Cloudflare dashboard → Workers → `kcvv-api` → Triggers → Cron Triggers → click "Run" on the scheduled trigger. Wait for completion. Verify players and teams appear in Sanity Studio.

**Step 2: Update team page**

Replace `DrupalService.getTeamBySlug()` with `SanityService.getTeamBySlug()`. Update `utils.ts` — the `transformPlayerToRoster` and `transformStaffToMember` functions need to accept `SanityPlayer` / `SanityStaffMember` instead of Drupal types. The field names change (e.g. `transparentImageUrl` instead of resolved `field_image.data.uri.url`).

**Step 3: Update player page**

Replace `DrupalService.getPlayerBySlug()` with `SanityService.getPlayerByPsdId()`. Note: player URLs currently use Drupal path alias slugs — these need to switch to `psdId`-based URLs, or a redirect layer is needed for old URLs.

**Step 4: Run tests and fix**

```bash
pnpm --filter @kcvv/web test --run
pnpm --filter @kcvv/web check-all
```

**Step 5: Delete Drupal schemas**

```bash
rm apps/web/src/lib/effect/schemas/team.schema.ts
rm apps/web/src/lib/effect/schemas/player.schema.ts
```

**Step 6: Commit**

```bash
git commit -m "feat(migration): switch team and player pages from drupal to sanity"
```

---

## Task 19: Decommission DrupalService

**Context:** Once all pages are cut over, delete remaining Drupal infrastructure from `apps/web`.

**Files:**

- Delete: `apps/web/src/lib/effect/services/DrupalService.ts`
- Delete: `apps/web/src/lib/effect/services/DrupalService.test.ts`
- Delete: `apps/web/src/lib/utils/drupal-content.ts`
- Delete: `apps/web/src/lib/utils/drupal-content.test.ts`
- Delete remaining Drupal schema files: `common.schema.ts`, `media.schema.ts`, `file.schema.ts`, `taxonomy.schema.ts`, `router.schema.ts`, `errors.schema.ts`
- Modify: `apps/web/src/lib/effect/schemas/index.ts` (remove Drupal exports)

**Step 1: Verify nothing imports DrupalService**

```bash
grep -r "DrupalService\|drupal-content\|common.schema\|media.schema\|file.schema\|taxonomy.schema" apps/web/src --include="*.ts" --include="*.tsx" | grep -v ".test."
```

Expected: no results. If any remain, fix those imports first.

**Step 2: Delete all Drupal files**

```bash
git rm apps/web/src/lib/effect/services/DrupalService.ts
git rm apps/web/src/lib/effect/services/DrupalService.test.ts
git rm apps/web/src/lib/utils/drupal-content.ts
git rm apps/web/src/lib/utils/drupal-content.test.ts
git rm apps/web/src/lib/effect/schemas/common.schema.ts
git rm apps/web/src/lib/effect/schemas/media.schema.ts
git rm apps/web/src/lib/effect/schemas/file.schema.ts
git rm apps/web/src/lib/effect/schemas/taxonomy.schema.ts
git rm apps/web/src/lib/effect/schemas/router.schema.ts
git rm apps/web/src/lib/effect/schemas/errors.schema.ts
```

**Step 3: Remove DRUPAL_BASE_URL from Vercel**

In Vercel dashboard → Project → Settings → Environment Variables — remove `DRUPAL_BASE_URL` from all environments (production, preview, development).

**Step 4: Run full test suite and build**

```bash
pnpm --filter @kcvv/web check-all
pnpm turbo build --filter=@kcvv/web
```

Expected: all passing, no Drupal references.

**Step 5: Commit**

```bash
git commit -m "feat(migration): decommission DrupalService and all drupal schemas"
```

**Step 6: Update issue #724 and CLAUDE.md**

- Close issue #724 on GitHub: `gh issue close 724 --comment "Phase 3 complete — all content served from Sanity, DrupalService deleted"`
- Update the Current State table in `CLAUDE.md` to mark Phase 3 as Done
- Cancel Drupal hosting

---

## Final checklist

- [ ] Sanity Studio deployed and accessible
- [ ] All 7 schema types visible in Studio
- [ ] "Needs enrichment" player view working
- [ ] Nightly cron running — verify in Cloudflare dashboard logs
- [ ] Players and teams appear in Studio after first cron run
- [ ] All migration scripts run against production
- [ ] All 5 content types serving from Sanity on live site
- [ ] No Drupal imports remain in `apps/web`
- [ ] `DRUPAL_BASE_URL` removed from Vercel
- [ ] Issue #724 closed
- [ ] Drupal hosting cancelled
