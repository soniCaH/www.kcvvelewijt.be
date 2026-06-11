import type { OrgChartNode } from "@/types/organigram";

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
