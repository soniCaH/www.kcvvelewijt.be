import type { OrgChartNode, OrgPillar } from "@/types/organigram";

/**
 * Storybook/test fixture mirroring the REAL reporting-tree SHAPE from the live
 * Sanity audit (#2054): 5 levels, Voorzitter → 11 children, TVJO → 12, with the
 * real vacant (0-member) and shared (2+) positions — but generic holder names,
 * never real people. Lets the explorer stories exercise the deep + wide cases.
 *
 * Spec rows: [id, title, parentId, memberCount].
 */
const SPEC: Array<[string, string, string | null, number]> = [
  ["club", "KCVV Elewijt", null, 0],
  ["gc", "Gedelegeerd Commissaris", "club", 2],
  ["voorzitter", "Voorzitter", "club", 1],
  // Voorzitter → 11
  ["jeugdvoorzitter", "Jeugdvoorzitter", "voorzitter", 1],
  ["secretaris", "Secretaris", "voorzitter", 1],
  ["penningmeester", "Penningmeester", "voorzitter", 1],
  ["sportief", "Sportief Verantwoordelijke", "voorzitter", 1],
  ["sponsoring", "Sponsoring", "voorzitter", 1],
  ["kledij", "Kledij", "voorzitter", 3],
  ["infrastructuur", "Infrastructuur", "voorzitter", 2],
  ["kantine-evt", "Kantine & Evenementen", "voorzitter", 1],
  ["website", "Website & Communicatie", "voorzitter", 1],
  ["bestuursorgaan", "Bestuursorgaan", "voorzitter", 6],
  ["gerechtelijk-corr", "Gerechtelijk Correspondent", "voorzitter", 1],
  // Jeugdvoorzitter → 7
  ["jeugdsecr", "Jeugdsecretaris & Afgevaardigden", "jeugdvoorzitter", 1],
  ["scheidsrechters", "Interne Scheidsrechters", "jeugdvoorzitter", 1],
  [
    "materiaal-wedstr",
    "Materiaal & Kantinedienst Wedstrijden",
    "jeugdvoorzitter",
    1,
  ],
  ["kantine-trainingen", "Kantinedienst Trainingen", "jeugdvoorzitter", 1],
  ["gdpr", "GDPR & Materiaal", "jeugdvoorzitter", 1],
  ["lid-jeugdbestuur", "Lid Jeugdbestuur", "jeugdvoorzitter", 4],
  ["ouderraad", "Ouderraad", "jeugdvoorzitter", 0],
  // Sportief Verantwoordelijke → 6
  ["tvjo", "TVJO", "sportief", 1],
  ["doorstroom", "Doorstroom", "sportief", 0],
  ["t1-a", "T1 A-elftal", "sportief", 1],
  ["scouting", "Scouting", "sportief", 0],
  ["t1-b", "T1 B-elftal", "sportief", 1],
  ["kt-fanion", "Keeperstrainer Fanion", "sportief", 1],
  // TVJO → 12
  ["prosoccerdata", "ProSoccerData", "tvjo", 1],
  ["atvjo", "ATVJO", "tvjo", 0],
  ["api", "API (Aanspreekpunt Integriteit)", "tvjo", 1],
  ["jc-onderbouw", "Jeugdcoördinator Onderbouw", "tvjo", 1],
  ["jc-middenbouw", "Jeugdcoördinator Middenbouw", "tvjo", 1],
  ["jc-bovenbouw", "Jeugdcoördinator Bovenbouw", "tvjo", 1],
  ["videoanalist", "Videoanalist", "tvjo", 0],
  ["kt-jeugd", "Keeperstrainer Jeugd", "tvjo", 2],
  ["revalidatie", "Revalidatietrainer", "tvjo", 0],
  ["kinesist", "Kinesist", "tvjo", 0],
  ["studentenbegeleiding", "Studentenbegeleiding", "tvjo", 0],
  ["spelersraad", "Spelersraad", "tvjo", 0],
  // API → 1
  ["ethische-commissie", "Lid Ethische Commissie", "api", 1],
];

/**
 * Role code + pillar per spec row, as the 2026-10-17 backfill sets them. The
 * handful of rows with no entry are the ones with no pillar (they land under
 * "Overige functies"); a few have a pillar but no code.
 */
const META: Record<string, { roleCode?: string; pillar?: OrgPillar }> = {
  voorzitter: { roleCode: "VZ", pillar: "bestuur" },
  secretaris: { roleCode: "SEC", pillar: "bestuur" },
  penningmeester: { roleCode: "PEN", pillar: "bestuur" },
  "gerechtelijk-corr": { roleCode: "GC", pillar: "bestuur" },
  bestuursorgaan: { roleCode: "BST", pillar: "bestuur" },
  sportief: { roleCode: "TD", pillar: "sportief" },
  "t1-a": { roleCode: "T1-A", pillar: "sportief" },
  "t1-b": { roleCode: "T1-B", pillar: "sportief" },
  "kt-fanion": { roleCode: "KT-F", pillar: "sportief" },
  doorstroom: { roleCode: "DS-B", pillar: "sportief" },
  scouting: { roleCode: "SCO", pillar: "sportief" },
  jeugdvoorzitter: { roleCode: "JVZ", pillar: "jeugd-organisatie" },
  jeugdsecr: { roleCode: "JSEC", pillar: "jeugd-organisatie" },
  scheidsrechters: { roleCode: "REF", pillar: "jeugd-organisatie" },
  "materiaal-wedstr": { roleCode: "MAT", pillar: "jeugd-organisatie" },
  "kantine-trainingen": { roleCode: "KAN", pillar: "jeugd-organisatie" },
  gdpr: { roleCode: "GDPR", pillar: "jeugd-organisatie" },
  "lid-jeugdbestuur": { roleCode: "JBL", pillar: "jeugd-organisatie" },
  ouderraad: { pillar: "jeugd-organisatie" },
  tvjo: { roleCode: "TVJO", pillar: "jeugd-opleiding" },
  prosoccerdata: { roleCode: "PSD", pillar: "jeugd-opleiding" },
  atvjo: { pillar: "jeugd-opleiding" },
  "jc-onderbouw": { roleCode: "JC-OB", pillar: "jeugd-opleiding" },
  "jc-middenbouw": { roleCode: "JC-MB", pillar: "jeugd-opleiding" },
  "jc-bovenbouw": { roleCode: "JC-BB", pillar: "jeugd-opleiding" },
  videoanalist: { roleCode: "VID", pillar: "jeugd-opleiding" },
  "kt-jeugd": { roleCode: "KT-J", pillar: "jeugd-opleiding" },
  revalidatie: { pillar: "jeugd-opleiding" },
  kinesist: { roleCode: "KIN", pillar: "jeugd-opleiding" },
  sponsoring: { roleCode: "SPO", pillar: "club" },
  kledij: { roleCode: "KLE", pillar: "club" },
  infrastructuur: { roleCode: "INF", pillar: "club" },
  "kantine-evt": { roleCode: "K&E", pillar: "club" },
  website: { roleCode: "WEB", pillar: "club" },
  api: { roleCode: "API", pillar: "integriteit" },
  "ethische-commissie": { roleCode: "EC", pillar: "integriteit" },
};

const FIRST_NAMES = [
  "Jan",
  "An",
  "Tom",
  "Els",
  "Bart",
  "Kim",
  "Luc",
  "Eva",
  "Stef",
  "Lien",
];
const LAST_NAMES = [
  "Janssens",
  "Peeters",
  "Maes",
  "Willems",
  "Claes",
  "Goossens",
  "Wouters",
  "De Smet",
];

function holderName(seed: number, i: number): string {
  return `${FIRST_NAMES[(seed + i) % FIRST_NAMES.length]} ${LAST_NAMES[(seed + i * 3) % LAST_NAMES.length]}`;
}

export const explorerFixture: OrgChartNode[] = SPEC.map(
  ([id, title, parentId, count], idx) => ({
    id,
    title,
    parentId,
    department: "algemeen",
    ...META[id],
    members:
      id === "club"
        ? []
        : Array.from({ length: count }, (_, i) => ({
            id: `${id}-m${i}`,
            name: holderName(idx, i),
            // Single holders get a profile href so "Volledig profiel →" shows.
            ...(count === 1 ? { href: `/staf/${id}` } : {}),
          })),
  }),
);
