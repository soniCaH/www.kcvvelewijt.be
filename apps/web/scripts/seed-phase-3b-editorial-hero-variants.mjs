#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-3b-editorial-hero-variants.mjs
 *
 * Creates (or updates) one tracer article per <EditorialHero> variant
 * locked in Phase 3 §5.B.2 (#1638) on Sanity staging:
 *
 *   - announcement → article-phase-3b-announcement-tracer
 *   - transfer     → article-phase-3b-transfer-tracer (incoming)
 *   - event        → article-phase-3b-event-tracer
 *   - interview    → article-phase-3b-interview-tracer
 *
 * Each tracer carries:
 *   - `title` as constrained Portable Text (single block, accent
 *     decorator on one word — "kantine" / "Standard" / "feest" / "Maxim")
 *   - `lead` field populated (post Ask 1)
 *   - `coverImage` referenced (post Ask 8 required)
 *   - body block matching the variant (transferFact / eventFact /
 *     subjects[] etc.)
 *
 * Idempotent — fixed _ids; re-running updates instead of duplicating.
 *
 * Usage:
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-3b-editorial-hero-variants.mjs
 *
 * Or with `sanity login` already done:
 *   node scripts/seed-phase-3b-editorial-hero-variants.mjs
 *
 * Revert:
 *   for slug in announcement transfer event interview; do
 *     sanity documents delete --dataset=staging article-phase-3b-${slug}-tracer
 *   done
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed Phase 3 B tracers into production — staging only. " +
      "Re-run with SANITY_DATASET=staging, or set SANITY_ALLOW_PRODUCTION=1 " +
      "if you truly meant to write to prod.",
  );
  process.exit(1);
}

// Stable cover-image placeholder reused across all four tracers — the
// same asset the Phase-5 transfer tracer used. Visual consistency with
// existing fixtures and avoids orphaning new uploads.
const COVER_IMAGE_ASSET_REF =
  "image-902b92c6fbed708cec758ed4f5848f0f3d848416-350x350-jpg";

function resolveToken() {
  if (process.env.SANITY_API_TOKEN) return process.env.SANITY_API_TOKEN;
  try {
    const configPath = join(homedir(), ".config", "sanity", "config.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (config.authToken) return config.authToken;
  } catch {
    /* fall through */
  }
  console.error(
    "No Sanity auth token found. Set SANITY_API_TOKEN or run `sanity login`.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  token: resolveToken(),
  useCdn: false,
});

function imageRef(ref) {
  return { _type: "image", asset: { _type: "reference", _ref: ref } };
}

/**
 * Build a constrained Portable Text title with one `accent` span. The
 * shape mirrors the Studio's expected output post Ask-9: single block,
 * normal style, no annotations, accent decorator on the highlighted
 * word(s) only.
 */
function makePtTitle({ before, accent, after, key }) {
  const children = [];
  if (before) {
    children.push({
      _type: "span",
      _key: `${key}-pre`,
      text: before,
      marks: [],
    });
  }
  children.push({
    _type: "span",
    _key: `${key}-acc`,
    text: accent,
    marks: ["accent"],
  });
  if (after) {
    children.push({
      _type: "span",
      _key: `${key}-post`,
      text: after,
      marks: [],
    });
  }
  return [
    {
      _type: "block",
      _key: `${key}-block`,
      style: "normal",
      markDefs: [],
      children,
    },
  ];
}

function paragraph(key, text) {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  };
}

const NOW = new Date().toISOString();

const announcement = {
  _id: "article-phase-3b-announcement-tracer",
  _type: "article",
  articleType: "announcement",
  title: makePtTitle({
    before: "De ",
    accent: "kantine",
    after: " blijft open",
    key: "ann",
  }),
  slug: { _type: "slug", current: "phase-3b-announcement-tracer" },
  publishedAt: NOW,
  featured: false,
  tags: ["Tracer"],
  lead: "Korte samenvatting boven de mededeling — ondersteunt homepage, news cards, hero en social shares.",
  coverImage: imageRef(COVER_IMAGE_ASSET_REF),
  body: [
    paragraph(
      "ann-p1",
      "Bestuur deelt mee dat de kantine ook tijdens de winterstop dagelijks geopend blijft.",
    ),
    paragraph(
      "ann-p2",
      "Reservaties gaan via het clubsecretariaat; voor groepsboekingen contacteer Lien.",
    ),
  ],
};

const transfer = {
  _id: "article-phase-3b-transfer-tracer",
  _type: "article",
  articleType: "transfer",
  title: makePtTitle({
    before: "Maxim komt over van ",
    accent: "Standard",
    after: "",
    key: "tra",
  }),
  slug: { _type: "slug", current: "phase-3b-transfer-tracer" },
  publishedAt: NOW,
  featured: false,
  tags: ["Tracer", "Transfer"],
  lead: "De 27-jarige middenvelder versterkt de zes voor drie seizoenen. Jeugdig leiderschap voorop.",
  coverImage: imageRef(COVER_IMAGE_ASSET_REF),
  body: [
    {
      _type: "transferFact",
      _key: "tra-fact",
      direction: "incoming",
      playerName: "Maxim Breugelmans",
      position: "Middenvelder",
      age: 27,
      otherClubName: "Standard Luik",
      otherClubContext: "Jupiler Pro League · U23",
      kcvvContext: "Derde Amateur · A-ploeg · #8",
      note: "Hier kan ik tonen wat ik in mij heb. KCVV ademt voetbal — dat zegt me alles.",
      noteAttribution: "Maxim Breugelmans",
    },
    paragraph(
      "tra-p1",
      "De aankondiging volgt op weken van gesprekken tussen sportief manager en de speler.",
    ),
  ],
};

const event = {
  _id: "article-phase-3b-event-tracer",
  _type: "article",
  articleType: "event",
  title: makePtTitle({
    before: "Drie dagen ",
    accent: "feest",
    after: " in de kantine",
    key: "evt",
  }),
  slug: { _type: "slug", current: "phase-3b-event-tracer" },
  publishedAt: NOW,
  featured: false,
  tags: ["Tracer", "Clubfeest"],
  lead: "Vrijdag, zaterdag en zondag — telkens vanaf de middag tot wanneer de laatste fan vertrekt.",
  coverImage: imageRef(COVER_IMAGE_ASSET_REF),
  body: [
    {
      _type: "eventFact",
      _key: "evt-fact",
      title: "Steakfestijn 2026",
      sessions: [
        {
          _key: "evt-s1",
          date: "2026-11-14",
          startTime: "12:00",
          endTime: "23:00",
        },
        {
          _key: "evt-s2",
          date: "2026-11-15",
          startTime: "12:00",
          endTime: "23:00",
        },
        {
          _key: "evt-s3",
          date: "2026-11-16",
          startTime: "12:00",
          endTime: "20:00",
        },
      ],
      location: "Clubhuis KCVV",
      address: "Driesstraat 14 · 1982 Elewijt",
      capacity: 120,
      ticketUrl: "https://kcvv.example/inschrijven",
      ticketLabel: "Inschrijven",
    },
    paragraph(
      "evt-p1",
      "Drie volle dagen vlees van de grill, frietjes uit de pan, en het kampioenenelftal in de zaal.",
    ),
  ],
};

const interview = {
  _id: "article-phase-3b-interview-tracer",
  _type: "article",
  articleType: "interview",
  title: makePtTitle({
    before: "Een gesprek met ",
    accent: "Maxim",
    after: "",
    key: "int",
  }),
  slug: { _type: "slug", current: "phase-3b-interview-tracer" },
  publishedAt: NOW,
  featured: false,
  tags: ["Tracer", "Interview"],
  lead: "Dertiende seizoen in groen-wit. Over routine, geduld, en de tweede paal.",
  coverImage: imageRef(COVER_IMAGE_ASSET_REF),
  subjects: [
    {
      _key: "int-sub-1",
      _type: "subject",
      kind: "custom",
      customName: "Maxim Breugelmans",
      customRole: "Middenvelder · A-ploeg",
    },
  ],
  body: [
    paragraph(
      "int-p1",
      "Op een rustige dinsdagavond in het clubhuis vraagt iemand om koffie. Het kopje van Maxim staat al op tafel.",
    ),
    {
      _type: "qaBlock",
      _key: "int-qa",
      pairs: [
        {
          _key: "int-qa-1",
          _type: "qaPair",
          tag: "key",
          question: "Wat trok je naar Elewijt?",
          answer: [
            {
              _type: "block",
              _key: "int-qa-1-a",
              style: "normal",
              markDefs: [],
              children: [
                {
                  _type: "span",
                  _key: "int-qa-1-as",
                  text: "KCVV ademt voetbal. Hier kan ik tonen wat ik in mij heb.",
                  marks: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

async function upsert(doc) {
  const result = await client.createOrReplace(doc);
  console.log(
    `✓ ${doc.articleType.padEnd(13)} — ${result._id} → /nieuws/${doc.slug.current}`,
  );
}

async function main() {
  console.log(`Seeding Phase 3 B tracers into ${DATASET}…\n`);
  await upsert(announcement);
  await upsert(transfer);
  await upsert(event);
  await upsert(interview);
  console.log("\nDone. URLs:");
  for (const slug of [
    announcement.slug.current,
    transfer.slug.current,
    event.slug.current,
    interview.slug.current,
  ]) {
    console.log(`  https://www-kcvvelewijt-be-git-feat-issue-1638.vercel.app/nieuws/${slug}`);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
