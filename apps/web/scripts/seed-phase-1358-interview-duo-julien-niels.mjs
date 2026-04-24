#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-1358-interview-duo-julien-niels.mjs
 *
 * Creates (or updates) the N=2 (duo) interview tracer on Sanity staging
 * for #1358. This is the first multi-subject interview on the system —
 * real editorial content from two retiring B-ploeg players (Julien Gillade
 * and Niels Gosselin), not a synthetic fixture.
 *
 * Why real content?
 * - Validates editor authoring ergonomics (RespondentPicker scoped to
 *   subjects[], per-pair respondentKey, Studio required validator).
 * - Validates per-pair attribution rendering across player kinds.
 * - Validates the side-by-side hero with actual PSD portraits.
 * - Gives QA a reference to compare against when hand-authoring future
 *   duo interviews.
 *
 * Idempotent — uses a fixed `_id` so re-running the script updates the
 * existing document instead of creating duplicates. Subject `_key`s are
 * also fixed so `respondentKey` refs on body qaPairs survive re-runs.
 *
 * Must-fix spelling corrections (from
 * `fixtures/interview-duo-julien-niels/spelling-suggestions.md`) are
 * applied below. Medium-priority items are queued for editor review.
 *
 * Usage (from `apps/web` so `@sanity/client` resolves via the workspace):
 *
 *   # Token: either set SANITY_API_TOKEN or rely on `sanity login` in ~/.config/sanity/config.json.
 *   # Dataset: SANITY_DATASET defaults to "staging".
 *   # Production guard: production writes require SANITY_ALLOW_PRODUCTION=1.
 *
 *   SANITY_API_TOKEN=<write-token> node scripts/seed-phase-1358-interview-duo-julien-niels.mjs
 *   SANITY_DATASET=production SANITY_ALLOW_PRODUCTION=1 node scripts/seed-phase-1358-interview-duo-julien-niels.mjs
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-1358-interview-duo-julien-niels
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-1358-interview-duo-julien-niels";
const SLUG = "afscheid-duo-julien-en-niels-zes-seizoenen-b-ploeg";
// Stable publishAt in the past so (a) re-running the seed doesn't bump
// the article's publication time on staging (idempotency) and (b) the
// article passes the `publishAt <= now()` filter on the news overview
// immediately. Pick a date that predates the PR's staging deploy.
const PUBLISH_AT = "2026-04-23T10:00:00.000Z";

// Stable subject _keys — must match the `respondentKey` values on
// body[].qaPair entries so the RespondentPicker resolution works on
// re-runs. Never change once published.
const KEY_JULIEN = "julien-k";
const KEY_NIELS = "niels-k";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the duo interview tracer into production — this " +
      "article is staging-only. Re-run with SANITY_DATASET=staging, or set " +
      "SANITY_ALLOW_PRODUCTION=1 if you truly meant to write to prod.",
  );
  process.exit(1);
}

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

// ─── PortableText helpers ─────────────────────────────────────────────────

let blockCounter = 0;
const nextKey = () => `blk-${++blockCounter}`;

/** Plain paragraph block with no marks. */
const p = (text) => ({
  _type: "block",
  _key: nextKey(),
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: nextKey(), text, marks: [] }],
});

/** Paragraph with a bold speaker prefix then regular prose. */
const attributedP = (speaker, text) => ({
  _type: "block",
  _key: nextKey(),
  style: "normal",
  markDefs: [],
  children: [
    { _type: "span", _key: nextKey(), text: `${speaker} `, marks: ["strong"] },
    { _type: "span", _key: nextKey(), text, marks: [] },
  ],
});

// ─── Q&A pair builders ───────────────────────────────────────────────────

let pairCounter = 0;
const nextPairKey = () => `pair-${++pairCounter}`;

const pair = ({ question, answer, tag, respondentKey }) => {
  const entry = {
    _key: nextPairKey(),
    _type: "qaPair",
    question,
    answer,
    tag,
  };
  if (respondentKey) entry.respondentKey = respondentKey;
  return entry;
};

// ─── Lookup: resolve player docs by firstName + lastName ─────────────────

async function resolvePlayer(firstName, lastName) {
  const docs = await client.fetch(
    `*[_type == "player" && firstName == $first && lastName == $last]{_id, firstName, lastName, jerseyNumber}`,
    { first: firstName, last: lastName },
  );
  if (!Array.isArray(docs) || docs.length === 0) {
    console.error(
      `Player not found: ${firstName} ${lastName}. Make sure the player documents exist in the ${DATASET} dataset before seeding.`,
    );
    process.exit(1);
  }
  if (docs.length > 1) {
    console.error(
      `Player name collision in ${DATASET}: multiple documents match ${firstName} ${lastName}. Refusing to pick an arbitrary one — the seed's respondentKey would point at a specific subject.`,
    );
    for (const hit of docs) {
      console.error(`  · ${hit._id} (#${hit.jerseyNumber ?? "?"})`);
    }
    process.exit(1);
  }
  return docs[0];
}

// ─── Main seed payload ───────────────────────────────────────────────────

async function main() {
  console.log(
    `Seeding duo interview (${ARTICLE_ID}) into ${DATASET} / ${PROJECT_ID}…`,
  );

  const julien = await resolvePlayer("Julien", "Gillade");
  const niels = await resolvePlayer("Niels", "Gosselin");

  console.log(
    ` · Resolved Julien Gillade → ${julien._id} (#${julien.jerseyNumber})`,
  );
  console.log(
    ` · Resolved Niels Gosselin → ${niels._id} (#${niels.jerseyNumber})`,
  );

  const pairs = [
    // Q1 — Both 3-word self-descriptions.
    pair({
      question: "In drie woorden: wie ben jij op het veld?",
      tag: "standard",
      answer: [
        attributedP(
          "Julien",
          "Communicatief en positief op het veld, helpend naar ploegmaten — en een klein beetje zagen.",
        ),
        attributedP("Niels", "Slechtste verliezer ooit."),
      ],
    }),

    // Q2 — Sterkste punt B-ploeg (both).
    pair({
      question:
        "Wat is het sterkste punt van deze B-ploeg dat een buitenstaander niet meteen ziet?",
      tag: "standard",
      answer: [
        attributedP(
          "Julien",
          "De sfeer van de ploeg buiten de matchen. Dit is echt een vriendengroep die aan elkaar samenhangt en wanneer mogelijk tijd samen doorbrengt.",
        ),
        attributedP(
          "Niels",
          "Hier hoef ik absoluut niet lang over na te denken: de sfeer binnen het team, die onze tegenstander nooit heeft kunnen evenaren.",
        ),
      ],
    }),

    // KEY — Niels's signature phrase (ties back to the club motto).
    pair({
      question: "Wat is het sterkste punt van deze B-ploeg?",
      tag: "key",
      respondentKey: KEY_NIELS,
      answer: [p("De plezantste Compagnie.")],
    }),

    // Q3 — Mooiste herinnering (both).
    pair({
      question: "Mooiste herinnering in zes seizoenen B-ploeg?",
      tag: "standard",
      answer: [
        attributedP(
          "Julien",
          "Bijna kampioen worden met de B-ploeg — 69 punten op de tweede plaats, 1 punt te kort.",
        ),
        attributedP(
          "Niels",
          "De 3-2 tegen Perk in de allerlaatste seconden. Het was lichtjes aan het sneeuwen en het veld lag er glad bij. Op het einde van de match pluk ik de bal op een hoge voorzet, zie Kjelle vertrekken op de linkerflank en gooi de bal in zijn loop. Een speler van Perk probeert te onderscheppen, maar de bal schiet door de sneeuw sneller door dan verwacht. Kjelle komt 1 op 1 met de keeper en maakt koelbloedig af. Ontlading tot en met — een rechtstreekse concurrent uit het klassement.",
        ),
      ],
    }),

    // QUOTE — Niels's dramatic closer on the Perk goal.
    pair({
      question: "De 3-2 tegen Perk",
      tag: "quote",
      respondentKey: KEY_NIELS,
      answer: [p("Hiervoor speel je voetbal.")],
    }),

    // Q4 — Moment buiten het veld.
    pair({
      question:
        "Welk moment buiten het veld (kleedkamer, verplaatsing, etentje) blijft je het levendigst bij?",
      tag: "standard",
      answer: [
        attributedP(
          "Julien",
          "We hebben in zes jaar tijd heel wat mooie momenten gehad — etentjes, feestjes en elk jaar op weekend met de ploeg. Eén moment kiezen is niet mogelijk.",
        ),
        attributedP(
          "Niels",
          'Elk jaar gingen we op "stage". We camoufleerden het onder die naam, maar ik denk niet dat we ooit een bal hebben aangeraakt. Op Mallorca hebben we elk café, elke taxi en elk hotel laten horen hoe goed wij Adel, Clouseau en Mama\'s Jasje konden zingen.',
        ),
      ],
    }),

    // Q5 — Over elkaar. TWO consecutive key pairs exercise the per-pair
    // respondent swap — Julien about Niels, then Niels about Julien.
    pair({
      question:
        "Wat valt je als eerste op aan Niels wanneer die de kleedkamer binnenwandelt?",
      tag: "key",
      respondentKey: KEY_JULIEN,
      answer: [
        p(
          "Nillie komt altijd binnen met zijn goede humeur en vol grapjes — ik zit dan meestal te lachen als hij binnenkomt.",
        ),
      ],
    }),
    pair({
      question: "En aan Julien?",
      tag: "key",
      respondentKey: KEY_NIELS,
      answer: [
        p(
          "Jul komt bij elke training op exact dezelfde manier aan: rugzakje aan, handen in de zakken en met een kleine glimlach op zijn gezicht.",
        ),
      ],
    }),

    // Q6 — Kwaliteit van de ander (both, standard).
    pair({
      question: "Welke kwaliteit van de ander zou je zelf graag hebben?",
      tag: "standard",
      answer: [
        attributedP(
          "Julien",
          "Nillie is onder de lat zeer goed met reflexen en in de 1-op-1 — het jaar dat wij bijna kampioen speelden, had hij de meeste cleansheets van de hele reeks. Een goede indicatie van hoe goed hij is als keeper. Buiten het veld zou ik toch voor zijn gevoel voor humor gaan.",
        ),
        attributedP(
          "Niels",
          "Onze Jul — drie dingen die hem typeren: dribbelen, snelheid en een goeie linker. Hij is een van de spelers van de afgelopen jaren die zijn tegenstander misschien wel het makkelijkst kon voorbijgaan.",
        ),
      ],
    }),

    // Q7 — Reünie verhaal. Standard for both Q+A, then a Niels quote.
    pair({
      question:
        "Over twintig jaar zitten jullie samen op een reünie. Welk verhaal over de ander vertel je sowieso opnieuw?",
      tag: "standard",
      answer: [
        attributedP(
          "Julien",
          "Een paar jaar geleden vroeg er iemand in onze WhatsApp-groep waar Het Steen was. Nillie kon niet geloven dat de mensen 't Steen niet kenden. Hij antwoordde toen: 'links en de steenweg af'. Dat was een moment waar iedereen in de groep om kon lachen, en het gaat tot op vandaag nog mee als inside joke.",
        ),
      ],
    }),

    // QUOTE — Niels's "halfdood geschopt" moment.
    pair({
      question: "Over Jul op het veld",
      tag: "quote",
      respondentKey: KEY_NIELS,
      answer: [
        p(
          "Een van de honderden keren dat Jul zich liet vallen alsof hij halfdood geschopt werd, en na 2 minuten verder speelde alsof er niets aan de hand was.",
        ),
      ],
    }),

    // Q8 — Niels solo. Standard (no attribution rendered).
    pair({
      question:
        "Als keeper sta je letterlijk en figuurlijk vaak apart van de rest. Hoe ervaar je dat in een B-ploeg-sfeer?",
      tag: "standard",
      answer: [
        p(
          "Bij de B-ploeg ga je je nooit anders of buitengesloten voelen. Iedereen hoort erbij, iedereen wordt erbij betrokken — dus de sfeer is te danken aan iedereen, ja ook de keeper.",
        ),
      ],
    }),

    // Q9 — Niels's RC Meldert save. KEY with Niels's cutout.
    pair({
      question: "10.163 minuten onder de lat. Is er een save die nog regelmatig door je hoofd spookt?",
      tag: "key",
      respondentKey: KEY_NIELS,
      answer: [
        p(
          "Vorig jaar speelden we de eindronde op RC Meldert. Na 90 minuten stond het 2-2 — dus op naar de penalty's. Ik pakte er een, maar toen zag ik de lijnrechter zijn vlag omhoog steken. Volgens hem was ik te vroeg vertrokken. De volgende penalty van Elewijt misten we, en daar stopte onze eindronde. Niet de mooiste of moeilijkste save uit mijn carrière — maar wel een 'save' die ik nooit zal vergeten.",
        ),
      ],
    }),

    // Q10 — Julien's hattrick. KEY with Julien's cutout.
    pair({
      question:
        "Je hebt hier als aanvaller een mooi rapport opgebouwd: 140 matchen, 33 goals. Welk doelpunt neem je zonder twijfel mee in je koffer naar Frankrijk?",
      tag: "key",
      respondentKey: KEY_JULIEN,
      answer: [
        p(
          "Ik denk dat ik dan toch voor mijn hattrick tegen Borght-Humbeek moet kiezen. Het was mijn eerste — met zowel mijn linker- als rechtervoet, én met het hoofd. Voor veel mensen is dat dan ook de perfecte hattrick.",
        ),
      ],
    }),

    // Q11 — Julien solo. Standard.
    pair({
      question:
        "Je trekt binnenkort met je vriendin naar Frankrijk. Wat neem je mee uit Elewijt, en wat laat je hier het moeilijkst achter?",
      tag: "standard",
      answer: [
        p(
          "Ik denk dan toch aan de B-ploeg zelf. Dit was, zoals eerder gezegd, een vriendengroep die samen graag voetbalde en resultaten haalde.",
        ),
      ],
    }),

    // Rapid-fire — short alternating prompts (fabricated, editor can swap).
    pair({
      question: "Pasta of frieten?",
      tag: "rapid-fire",
      answer: [attributedP("Julien", "Frieten."), attributedP("Niels", "Pasta.")],
    }),
    pair({
      question: "Thuis of uit?",
      tag: "rapid-fire",
      answer: [attributedP("Julien", "Thuis."), attributedP("Niels", "Thuis.")],
    }),
    pair({
      question: "Favoriete training stuk?",
      tag: "rapid-fire",
      answer: [
        attributedP("Julien", "Partijtje."),
        attributedP("Niels", "Shooting oefening."),
      ],
    }),
    pair({
      question: "Eerste drankje na de match?",
      tag: "rapid-fire",
      answer: [attributedP("Julien", "Biertje."), attributedP("Niels", "Cola.")],
    }),

    // QUOTE — Julien's closing wish (shared-closer single-speaker form).
    pair({
      question: "Eén gezamenlijke boodschap voor de supporters van groen-wit?",
      tag: "quote",
      respondentKey: KEY_JULIEN,
      answer: [
        p(
          "Ik wens KCVV Elewijt het allerbeste. Ik heb er vertrouwen in dat ze binnen een paar jaar opnieuw kampioen spelen — en dat zal ik zeker mee komen vieren.",
        ),
      ],
    }),
  ];

  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "interview",
    title:
      "Afscheid duo: Julien en Niels sluiten zes seizoenen B-ploeg af",
    slug: { _type: "slug", current: SLUG },
    publishAt: PUBLISH_AT,
    featured: false,
    tags: ["Interview", "B-ploeg"],
    subjects: [
      {
        _key: KEY_JULIEN,
        _type: "subject",
        kind: "player",
        playerRef: { _type: "reference", _ref: julien._id },
      },
      {
        _key: KEY_NIELS,
        _type: "subject",
        kind: "player",
        playerRef: { _type: "reference", _ref: niels._id },
      },
    ],
    body: [
      {
        _key: "qa-block",
        _type: "qaBlock",
        pairs,
      },
    ],
  };

  await client.createOrReplace(doc);

  console.log(`✓ Seeded ${ARTICLE_ID}`);
  console.log(
    `  Preview (Vercel previews always read the ${DATASET} dataset):`,
  );
  console.log(`    /nieuws/${SLUG}`);
  console.log(`  Document id: ${ARTICLE_ID}`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
