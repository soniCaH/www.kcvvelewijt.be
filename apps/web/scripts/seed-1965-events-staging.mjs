#!/usr/bin/env node
/*
 * apps/web/scripts/seed-1965-events-staging.mjs
 *
 * Phase 6.E (#1965) — seed example `event` documents for the /evenementen list,
 * covering every visual use-case so the month-grouped list + <TicketStub> can be
 * reviewed against real Sanity data:
 *   - all four eventTypes (Clubevent / Supportersactiviteit / Jeugdwerking /
 *     Andere) + one with NO eventType (render-time "Andere" fallback)
 *   - timed, all-day (Brussels-midnight), and multi-day events
 *   - with / without location, with / without externalLink
 *   - spread across five months + a year boundary (so the month headings show
 *     the year suffix)
 *
 * Run (from repo root):
 *   pnpm --filter @kcvv/web exec node scripts/seed-1965-events-staging.mjs
 *
 * Env:
 *   SANITY_API_TOKEN  — write token (falls back to ~/.config/sanity/config.json)
 *   SANITY_DATASET    — defaults to "staging"; refuses prod unless
 *                       SANITY_ALLOW_PRODUCTION=1
 *
 * Idempotent: createOrReplace on stable `event-seed-1965-*` ids. Cleanup — delete
 * those ids in Studio, or `*[_id match "event-seed-1965-*"]`.
 */
import { assertProductionGuard, makeClient } from "./seeds/phase-5-shared.mjs";

assertProductionGuard();
const client = makeClient();

const slug = (current) => ({ _type: "slug", current });

const events = [
  // 1. Clubevent · timed · location + externalLink (Reserveer CTA on detail).
  {
    _id: "event-seed-1965-spaghetti-avond",
    _type: "event",
    title: "Spaghetti-avond",
    slug: slug("spaghetti-avond-2026"),
    eventType: "Clubevent",
    dateStart: "2026-09-12T18:00:00Z",
    location: "Kantine KCVV, Driesstraat 14, Elewijt",
    externalLink: {
      url: "https://kcvvelewijt.be/reserveer/spaghetti-avond",
      label: "Reserveer",
    },
    featuredOnHome: false,
  },
  // 2. Supportersactiviteit · multi-day · location (meta shows a day range).
  {
    _id: "event-seed-1965-supportersweekend",
    _type: "event",
    title: "Supportersweekend Ardennen",
    slug: slug("supportersweekend-2026"),
    eventType: "Supportersactiviteit",
    dateStart: "2026-09-25T07:00:00Z",
    dateEnd: "2026-09-27T18:00:00Z",
    location: "La Roche-en-Ardenne",
    featuredOnHome: false,
  },
  // 3. Jeugdwerking · all-day · location (00:00 Brussels → time omitted).
  {
    _id: "event-seed-1965-opendeurdag-jeugd",
    _type: "event",
    title: "Opendeurdag jeugd",
    slug: slug("opendeurdag-jeugd-2026"),
    eventType: "Jeugdwerking",
    // 2026-10-10T22:00Z === 2026-10-11T00:00 in Brussels (CEST).
    dateStart: "2026-10-10T22:00:00Z",
    location: "Sportpark Driesput, Elewijt",
    featuredOnHome: false,
  },
  // 4. NO eventType · timed · no location (render-time "Andere" fallback).
  {
    _id: "event-seed-1965-ledenvergadering",
    _type: "event",
    title: "Algemene ledenvergadering",
    slug: slug("ledenvergadering-2026"),
    dateStart: "2026-10-23T18:30:00Z",
    featuredOnHome: false,
  },
  // 5. Clubevent · timed · location (second month for grouping).
  {
    _id: "event-seed-1965-mosselfestijn",
    _type: "event",
    title: "Mosselfestijn",
    slug: slug("mosselfestijn-2026"),
    eventType: "Clubevent",
    dateStart: "2026-11-14T17:00:00Z",
    location: "Kantine KCVV, Elewijt",
    featuredOnHome: false,
  },
  // 6. Supportersactiviteit · timed · location (December).
  {
    _id: "event-seed-1965-kerstdrink",
    _type: "event",
    title: "Kerstdrink",
    slug: slug("kerstdrink-2026"),
    eventType: "Supportersactiviteit",
    dateStart: "2026-12-19T18:00:00Z",
    location: "Kantine KCVV, Elewijt",
    featuredOnHome: false,
  },
  // 7. Andere · timed · location (next year → triggers the year-suffix labels).
  {
    _id: "event-seed-1965-nieuwjaarsreceptie",
    _type: "event",
    title: "Nieuwjaarsreceptie",
    slug: slug("nieuwjaarsreceptie-2027"),
    eventType: "Andere",
    dateStart: "2027-01-09T18:00:00Z",
    location: "Kantine KCVV, Elewijt",
    featuredOnHome: false,
  },
];

async function run() {
  for (const doc of events) {
    const res = await client.createOrReplace(doc);
    console.log(`✓ ${res._id}  →  /evenementen/${doc.slug.current}`);
  }
  console.log(
    `\nSeeded ${events.length} events into "${client.config().dataset}".`,
  );
  console.log("View: https://staging.kcvvelewijt.be/evenementen");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
