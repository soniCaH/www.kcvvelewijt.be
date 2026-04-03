/**
 * Phase 4 — Organigram seeding (issue #1213)
 *
 * Creates ~37 organigramNode documents with full hierarchy.
 * Staging first, then production.
 *
 * Run: SANITY_DATASET=staging tsx src/phase4-organigram-seeding.ts
 *      SANITY_DATASET=production tsx src/phase4-organigram-seeding.ts
 */
import { client } from "./sanity-client";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrganigramNode {
  _id: string;
  _type: "organigramNode";
  title: string;
  department: "hoofdbestuur" | "jeugdbestuur" | "algemeen";
  parentNode?: { _type: "reference"; _ref: string; _weak: true };
  members: Array<{ _type: "reference"; _ref: string; _key: string }>;
  active: boolean;
  sortOrder: number;
  roleCode?: string;
}

function ref(id: string): { _type: "reference"; _ref: string; _weak: true } {
  return { _type: "reference", _ref: id, _weak: true };
}

function memberRef(id: string): {
  _type: "reference";
  _ref: string;
  _key: string;
} {
  return { _type: "reference", _ref: id, _key: id.replace(/[^a-z0-9-]/gi, "") };
}

// ─── Node definitions ───────────────────────────────────────────────────────

const nodes: OrganigramNode[] = [
  // ── Hoofdbestuur ────────────────────────────────────────────────────────

  {
    _id: "organigramNode-voorzitter",
    _type: "organigramNode",
    title: "Voorzitter",
    department: "hoofdbestuur",
    members: [memberRef("staffMember-manual-rudy-bautmans")],
    active: true,
    sortOrder: 10,
    roleCode: "VZ",
  },
  {
    _id: "organigramNode-secretaris",
    _type: "organigramNode",
    title: "Secretaris",
    department: "hoofdbestuur",
    parentNode: ref("organigramNode-voorzitter"),
    members: [memberRef("staffMember-psd-245")],
    active: true,
    sortOrder: 20,
    roleCode: "SEC",
  },
  {
    _id: "organigramNode-penningmeester",
    _type: "organigramNode",
    title: "Penningmeester",
    department: "hoofdbestuur",
    parentNode: ref("organigramNode-voorzitter"),
    members: [memberRef("staffMember-manual-ilona-trouwkens")],
    active: true,
    sortOrder: 30,
    roleCode: "PEN",
  },
  {
    _id: "organigramNode-bestuursorgaan",
    _type: "organigramNode",
    title: "Bestuursorgaan",
    department: "hoofdbestuur",
    parentNode: ref("organigramNode-voorzitter"),
    members: [
      memberRef("staffMember-manual-paul-vanhamme"),
      memberRef("staffMember-psd-257"),
      memberRef("staffMember-manual-chris-nobels"),
      memberRef("staffMember-manual-werner-sanfrinnon"),
      memberRef("staffMember-psd-261"),
      memberRef("staffMember-psd-248"),
    ],
    active: true,
    sortOrder: 90,
    roleCode: "BST",
  },

  // ── Algemeen — under Voorzitter ─────────────────────────────────────────

  {
    _id: "organigramNode-sportief-verantwoordelijke",
    _type: "organigramNode",
    title: "Sportief Verantwoordelijke",
    department: "algemeen",
    parentNode: ref("organigramNode-voorzitter"),
    members: [memberRef("staffMember-psd-3260")],
    active: true,
    sortOrder: 40,
    roleCode: "TD",
  },
  {
    _id: "organigramNode-sponsoring",
    _type: "organigramNode",
    title: "Sponsoring",
    department: "algemeen",
    parentNode: ref("organigramNode-voorzitter"),
    members: [memberRef("staffMember-manual-werner-sanfrinnon")],
    active: true,
    sortOrder: 50,
    roleCode: "SPO",
  },
  {
    _id: "organigramNode-kledij",
    _type: "organigramNode",
    title: "Kledij",
    department: "algemeen",
    parentNode: ref("organigramNode-voorzitter"),
    members: [
      memberRef("staffMember-psd-257"),
      memberRef("staffMember-manual-chris-nobels"),
      memberRef("staffMember-psd-11278"),
    ],
    active: true,
    sortOrder: 60,
    roleCode: "KLE",
  },
  {
    _id: "organigramNode-infrastructuur",
    _type: "organigramNode",
    title: "Infrastructuur",
    department: "algemeen",
    parentNode: ref("organigramNode-voorzitter"),
    members: [
      memberRef("staffMember-psd-248"),
      memberRef("staffMember-psd-261"),
    ],
    active: true,
    sortOrder: 70,
    roleCode: "INF",
  },
  {
    _id: "organigramNode-kantine-evenementen",
    _type: "organigramNode",
    title: "Kantine & Evenementen",
    department: "algemeen",
    parentNode: ref("organigramNode-voorzitter"),
    members: [memberRef("staffMember-manual-ilona-trouwkens")],
    active: true,
    sortOrder: 80,
    roleCode: "K&E",
  },
  {
    _id: "organigramNode-website-communicatie",
    _type: "organigramNode",
    title: "Website & Communicatie",
    department: "algemeen",
    parentNode: ref("organigramNode-voorzitter"),
    members: [memberRef("staffMember-psd-245")],
    active: true,
    sortOrder: 85,
    roleCode: "WEB",
  },

  // ── Jeugdbestuur ────────────────────────────────────────────────────────

  {
    _id: "organigramNode-jeugdvoorzitter",
    _type: "organigramNode",
    title: "Jeugdvoorzitter",
    department: "jeugdbestuur",
    parentNode: ref("organigramNode-voorzitter"),
    members: [memberRef("staffMember-manual-matthias-knevels")],
    active: true,
    sortOrder: 10,
    roleCode: "JVZ",
  },
  {
    _id: "organigramNode-jeugdsecretaris",
    _type: "organigramNode",
    title: "Jeugdsecretaris & Afgevaardigden",
    department: "jeugdbestuur",
    parentNode: ref("organigramNode-jeugdvoorzitter"),
    members: [memberRef("staffMember-psd-2094")],
    active: true,
    sortOrder: 20,
    roleCode: "JSEC",
  },
  {
    _id: "organigramNode-interne-scheidsrechters",
    _type: "organigramNode",
    title: "Interne Scheidsrechters",
    department: "jeugdbestuur",
    parentNode: ref("organigramNode-jeugdvoorzitter"),
    members: [memberRef("staffMember-manual-jurgen-vergalle")],
    active: true,
    sortOrder: 40,
    roleCode: "REF",
  },
  {
    _id: "organigramNode-materiaal-kantinedienst-wedstrijden",
    _type: "organigramNode",
    title: "Materiaal & Kantinedienst Wedstrijden",
    department: "jeugdbestuur",
    parentNode: ref("organigramNode-jeugdvoorzitter"),
    members: [memberRef("staffMember-manual-dennis-thyssens")],
    active: true,
    sortOrder: 50,
    roleCode: "MAT",
  },
  {
    _id: "organigramNode-kantinedienst-trainingen",
    _type: "organigramNode",
    title: "Kantinedienst Trainingen",
    department: "jeugdbestuur",
    parentNode: ref("organigramNode-jeugdvoorzitter"),
    members: [memberRef("staffMember-manual-sven-de-smedt")],
    active: true,
    sortOrder: 60,
    roleCode: "KAN",
  },
  {
    _id: "organigramNode-gdpr-materiaal",
    _type: "organigramNode",
    title: "GDPR & Materiaal",
    department: "jeugdbestuur",
    parentNode: ref("organigramNode-jeugdvoorzitter"),
    members: [memberRef("staffMember-manual-shauni-hellemans")],
    active: true,
    sortOrder: 70,
    roleCode: "GDPR",
  },
  {
    _id: "organigramNode-lid-jeugdbestuur",
    _type: "organigramNode",
    title: "Lid Jeugdbestuur",
    department: "jeugdbestuur",
    parentNode: ref("organigramNode-jeugdvoorzitter"),
    members: [
      memberRef("staffMember-psd-8576"),
      memberRef("staffMember-psd-6530"),
      memberRef("staffMember-psd-11278"),
      memberRef("staffMember-psd-6588"),
    ],
    active: true,
    sortOrder: 80,
    roleCode: "JBL",
  },
  {
    _id: "organigramNode-ouderraad",
    _type: "organigramNode",
    title: "Ouderraad",
    department: "algemeen",
    parentNode: ref("organigramNode-jeugdvoorzitter"),
    members: [],
    active: true,
    sortOrder: 120,
    roleCode: "OUR",
  },

  // ── Management Sportief — under Sportief Verantwoordelijke / TVJO ─────

  {
    _id: "organigramNode-tvjo",
    _type: "organigramNode",
    title: "TVJO",
    department: "algemeen",
    parentNode: ref("organigramNode-sportief-verantwoordelijke"),
    members: [memberRef("staffMember-psd-8576")],
    active: true,
    sortOrder: 20,
    roleCode: "TVJO",
  },
  {
    _id: "organigramNode-atvjo",
    _type: "organigramNode",
    title: "ATVJO",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [],
    active: true,
    sortOrder: 25,
    roleCode: "ATVJ",
  },
  {
    _id: "organigramNode-jc-onderbouw",
    _type: "organigramNode",
    title: "Jeugdcoördinator Onderbouw",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [memberRef("staffMember-psd-8576")],
    active: true,
    sortOrder: 30,
    roleCode: "JC-OB",
  },
  {
    _id: "organigramNode-jc-middenbouw",
    _type: "organigramNode",
    title: "Jeugdcoördinator Middenbouw",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [memberRef("staffMember-psd-850")],
    active: true,
    sortOrder: 40,
    roleCode: "JC-MB",
  },
  {
    _id: "organigramNode-jc-bovenbouw",
    _type: "organigramNode",
    title: "Jeugdcoördinator Bovenbouw",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [memberRef("staffMember-psd-8948")],
    active: true,
    sortOrder: 50,
    roleCode: "JC-BB",
  },
  {
    _id: "organigramNode-doorstroom",
    _type: "organigramNode",
    title: "Doorstroom",
    department: "algemeen",
    parentNode: ref("organigramNode-sportief-verantwoordelijke"),
    members: [],
    active: true,
    sortOrder: 55,
    roleCode: "DST",
  },
  {
    _id: "organigramNode-t1-a-elftal",
    _type: "organigramNode",
    title: "T1 A-elftal",
    department: "algemeen",
    parentNode: ref("organigramNode-sportief-verantwoordelijke"),
    members: [memberRef("staffMember-psd-5640")],
    active: true,
    sortOrder: 60,
    roleCode: "T1-A",
  },
  {
    _id: "organigramNode-t1-b-elftal",
    _type: "organigramNode",
    title: "T1 B-elftal",
    department: "algemeen",
    parentNode: ref("organigramNode-sportief-verantwoordelijke"),
    members: [memberRef("staffMember-psd-3050")],
    active: true,
    sortOrder: 70,
    roleCode: "T1-B",
  },
  {
    _id: "organigramNode-keeperstrainer-jeugd",
    _type: "organigramNode",
    title: "Keeperstrainer Jeugd",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [
      memberRef("staffMember-manual-igor-michiels"),
      memberRef("staffMember-manual-mike-vermoes"),
    ],
    active: true,
    sortOrder: 80,
    roleCode: "KT-J",
  },
  {
    _id: "organigramNode-keeperstrainer-fanion",
    _type: "organigramNode",
    title: "Keeperstrainer Fanion",
    department: "algemeen",
    parentNode: ref("organigramNode-sportief-verantwoordelijke"),
    members: [memberRef("staffMember-psd-252")],
    active: true,
    sortOrder: 90,
    roleCode: "KT-F",
  },

  // ── Ondersteunende Staff — under TVJO / Sportief Verantwoordelijke ────

  {
    _id: "organigramNode-prosoccerdata",
    _type: "organigramNode",
    title: "ProSoccerData",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [memberRef("staffMember-psd-6588")],
    active: true,
    sortOrder: 10,
    roleCode: "PSD",
  },
  {
    _id: "organigramNode-api-integriteit",
    _type: "organigramNode",
    title: "API (Aanspreekpunt Integriteit)",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [memberRef("staffMember-manual-kim-bautmans")],
    active: true,
    sortOrder: 30,
    roleCode: "API",
  },
  {
    _id: "organigramNode-lid-ethische-commissie",
    _type: "organigramNode",
    title: "Lid Ethische Commissie",
    department: "algemeen",
    parentNode: ref("organigramNode-api-integriteit"),
    members: [memberRef("staffMember-psd-4301")],
    active: true,
    sortOrder: 50,
    roleCode: "EC",
  },
  {
    _id: "organigramNode-videoanalist",
    _type: "organigramNode",
    title: "Videoanalist",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [],
    active: true,
    sortOrder: 60,
    roleCode: "VID",
  },
  {
    _id: "organigramNode-scouting",
    _type: "organigramNode",
    title: "Scouting",
    department: "algemeen",
    parentNode: ref("organigramNode-sportief-verantwoordelijke"),
    members: [],
    active: true,
    sortOrder: 70,
    roleCode: "SCO",
  },
  {
    _id: "organigramNode-revalidatietrainer",
    _type: "organigramNode",
    title: "Revalidatietrainer",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [],
    active: true,
    sortOrder: 80,
    roleCode: "REVA",
  },
  {
    _id: "organigramNode-kinesist",
    _type: "organigramNode",
    title: "Kinesist",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [],
    active: true,
    sortOrder: 90,
    roleCode: "KIN",
  },
  {
    _id: "organigramNode-studentenbegeleiding",
    _type: "organigramNode",
    title: "Studentenbegeleiding",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [],
    active: true,
    sortOrder: 100,
    roleCode: "STU",
  },
  {
    _id: "organigramNode-spelersraad",
    _type: "organigramNode",
    title: "Spelersraad",
    department: "algemeen",
    parentNode: ref("organigramNode-tvjo"),
    members: [],
    active: true,
    sortOrder: 110,
    roleCode: "SPR",
  },
];

// ─── Execute ────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${nodes.length} organigramNode documents...`);

  const transaction = client.transaction();

  for (const node of nodes) {
    transaction.createOrReplace(node);
  }

  const result = await transaction.commit({ visibility: "async" });
  console.log(
    `Done! Transaction ID: ${result.transactionId}, ${nodes.length} documents created.`
  );
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
