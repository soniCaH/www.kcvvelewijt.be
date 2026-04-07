import type { ResponsibilityPath } from "@/types/responsibility";

/** Minimal fixture set covering the contact discriminated union */
export const FIXTURE_PATHS: ResponsibilityPath[] = [
  {
    id: "lidgeld-inschrijving",
    role: ["ouder", "speler"],
    question: "Ik wil mij of mijn kind inschrijven",
    summary: "Lidmaatschap en lidgeld bij KCVV Elewijt",
    keywords: ["inschrijving", "lidgeld"],
    category: "administratief",
    primaryContact: {
      contactType: "manual",
      role: "Secretariaat",
      email: "secretariaat@kcvvelewijt.be",
      phone: "+32 471 23 45 67",
    },
    steps: [
      { description: "Vul het inschrijvingsformulier in." },
      {
        description: "Betaal het lidgeld via overschrijving.",
        link: "https://example.com/payment-info",
      },
    ],
  },
  {
    id: "sportongeval-jeugd",
    role: ["ouder"],
    question: "Mijn kind heeft een sportongeval",
    summary: "Wat te doen na een ongeval op training",
    keywords: ["sportongeval", "ongeval"],
    category: "medisch",
    primaryContact: {
      contactType: "position",
      position: "Jeugdcoördinator",
      roleCode: "JC",
      nodeId: "node-jeugd",
      members: [
        {
          id: "member-jeugd-1",
          name: "Lien Wouters",
          email: "jeugd@kcvvelewijt.be",
          phone: "+32 470 12 34 56",
        },
      ],
    },
    steps: [
      { description: "Verleen onmiddellijk eerste hulp." },
      { description: "Vul het sportongevallenformulier in." },
    ],
  },
  {
    id: "kind-niet-opgesteld",
    role: ["ouder"],
    question: "Mijn kind wordt niet opgesteld",
    summary: "Bespreek dit met de trainer",
    keywords: ["opstelling"],
    category: "sportief",
    primaryContact: {
      contactType: "team-role",
      teamRole: "trainer",
    },
    steps: [{ description: "Spreek de trainer aan na de wedstrijd." }],
  },
];
