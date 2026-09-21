/**
 * Restores the six help topics that the responsibilityPath → responsibility
 * migration dropped.
 *
 * The type rename (#910) shipped a data migration that preserved `_id`, and it
 * was never run against production: 40 `responsibilityPath` documents from
 * March 2026 are still there. What landed instead was a fresh set of
 * `responsibility` documents authored April–July 2026 under different ids. Only
 * 16 slugs match, and six topics were never carried over in any form — verified
 * by keyword sweep over every `responsibility` document's question, title,
 * keywords, step titles and step bodies. Three of the six are safeguarding
 * topics.
 *
 * Content is copied from the March documents. Two things are deliberately not
 * copied verbatim:
 *
 * - `/club/organigram` no longer exists. The organigram is a section of the
 *   hulp hub, so the link is `/hulp#structuur` (see `id="structuur"` in
 *   apps/web/src/app/(main)/hulp/page.tsx).
 * - The March documents carry plain email contacts and spell the integrity
 *   contact point "aansprekingspunt". Contacts are mapped onto the organigram
 *   positions that now own them, so a change of titular keeps the page right,
 *   and the spelling follows the node's own name, "Aanspreekpunt Integriteit".
 *
 * Run against staging first, then production.
 *
 * Usage:
 *   SANITY_DATASET=staging pnpm restore-missing
 */

import { createHash } from "crypto";
import { stripDraftPrefix } from "./draft-id";
import { client, dataset, draftAwareClient } from "./sanity-client";

// ─── Helpers ────────────────────────────────────────────────────────────────

interface SanityRef {
  _type: "reference";
  _ref: string;
}

type SeedContact =
  | { contactType: "position"; organigramNode: SanityRef }
  | { contactType: "manual"; role?: string; email?: string; phone?: string; department?: string };

function ref(id: string): SanityRef {
  return { _type: "reference", _ref: id };
}

function slug(value: string) {
  return { _type: "slug" as const, current: value };
}

function positionContact(nodeId: string): SeedContact {
  return {
    contactType: "position",
    organigramNode: ref(nodeId),
  };
}

function step(description: string, opts?: { link?: string; contact?: SeedContact }) {
  const hash = createHash("sha256").update(description).digest("hex").slice(0, 8);
  return {
    _key: `step-${hash}`,
    description,
    ...(opts?.link ? { link: opts.link } : {}),
    ...(opts?.contact ? { contact: opts.contact } : {}),
  };
}

// ─── Responsibility documents ───────────────────────────────────────────────

interface SeedStep {
  _key: string;
  description: string;
  link?: string;
  contact?: SeedContact;
}

interface ResponsibilityDoc {
  _id: string;
  _type: "responsibility";
  title: string;
  slug: { _type: "slug"; current: string };
  active: boolean;
  audience: string[];
  question: string;
  keywords: string[];
  summary: string;
  category: string;
  icon: string;
  primaryContact: SeedContact;
  steps: SeedStep[];
}

const API_NODE = "organigramNode-api-integriteit";

const responsibilities: ResponsibilityDoc[] = [
  // ── Gedrag ──────────────────────────────────────────────────────────────

  {
    _id: "responsibility-pestgedrag-melden",
    _type: "responsibility",
    title: "Pestgedrag melden",
    slug: slug("pestgedrag-melden"),
    active: true,
    audience: ["ouder", "speler"],
    question: "wil pestgedrag melden",
    keywords: ["pesten", "pestgedrag", "intimidatie", "uitsluiting", "treiteren", "melden"],
    summary:
      "Meld pestgedrag bij het Aanspreekpunt Integriteit (API). Elke melding wordt vertrouwelijk behandeld.",
    category: "gedrag",
    icon: "shield",
    primaryContact: positionContact(API_NODE),
    steps: [
      step("Contacteer het Aanspreekpunt Integriteit (API)", {
        contact: positionContact(API_NODE),
      }),
      step("Beschrijf de situatie zo concreet mogelijk"),
      step("De API behandelt je melding vertrouwelijk en neemt de nodige stappen"),
    ],
  },
  {
    _id: "responsibility-discriminatie-melden",
    _type: "responsibility",
    title: "Discriminatie melden",
    slug: slug("discriminatie-melden"),
    active: true,
    audience: ["ouder", "speler", "trainer"],
    question: "wil discriminatie melden",
    keywords: ["discriminatie", "racisme", "uitsluiting", "ongelijkheid", "melden"],
    summary:
      "Meld discriminatie bij het Aanspreekpunt Integriteit (API). Dit wordt strikt vertrouwelijk behandeld.",
    category: "gedrag",
    icon: "shield",
    primaryContact: positionContact(API_NODE),
    steps: [
      step("Contacteer het Aanspreekpunt Integriteit (API)", {
        contact: positionContact(API_NODE),
      }),
      step("Beschrijf het incident zo gedetailleerd mogelijk"),
      step("De API onderneemt actie en houdt je op de hoogte"),
    ],
  },
  {
    _id: "responsibility-ongepast-gedrag-rapporteren",
    _type: "responsibility",
    title: "Ongepast gedrag rapporteren",
    slug: slug("ongepast-gedrag-rapporteren"),
    active: true,
    audience: ["speler", "ouder", "trainer"],
    question: "wil graag ongepast gedrag rapporteren",
    keywords: [
      "ongepast",
      "gedrag",
      "klacht",
      "pesten",
      "discriminatie",
      "grensoverschrijdend",
      "melding",
    ],
    summary: "Neem vertrouwelijk contact op met de Voorzitter of met het Aanspreekpunt Integriteit.",
    category: "gedrag",
    icon: "shield",
    primaryContact: positionContact("organigramNode-voorzitter"),
    steps: [
      step("Documenteer het incident (datum, tijd, wat er gebeurde, getuigen)"),
      step("Neem vertrouwelijk contact op met de Voorzitter", {
        contact: positionContact("organigramNode-voorzitter"),
      }),
      step("Of contacteer het Aanspreekpunt Integriteit (API)", {
        contact: positionContact(API_NODE),
      }),
      step("Je melding wordt discreet en serieus behandeld"),
    ],
  },

  // ── Sportief ────────────────────────────────────────────────────────────

  {
    _id: "responsibility-keeper-worden",
    _type: "responsibility",
    title: "Keeper worden of keeperstraining volgen",
    slug: slug("keeper-worden"),
    active: true,
    audience: ["ouder", "speler"],
    question: "wil keeper worden of keeperstraining volgen",
    keywords: ["keeper", "keeperstraining", "doelman", "doel", "handschoenen"],
    summary: "Interesse in keeperstraining? De TVJO brengt je in contact met de juiste trainer.",
    category: "sportief",
    icon: "trophy",
    primaryContact: positionContact("organigramNode-tvjo"),
    steps: [
      step("Contacteer de TVJO met je interesse voor keeperstraining", {
        contact: positionContact("organigramNode-tvjo"),
      }),
      step("De TVJO verwijst je door naar de keeperstrainer van je leeftijdscategorie", {
        contact: positionContact("organigramNode-keeperstrainer-jeugd"),
      }),
    ],
  },
  {
    _id: "responsibility-sportief-verantwoordelijke-zoeken",
    _type: "responsibility",
    title: "Sportief verantwoordelijke zoeken",
    slug: slug("sportief-verantwoordelijke-zoeken"),
    active: true,
    audience: ["speler", "ouder"],
    question: "zoek de sportief verantwoordelijke voor mijn leeftijd",
    keywords: ["verantwoordelijke", "coördinator", "trainer", "leeftijdscategorie", "ploeg"],
    summary: "Bekijk het organigram of neem contact op met de Sportief Verantwoordelijke.",
    category: "sportief",
    icon: "user",
    primaryContact: positionContact("organigramNode-sportief-verantwoordelijke"),
    steps: [
      step("Bekijk het organigram voor een overzicht van alle verantwoordelijken", {
        link: "/hulp#structuur",
      }),
      step('Filter op "Jeugdbestuur" om de leeftijdscoördinatoren te zien'),
      step("Of contacteer de Sportief Verantwoordelijke", {
        contact: positionContact("organigramNode-sportief-verantwoordelijke"),
      }),
    ],
  },

  // ── Algemeen ────────────────────────────────────────────────────────────

  {
    _id: "responsibility-prosoccerdata-gebruiken",
    _type: "responsibility",
    title: "ProSoccerData gebruiken",
    slug: slug("prosoccerdata-gebruiken"),
    active: true,
    audience: ["speler", "ouder", "trainer"],
    question: "wil graag weten hoe ik ProSoccerData kan gebruiken",
    keywords: ["prosoccerdata", "psd", "app", "software", "login", "account", "toegang"],
    summary: "Vraag je logingegevens bij je trainer of bij de ProSoccerData-verantwoordelijke.",
    category: "algemeen",
    icon: "smartphone",
    primaryContact: positionContact("organigramNode-prosoccerdata"),
    steps: [
      step("Vraag je logingegevens bij je trainer"),
      step("Download de ProSoccerData app of ga naar de website", {
        link: "https://www.prosoccerdata.com",
      }),
      step("Log in met je persoonlijke gegevens"),
      step("Bij problemen, contacteer de ProSoccerData-verantwoordelijke", {
        contact: positionContact("organigramNode-prosoccerdata"),
      }),
    ],
  },
];

// ─── Run ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[restore] Targeting dataset: ${dataset}`);

  // Every position contact must resolve, or the page renders a contact block
  // with no name in it — the failure the Writer Rule exists to prevent.
  const nodeIds = [
    ...new Set(
      responsibilities.flatMap((doc) =>
        [doc.primaryContact, ...doc.steps.map((s) => s.contact)]
          .filter((c): c is SeedContact => c !== undefined)
          .flatMap((c) => (c.contactType === "position" ? [c.organigramNode._ref] : [])),
      ),
    ),
  ];
  const present = await client.fetch<string[]>('*[_type == "organigramNode" && _id in $ids]._id', {
    ids: nodeIds,
  });
  const missing = nodeIds.filter((id) => !present.includes(id));
  if (missing.length > 0) {
    console.error(`[restore] Missing organigramNode(s) in "${dataset}": ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`[restore] All ${nodeIds.length} organigram position(s) resolve.`);

  // A slug collision would mean the topic is already covered and this script's
  // premise is stale — stop rather than publish a duplicate question. Draft-aware:
  // a slug already taken by a draft-only `responsibility` is exactly the collision
  // this guard exists to catch (#2839).
  const slugs = responsibilities.map((doc) => doc.slug.current);
  const clashes = await draftAwareClient.fetch<Array<{ _id: string; slug: string }>>(
    '*[_type == "responsibility" && slug.current in $slugs]{_id, "slug": slug.current}',
    { slugs },
  );
  // Tolerate a `drafts.` prefix here rather than relying on the client option
  // alone — a draft of a document this script just wrote (e.g. from a previous
  // run, or opened in Studio) must not read as a foreign clash.
  const foreign = clashes.filter(
    (c) => !responsibilities.some((doc) => doc._id === stripDraftPrefix(c._id)),
  );
  if (foreign.length > 0) {
    console.error(
      `[restore] Slug already taken by another document: ${foreign
        .map((c) => `${c.slug} (${c._id})`)
        .join(", ")}`,
    );
    process.exit(1);
  }

  let created = 0;
  for (const doc of responsibilities) {
    await client.createOrReplace(doc);
    console.log(`[restore] ✓ ${doc._id}`);
    created++;
  }

  console.log(`[restore] Done. ${created} document(s) written to "${dataset}".`);
}

main().catch((err) => {
  console.error("[restore] Fatal error:", err);
  process.exit(1);
});
