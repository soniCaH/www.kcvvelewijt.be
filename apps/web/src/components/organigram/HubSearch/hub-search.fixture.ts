import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

/** Shared fixtures for `<HubSearch>` stories + tests. */
export const HUB_SEARCH_MEMBERS: OrgChartNode[] = [
  {
    id: "voorzitter",
    title: "Voorzitter",
    roleCode: "PRES",
    department: "hoofdbestuur",
    members: [
      {
        id: "staff-voorzitter",
        name: "Jan Peeters",
        email: "jan@kcvvelewijt.be",
      },
    ],
  },
  {
    id: "secretaris",
    title: "Secretaris",
    department: "hoofdbestuur",
    members: [{ id: "staff-secretaris", name: "Inge De Wit" }],
  },
  {
    id: "jeugdcoordinator",
    title: "Jeugdcoördinator",
    department: "jeugdbestuur",
    members: [{ id: "staff-jeugd", name: "Maria Janssens" }],
  },
];

export const HUB_SEARCH_PATHS: ResponsibilityPath[] = [
  {
    id: "inschrijven",
    role: ["niet-lid", "ouder"],
    question: "Hoe schrijf ik mijn kind in?",
    keywords: ["inschrijven", "lid worden", "aansluiten"],
    summary:
      "Vul het online inschrijvingsformulier in en bezorg het aan de secretaris.",
    category: "administratief",
    primaryContact: { contactType: "manual", role: "Secretaris" },
    steps: [],
  },
  {
    id: "blessure",
    role: ["speler", "ouder"],
    question: "Wat moet ik doen bij een blessure?",
    keywords: ["blessure", "ongeval", "verzekering"],
    summary:
      "Verwittig de gerechtigd correspondent zodat de verzekering in orde komt.",
    category: "medisch",
    primaryContact: { contactType: "manual", role: "Gerechtigd correspondent" },
    steps: [],
  },
];
