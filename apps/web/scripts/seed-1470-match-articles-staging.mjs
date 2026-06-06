#!/usr/bin/env node
/*
 * apps/web/scripts/seed-1470-match-articles-staging.mjs
 *
 * #1470 staging seed — the two new article variants, each linked to a REAL
 * PSD match so the score-forward hero (crest·score·crest bar) and the recap
 * Doelpunten roll-call render against live BFF data:
 *
 *   - matchPreview → linkedMatch 3414 (KCVV Elewijt vs K Londerzeel Sk,
 *     2026-07-26, Beker van Vlaanderen, scheduled → kickoff time, no badge)
 *   - matchRecap   → linkedMatch 2775 (Kfc De Kempen Tielen 1-0 KCVV Elewijt,
 *     2026-04-26, Competitie, finished → score + FT badge + Doelpunten)
 *
 * Both ids resolve via BffService.getMatchDetail. `is_home` is null on that
 * endpoint, so KCVV side is derived from the club id (1235) — recap 2775 has
 * KCVV away, so the away crest gets the jersey-deep ring.
 *
 * Standalone usage (staging is the default dataset):
 *   SANITY_API_TOKEN=<token> node scripts/seed-1470-match-articles-staging.mjs
 */

import {
  COVER_IMAGE_ASSET_REF,
  PUBLISHED_AT,
  assertProductionGuard,
  imageRef,
  makeClient,
  paragraph,
  ptTitle,
  stagingUrl,
} from "./seeds/phase-5-shared.mjs";

// ─── Article 1 — matchPreview (linkedMatch 3414) ────────────────────────────

function buildMatchPreview() {
  return {
    _id: "article-1470-match-preview",
    _type: "article",
    articleType: "matchPreview",
    linkedMatch: "3414",
    title: ptTitle({
      before: "Bekeropener tegen ",
      accent: "Londerzeel",
      after: "",
      key: "mp-title",
    }),
    slug: { _type: "slug", current: "1470-voorbeschouwing-londerzeel" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["A-ploeg", "Beker"],
    author: "Redactie",
    lead: "KCVV opent het seizoen meteen met een stevige bekerpartij tegen tweedenationaler K Londerzeel SK.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      paragraph(
        "mp-p1",
        "De eerste officiële afspraak van het seizoen is er meteen eentje om naar uit te kijken: in de Beker van Vlaanderen ontvangt KCVV het hoger spelende K Londerzeel SK op het sportpark.",
      ),
      paragraph(
        "mp-p2",
        "Voor de groep is het een ideale graadmeter na de voorbereiding. De staf rekent op een volle Driesstraat om de jongens naar een stunt te duwen.",
      ),
      paragraph(
        "mp-p3",
        "De aftrap is voorzien om 15u00. Wie er niet bij kan zijn, volgt de uitslag achteraf op de wedstrijdpagina.",
      ),
    ],
  };
}

// ─── Article 2 — matchRecap (linkedMatch 2775) ──────────────────────────────

function buildMatchRecap() {
  return {
    _id: "article-1470-match-recap",
    _type: "article",
    articleType: "matchRecap",
    linkedMatch: "2775",
    title: ptTitle({
      before: "Nipt onderuit in ",
      accent: "Tielen",
      after: "",
      key: "mr-title",
    }),
    slug: { _type: "slug", current: "1470-matchverslag-kempen-tielen" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["A-ploeg", "Competitie"],
    author: "Redactie",
    lead: "Eén counter in de tweede helft volstond voor De Kempen: KCVV verliest met 1-0 op het veld van Tielen-Lichtaart.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    body: [
      paragraph(
        "mr-p1",
        "In een evenwichtige partij waren de echte kansen schaars. KCVV controleerde lange tijd, maar miste de scherpte voorin om de thuisploeg echt in de problemen te brengen.",
      ),
      paragraph(
        "mr-p2",
        "Net na het uur besliste Senne Dierckx de partij met de enige treffer van de namiddag. Het antwoord van de bezoekers bleef ondanks een slotoffensief uit.",
      ),
      paragraph(
        "mr-p3",
        "Een zuinige nederlaag op verplaatsing, waarmee het seizoen wordt afgesloten. De focus gaat nu naar de voorbereiding op de nieuwe jaargang.",
      ),
    ],
  };
}

// ─── Module entry ────────────────────────────────────────────────────────────

export async function seed(client) {
  const docs = [
    { key: "match-preview", doc: buildMatchPreview() },
    { key: "match-recap", doc: buildMatchRecap() },
  ];

  const results = [];
  for (const { key, doc } of docs) {
    await client.createOrReplace(doc);
    const slug = doc.slug.current;
    console.log(
      `  ✓ ${key.padEnd(14)} → /nieuws/${slug}  (linkedMatch ${doc.linkedMatch})`,
    );
    results.push({ key, articleId: doc._id, slug, linkedMatch: doc.linkedMatch });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  assertProductionGuard();
  const client = makeClient();
  console.log(`Seeding #1470 match articles into ${client.config().dataset}…`);
  const results = await seed(client);
  console.log("\nDone:");
  for (const { slug, articleId, linkedMatch } of results) {
    console.log(`  ${stagingUrl(slug)}  [${articleId}] → match ${linkedMatch}`);
  }
}
