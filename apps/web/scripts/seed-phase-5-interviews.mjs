#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-5-interviews.mjs
 *
 * Phase 5 closeout — interview variants module (5 articles):
 *   - tracer-interview-matrix     — Tier 1 exhaustive qaBlock + side-block sweep
 *   - interview-duo               — Tier 2 duo interview (real player refs)
 *   - interview-panel             — Tier 2 panel interview (3 subjects)
 *   - interview-rapid-fire-heavy  — Tier 2 single subject, rapid-fire dominant
 *   - interview-ending-on-eventfact — Tier 2 stretch: closing eventFact
 *
 * Exports `seed(client)` returning {key, articleId, slug}[] so the parent
 * orchestrator (seed-phase-5-closeout.mjs) can collect URLs and update
 * the #1860 master checklist.
 *
 * Standalone usage (writes only this module's 5 articles):
 *   SANITY_API_TOKEN=<token> node scripts/seed-phase-5-interviews.mjs
 */

import {
  COVER_IMAGE_ASSET_REF,
  PUBLISHED_AT,
  assertProductionGuard,
  blockquote,
  heading,
  imageRef,
  makeClient,
  paragraph,
  ptTitle,
  qaPair,
  respondent,
  stagingUrl,
} from "./seeds/phase-5-shared.mjs";

// ─── Subject helpers ─────────────────────────────────────────────────────────

/**
 * Look up a KCVV player by first + last name. Returns the document _id or
 * null when the player isn't on the current dataset — callers fall back to
 * a `custom` subject in that case so the seed stays runnable on a freshly
 * imported staging dataset.
 */
async function findPlayerId(client, firstName, lastName) {
  const docs = await client.fetch(
    `*[_type == "player" && firstName == $first && lastName == $last][0]._id`,
    { first: firstName, last: lastName },
  );
  return typeof docs === "string" ? docs : null;
}

function customSubject(key, name, role) {
  return {
    _key: key,
    _type: "subject",
    kind: "custom",
    customName: name,
    customRole: role,
  };
}

function playerSubject(key, playerId) {
  return {
    _key: key,
    _type: "subject",
    kind: "player",
    playerRef: { _type: "reference", _ref: playerId },
  };
}

// ─── Article 1 — tracer-interview-matrix ─────────────────────────────────────
//
// Exhaustive Phase 5 interview-body sweep. Two subjects (so the duo
// attribution path exercises), every qaPair tag (standard, key, quote,
// rapid-fire×3, grouped), one qaSectionDivider, plus side-block samples
// (articleImage, videoBlock embedUrl, transferFact side-mention,
// eventFact side-mention).

const TRACER_SUBJECT_A_KEY = "tracer-int-a";
const TRACER_SUBJECT_B_KEY = "tracer-int-b";

function buildTracerInterviewMatrix() {
  return {
    _id: "article-phase-5-tracer-interview-matrix",
    _type: "article",
    articleType: "interview",
    title: ptTitle({
      before: "Tracer — ",
      accent: "interview",
      after: " body matrix",
      key: "tim-title",
    }),
    slug: { _type: "slug", current: "phase-5-tracer-interview-matrix" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Tracer", "Phase 5"],
    author: "Redactie",
    photographer: "KCVV Mediateam",
    lead: "Exhaustive sweep van elke qaBlock-variant + zij-blokken. Niet bedoeld als publicabel artikel — wel als regressiebed voor Phase 5.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    subjects: [
      customSubject(TRACER_SUBJECT_A_KEY, "Alex Tracer", "Aanvaller · A-ploeg"),
      customSubject(TRACER_SUBJECT_B_KEY, "Bram Variant", "Middenvelder · B-ploeg"),
    ],
    body: [
      paragraph(
        "tim-intro",
        "Deze tracer doorloopt alle qaBlock-tags (standard, key, quote, rapid-fire, grouped) en koppelt ze aan zijde-blokken die in interviews voorkomen.",
      ),

      // qaBlock — standard, key, quote, rapid-fire group, key with B
      {
        _key: "tim-qa-main",
        _type: "qaBlock",
        groupAtTail: false,
        pairs: [
          qaPair({
            key: "tim-q-std",
            question: "Hoe blik je terug op het seizoen?",
            tag: "standard",
            respondents: [
              respondent("tim-q-std-a", TRACER_SUBJECT_A_KEY, [
                paragraph(
                  "tim-q-std-a-p",
                  "Het was wisselvallig — sterke november, mindere februari, en daarna heen-en-weer tot de slotweken.",
                ),
              ]),
              respondent("tim-q-std-b", TRACER_SUBJECT_B_KEY, [
                paragraph(
                  "tim-q-std-b-p",
                  "Voor mij persoonlijk een groeijaar. Veel minuten, veel vertrouwen, en eindelijk gewoonte krijgen aan de intensiteit van Derde Amateur.",
                ),
              ]),
            ],
          }),
          qaPair({
            key: "tim-q-key",
            question: "Wat zou je collega's adviseren die hetzelfde traject overwegen?",
            tag: "key",
            respondents: [
              respondent("tim-q-key-a", TRACER_SUBJECT_A_KEY, [
                paragraph(
                  "tim-q-key-a-p",
                  "Geduld. De eerste twee maanden zijn een schok — daarna komt het lichaam mee en zie je de details opnieuw.",
                ),
              ]),
            ],
          }),
          qaPair({
            key: "tim-q-quote",
            question: "Wat hou je over uit dit seizoen?",
            tag: "quote",
            respondents: [
              respondent("tim-q-quote-b", TRACER_SUBJECT_B_KEY, [
                paragraph(
                  "tim-q-quote-b-p",
                  "Dat ik nooit alleen op het veld sta — niet bij winst, niet bij verlies.",
                ),
              ]),
            ],
          }),
          qaPair({
            key: "tim-q-rf-1",
            question: "Linker- of rechtervoet?",
            tag: "rapid-fire",
            respondents: [
              respondent("tim-q-rf-1-a", TRACER_SUBJECT_A_KEY, [
                paragraph("tim-q-rf-1-a-p", "Linker. Altijd."),
              ]),
            ],
          }),
          qaPair({
            key: "tim-q-rf-2",
            question: "Café De Klem of De Kantine?",
            tag: "rapid-fire",
            respondents: [
              respondent("tim-q-rf-2-a", TRACER_SUBJECT_A_KEY, [
                paragraph("tim-q-rf-2-a-p", "Kantine — bij de jongens."),
              ]),
            ],
          }),
          qaPair({
            key: "tim-q-rf-3",
            question: "Favoriete nummer in de bus?",
            tag: "rapid-fire",
            respondents: [
              respondent("tim-q-rf-3-a", TRACER_SUBJECT_A_KEY, [
                paragraph("tim-q-rf-3-a-p", "Iets van Adel — altijd."),
              ]),
            ],
          }),
        ],
      },

      // qaSectionDivider exercises the act-divider with accent + kicker.
      {
        _key: "tim-divider",
        _type: "qaSectionDivider",
        title: ptTitle({
          before: "De ",
          accent: "ommekeer",
          after: "",
          key: "tim-div",
        }),
        kicker: "AKTE 02 · NA DE WINTERSTOP",
      },

      paragraph(
        "tim-mid",
        "Halverwege het seizoen kantelde de wedstrijd: een terugkeer uit blessure, een tactische omschakeling, en plots draaide het.",
      ),

      // articleImage exercises image with caption + alt + width=wide.
      {
        _key: "tim-img",
        _type: "articleImage",
        image: imageRef(COVER_IMAGE_ASSET_REF),
        alt: "Spelers vieren een doelpunt op het hoofdveld van Sportpark Elewijt.",
        width: "wide",
      },

      // videoBlock — embed URL path (no asset upload required).
      {
        _key: "tim-video",
        _type: "videoBlock",
        embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "Compilatie van de tweede seizoenshelft.",
        width: "prose",
      },

      // transferFact side-mention — exercises the in-interview transfer block.
      {
        _key: "tim-tf-side",
        _type: "transferFact",
        direction: "extension",
        playerName: "Alex Tracer",
        position: "Aanvaller",
        age: 25,
        until: "2028",
        kcvvContext: "Derde Amateur · A-ploeg",
      },

      // eventFact side-mention — exercises the in-interview event block.
      {
        _key: "tim-ev-side",
        _type: "eventFact",
        title: "Slotreceptie A-ploeg",
        date: "2026-06-07",
        startTime: "18:00",
        endTime: "22:00",
        location: "Kantine KCVV",
        ageGroup: "Iedereen welkom",
        competitionTag: "Clubmoment",
      },

      // Second qaBlock with groupAtTail — exercises the tail-grouping mode.
      {
        _key: "tim-qa-tail",
        _type: "qaBlock",
        groupAtTail: true,
        pairs: [
          qaPair({
            key: "tim-tail-q-1",
            question: "Welke ploegmaat is altijd de eerste in de kleedkamer?",
            tag: "standard",
            respondents: [
              respondent("tim-tail-q-1-a", TRACER_SUBJECT_A_KEY, [
                paragraph(
                  "tim-tail-q-1-a-p",
                  "Bram — die zit er twintig minuten voor iedereen.",
                ),
              ]),
            ],
          }),
          qaPair({
            key: "tim-tail-q-2",
            question: "En welke ploegmaat is altijd de laatste?",
            tag: "standard",
            respondents: [
              respondent("tim-tail-q-2-b", TRACER_SUBJECT_B_KEY, [
                paragraph(
                  "tim-tail-q-2-b-p",
                  "Alex. Die rekt zijn warming-up tot het laatste fluitsignaal.",
                ),
              ]),
            ],
          }),
        ],
      },

      // Closing prose so the article doesn't end on a tail-grouped Q&A.
      paragraph(
        "tim-outro",
        "Tot ziens in de zomerse competitie. De volgende test komt eraan.",
      ),
    ],
  };
}

// ─── Article 2 — interview-duo ──────────────────────────────────────────────
//
// Real KCVV B-ploeg duo (Julien Gillade + Niels Gosselin). Replaces the
// retired seed-phase-1358-interview-duo-julien-niels.mjs at a smaller
// scale (≤20 PT blocks) — the full Q&A interview lives on staging via the
// editor.

async function buildInterviewDuo(client) {
  const julienId = await findPlayerId(client, "Julien", "Gillade");
  const nielsId = await findPlayerId(client, "Niels", "Gosselin");
  const julienKey = "duo-julien-k";
  const nielsKey = "duo-niels-k";
  const julienSubject = julienId
    ? playerSubject(julienKey, julienId)
    : customSubject(julienKey, "Julien Gillade", "Aanvaller · B-ploeg");
  const nielsSubject = nielsId
    ? playerSubject(nielsKey, nielsId)
    : customSubject(nielsKey, "Niels Gosselin", "Keeper · B-ploeg");

  return {
    _id: "article-phase-5-interview-duo",
    _type: "article",
    articleType: "interview",
    title: ptTitle({
      before: "Afscheid duo: Julien en ",
      accent: "Niels",
      after: " sluiten zes seizoenen B-ploeg af",
      key: "duo-title",
    }),
    slug: { _type: "slug", current: "phase-5-interview-duo" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Interview", "B-ploeg"],
    author: "Redactie",
    photographer: "KCVV Mediateam",
    lead: "Twee spelers, één compagnie. Een gesprek over zes seizoenen B-ploeg, sneeuw, en de plezantste ploeg uit de reeks.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    subjects: [julienSubject, nielsSubject],
    body: [
      {
        _key: "duo-qa",
        _type: "qaBlock",
        groupAtTail: false,
        pairs: [
          qaPair({
            key: "duo-q-intro",
            question: "In drie woorden: wie ben jij op het veld?",
            tag: "standard",
            respondents: [
              respondent("duo-q-intro-j", julienKey, [
                paragraph(
                  "duo-q-intro-j-p",
                  "Communicatief, positief, en een klein beetje zagen.",
                ),
              ]),
              respondent("duo-q-intro-n", nielsKey, [
                paragraph("duo-q-intro-n-p", "Slechtste verliezer ooit."),
              ]),
            ],
          }),
          qaPair({
            key: "duo-q-key",
            question: "Wat is het sterkste punt van deze B-ploeg?",
            tag: "key",
            respondents: [
              respondent("duo-q-key-n", nielsKey, [
                paragraph("duo-q-key-n-p", "De plezantste Compagnie."),
              ]),
            ],
          }),
          qaPair({
            key: "duo-q-mem",
            question: "Mooiste herinnering in zes seizoenen?",
            tag: "standard",
            respondents: [
              respondent("duo-q-mem-j", julienKey, [
                paragraph(
                  "duo-q-mem-j-p",
                  "69 punten op de tweede plaats — 1 punt te kort.",
                ),
              ]),
              respondent("duo-q-mem-n", nielsKey, [
                paragraph(
                  "duo-q-mem-n-p",
                  "De 3-2 tegen Perk in de allerlaatste seconden, in de sneeuw.",
                ),
              ]),
            ],
          }),
          qaPair({
            key: "duo-q-quote",
            question: "Een gezamenlijke boodschap voor de supporters?",
            tag: "quote",
            respondents: [
              respondent("duo-q-quote-j", julienKey, [
                paragraph(
                  "duo-q-quote-j-p",
                  "Bedankt voor zes jaar — tot snel in de tribune.",
                ),
              ]),
            ],
          }),
        ],
      },
      paragraph(
        "duo-outro",
        "Julien en Niels, bedankt voor zes mooie seizoenen bij KCVV Elewijt. De deur blijft altijd openstaan.",
      ),
    ],
  };
}

// ─── Article 3 — interview-panel (3 subjects) ────────────────────────────────

function buildInterviewPanel() {
  const aKey = "panel-a";
  const bKey = "panel-b";
  const cKey = "panel-c";
  return {
    _id: "article-phase-5-interview-panel",
    _type: "article",
    articleType: "interview",
    title: ptTitle({
      before: "Drie kapiteins, één ",
      accent: "tafel",
      after: "",
      key: "panel-title",
    }),
    slug: { _type: "slug", current: "phase-5-interview-panel" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Interview", "Kapiteins"],
    author: "Redactie",
    photographer: "KCVV Mediateam",
    lead: "De drie aanvoerders van A-, B- en U21 vinden elkaar aan dezelfde kantinetafel. Drie generaties, drie perspectieven.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    subjects: [
      customSubject(aKey, "Bart Peeters", "Aanvoerder · A-ploeg"),
      customSubject(bKey, "Tom Janssens", "Aanvoerder · B-ploeg"),
      customSubject(cKey, "Sam De Clercq", "Aanvoerder · U21"),
    ],
    body: [
      paragraph(
        "panel-intro",
        "Op een rustige donderdagavond in het clubhuis vragen we drie aanvoerders rond dezelfde tafel: hoe zien jullie de club veranderen?",
      ),
      {
        _key: "panel-qa",
        _type: "qaBlock",
        groupAtTail: false,
        pairs: [
          qaPair({
            key: "panel-q-changes",
            question: "Wat is het meest veranderd in de voorbije vijf jaar?",
            tag: "standard",
            respondents: [
              respondent("panel-q-changes-a", aKey, [
                paragraph(
                  "panel-q-changes-a-p",
                  "Professionaliteit van de begeleiding — fysio, video, gestructureerd voeding-advies.",
                ),
              ]),
              respondent("panel-q-changes-b", bKey, [
                paragraph(
                  "panel-q-changes-b-p",
                  "De sfeer rond de B-ploeg is intacter dan ooit. Daar zijn we trots op.",
                ),
              ]),
              respondent("panel-q-changes-c", cKey, [
                paragraph(
                  "panel-q-changes-c-p",
                  "Voor de U21 het meeste de doorstroming — dat ze een echt pad krijgen naar boven.",
                ),
              ]),
            ],
          }),
          qaPair({
            key: "panel-q-key",
            question: "Welk woord typeert KCVV op zijn best?",
            tag: "key",
            respondents: [
              respondent("panel-q-key-b", bKey, [
                paragraph("panel-q-key-b-p", "Compagnie."),
              ]),
            ],
          }),
        ],
      },
      paragraph(
        "panel-outro",
        "Drie kapiteins, één tafel. De volgende ronde koffie staat al te trekken.",
      ),
    ],
  };
}

// ─── Article 4 — interview-rapid-fire-heavy ─────────────────────────────────

function buildInterviewRapidFireHeavy() {
  const sKey = "rf-subject";
  const rapid = (k, q, a) =>
    qaPair({
      key: `rf-${k}`,
      question: q,
      tag: "rapid-fire",
      respondents: [
        respondent(`rf-${k}-r`, sKey, [paragraph(`rf-${k}-p`, a)]),
      ],
    });
  return {
    _id: "article-phase-5-interview-rapid-fire",
    _type: "article",
    articleType: "interview",
    title: ptTitle({
      before: "Twintig vragen, twintig ",
      accent: "antwoorden",
      after: "",
      key: "rf-title",
    }),
    slug: { _type: "slug", current: "phase-5-interview-rapid-fire-heavy" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Interview", "Rapid-fire"],
    author: "Redactie",
    lead: "Een snelle ronde met de jongste aanwinst van de A-ploeg. Geen omwegen, geen lange antwoorden.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    subjects: [
      customSubject(sKey, "Lukas De Smet", "Verdediger · A-ploeg"),
    ],
    body: [
      paragraph(
        "rf-intro",
        "Zes maanden geleden tekende hij bij Elewijt. Tijd voor een snelle kennismaking — twintig vragen, twintig antwoorden.",
      ),
      {
        _key: "rf-qa",
        _type: "qaBlock",
        groupAtTail: false,
        pairs: [
          qaPair({
            key: "rf-warm-up",
            question: "Hoe verliep de eerste week op training?",
            tag: "standard",
            respondents: [
              respondent("rf-warm-up-r", sKey, [
                paragraph(
                  "rf-warm-up-p",
                  "Hard, maar warm onthaal. De jongens helpen elkaar zonder dat je het moet vragen.",
                ),
              ]),
            ],
          }),
          rapid("1", "Voetbalheld?", "Vincent Kompany."),
          rapid("2", "Linkervoet of rechtervoet?", "Rechts."),
          rapid("3", "Pre-match maaltijd?", "Pasta pesto."),
          rapid("4", "Pre-match nummer?", "Een Adel-klassieker."),
          rapid("5", "Favoriete uitwedstrijd?", "Tisselt — sfeer in de bus."),
          rapid("6", "Drukste plek in de kleedkamer?", "De spiegel boven Bart."),
          rapid("7", "Trainerstem die het verst draagt?", "Coach Marc."),
          rapid("8", "Beste assist-gever?", "Tom — kruispas zonder kijken."),
          rapid("9", "Slechtste danser op de busfeesten?", "Mezelf, helaas."),
          rapid("10", "Lievelingsstadion ooit bezocht?", "Wembley."),
          qaPair({
            key: "rf-close",
            question: "En over tien jaar — waar sta je dan?",
            tag: "key",
            respondents: [
              respondent("rf-close-r", sKey, [
                paragraph(
                  "rf-close-p",
                  "Hopelijk nog steeds aan deze tafel — met een KCVV-shirt aan of niet, maakt minder uit.",
                ),
              ]),
            ],
          }),
        ],
      },
    ],
  };
}

// ─── Article 5 — interview-ending-on-eventfact (stretch) ────────────────────

function buildInterviewEndingOnEventFact() {
  const sKey = "evt-subject";
  return {
    _id: "article-phase-5-interview-ending-on-eventfact",
    _type: "article",
    articleType: "interview",
    title: ptTitle({
      before: "De ",
      accent: "trainer",
      after: " over zijn afscheidsmatch",
      key: "ieof-title",
    }),
    slug: { _type: "slug", current: "phase-5-interview-ending-on-eventfact" },
    publishedAt: PUBLISHED_AT,
    featured: false,
    tags: ["Interview", "Afscheid"],
    author: "Redactie",
    photographer: "KCVV Mediateam",
    lead: "Na zeven seizoenen aan de zijlijn neemt de hoofdcoach afscheid. Een gesprek dat eindigt met een datum in de agenda.",
    coverImage: imageRef(COVER_IMAGE_ASSET_REF),
    subjects: [
      customSubject(sKey, "Coach Marc Vandeput", "Hoofdtrainer · A-ploeg"),
    ],
    body: [
      paragraph(
        "ieof-intro",
        "Zeven seizoenen aan de zijlijn — soms in winter onder de paraplu, soms in voorjaarszon. Coach Marc kijkt terug.",
      ),
      {
        _key: "ieof-qa",
        _type: "qaBlock",
        groupAtTail: false,
        pairs: [
          qaPair({
            key: "ieof-q-leg",
            question: "Wat hoop je na te laten?",
            tag: "key",
            respondents: [
              respondent("ieof-q-leg-r", sKey, [
                paragraph(
                  "ieof-q-leg-p",
                  "Een ploeg die mekaar opvangt — op het veld en daarnaast.",
                ),
              ]),
            ],
          }),
          qaPair({
            key: "ieof-q-best",
            question: "Mooiste wedstrijd uit je periode?",
            tag: "standard",
            respondents: [
              respondent("ieof-q-best-r", sKey, [
                paragraph(
                  "ieof-q-best-p",
                  "De terugmatch tegen Tisselt — derde minuut blessuretijd, 2-1.",
                ),
              ]),
            ],
          }),
        ],
      },
      blockquote(
        "ieof-quote",
        "Wie wil komen afscheid nemen, kan dat op zaterdag 7 juni in het clubhuis.",
      ),
      // eventFact closing the article — exercises the stretch case.
      {
        _key: "ieof-event",
        _type: "eventFact",
        title: "Afscheidsmoment Coach Marc",
        date: "2026-06-07",
        startTime: "18:00",
        endTime: "22:00",
        location: "Kantine KCVV",
        address: "Driesstraat 14, Elewijt",
        ageGroup: "Iedereen welkom",
        competitionTag: "Clubmoment",
        ticketUrl: "https://kcvvelewijt.be/afscheid-coach",
        ticketLabel: "Aanmelden",
      },
    ],
  };
}

// ─── Module entry ────────────────────────────────────────────────────────────

export async function seed(client) {
  const tracer = buildTracerInterviewMatrix();
  const duo = await buildInterviewDuo(client);
  const panel = buildInterviewPanel();
  const rapidFire = buildInterviewRapidFireHeavy();
  const endingOnEvent = buildInterviewEndingOnEventFact();

  const docs = [
    { key: "tracer-interview-matrix", doc: tracer },
    { key: "interview-duo", doc: duo },
    { key: "interview-panel", doc: panel },
    { key: "interview-rapid-fire-heavy", doc: rapidFire },
    { key: "interview-ending-on-eventfact", doc: endingOnEvent },
  ];

  const results = [];
  for (const { key, doc } of docs) {
    await client.createOrReplace(doc);
    const slug = doc.slug.current;
    console.log(`  ✓ ${key.padEnd(34)} → /nieuws/${slug}`);
    results.push({ key, articleId: doc._id, slug });
  }
  return results;
}

// Standalone entrypoint — only fires when this file is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  assertProductionGuard();
  const client = makeClient();
  console.log(`Seeding interviews into ${client.config().dataset}…`);
  const results = await seed(client);
  console.log("\nDone:");
  for (const { slug } of results) console.log(`  ${stagingUrl(slug)}`);
}
