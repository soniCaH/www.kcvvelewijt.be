import type { ResponsibilityPath } from "@/types/responsibility";

/**
 * Finder fixtures — a realistic-shape KCVV corpus across categories. Names /
 * emails are illustrative placeholders (mockup convention). `administratief`
 * intentionally holds 5 paths to exercise the capped "Alle N →" preview;
 * `algemeen` is intentionally empty (empty categories must not render).
 */
export const FINDER_FIXTURE_PATHS: ResponsibilityPath[] = [
  {
    id: "blessure",
    category: "medisch",
    role: ["ouder", "speler"],
    question: "Mijn kind is geblesseerd tijdens de match — wat nu?",
    keywords: ["blessure", "gewond"],
    summary:
      "Eerste zorg gaat altijd voor. Daarna helpt de gerechtigd correspondent je met de ongevalsaangifte zodat de verzekering tussenkomt.",
    steps: [
      { description: "Zorg voor eerste hulp; roep een verzorger of trainer." },
      { description: "Vraag binnen 48u het aangifteformulier bij de GC." },
    ],
    primaryContact: {
      contactType: "position",
      position: "Gerechtigd correspondent",
      nodeId: "node-gc",
      members: [
        {
          id: "m-gc",
          name: "Luc Boons",
          email: "gc@kcvvelewijt.be",
          phone: "0470 12 34 56",
        },
      ],
    },
  },
  {
    id: "sportongeval-aangifte",
    category: "medisch",
    role: ["ouder", "trainer"],
    question: "Hoe doe ik aangifte van een sportongeval?",
    keywords: ["aangifte", "verzekering"],
    summary: "Binnen 48u via de gerechtigd correspondent.",
    steps: [{ description: "Vul het aangifteformulier in." }],
    primaryContact: {
      contactType: "position",
      position: "Gerechtigd correspondent",
      nodeId: "node-gc",
      members: [{ id: "m-gc", name: "Luc Boons", email: "gc@kcvvelewijt.be" }],
    },
  },
  {
    id: "inschrijven",
    category: "administratief",
    role: ["ouder", "niet-lid"],
    question: "Hoe schrijf ik mijn kind in?",
    keywords: ["inschrijven", "lid worden"],
    summary: "Inschrijven kan het hele seizoen door.",
    steps: [
      { description: "Mail of bel de jeugdsecretaris." },
      {
        description: "Vul het inschrijvingsformulier in.",
        link: "/inschrijven",
      },
      { description: "Betaal het lidgeld." },
    ],
    primaryContact: {
      contactType: "manual",
      role: "Jeugdsecretaris",
      email: "jeugd@kcvvelewijt.be",
    },
  },
  {
    id: "lidgeld",
    category: "administratief",
    role: ["ouder"],
    question: "Wat kost een lidmaatschap?",
    keywords: ["lidgeld", "kosten"],
    summary: "Het lidgeld verschilt per leeftijdscategorie.",
    steps: [{ description: "Bekijk de tarieven op de inschrijvingspagina." }],
    primaryContact: {
      contactType: "manual",
      role: "Secretariaat",
      email: "info@kcvvelewijt.be",
    },
  },
  {
    id: "transfer",
    category: "administratief",
    role: ["speler", "ouder"],
    question: "Hoe vraag ik een transfer aan?",
    keywords: ["transfer", "overschrijving"],
    summary: "Een overschrijving regel je tijdens de transferperiode.",
    steps: [{ description: "Check of je binnen de transferperiode zit." }],
    primaryContact: {
      contactType: "position",
      position: "Gerechtigd correspondent",
      nodeId: "node-gc",
      members: [{ id: "m-gc", name: "Luc Boons", email: "gc@kcvvelewijt.be" }],
    },
  },
  {
    id: "uitschrijven",
    category: "administratief",
    role: ["ouder"],
    question: "Hoe schrijf ik mijn kind uit?",
    keywords: ["uitschrijven", "stoppen"],
    summary: "Laat het tijdig weten aan het secretariaat.",
    steps: [{ description: "Mail het secretariaat." }],
    primaryContact: {
      contactType: "manual",
      role: "Secretariaat",
      email: "info@kcvvelewijt.be",
    },
  },
  {
    id: "attest",
    category: "administratief",
    role: ["ouder"],
    question: "Waar vraag ik een fiscaal attest aan?",
    keywords: ["attest", "mutualiteit"],
    summary: "Voor de mutualiteit of de belastingen.",
    steps: [{ description: "Mail het secretariaat met je gegevens." }],
    primaryContact: {
      contactType: "manual",
      role: "Secretariaat",
      email: "info@kcvvelewijt.be",
    },
  },
  {
    id: "training",
    category: "sportief",
    role: ["speler", "ouder"],
    question: "Wanneer en waar traint mijn ploeg?",
    keywords: ["training", "uren"],
    summary: "Trainingsdagen en -uren verschillen per ploeg.",
    steps: [{ description: "Vraag het schema aan je trainer." }],
    primaryContact: { contactType: "team-role", teamRole: "trainer" },
  },
  {
    id: "gedrag-melden",
    category: "gedrag",
    role: ["ouder", "speler", "trainer", "supporter"],
    question: "Ik wil ongepast gedrag melden",
    keywords: ["gedrag", "pesten", "klacht"],
    summary: "Elk signaal wordt vertrouwelijk behandeld.",
    steps: [{ description: "Spreek de jeugdcoördinator of het API aan." }],
    primaryContact: {
      contactType: "manual",
      role: "Aanspreekpunt Integriteit",
      email: "api@kcvvelewijt.be",
    },
  },
  {
    id: "sponsor",
    category: "commercieel",
    role: ["supporter", "niet-lid"],
    question: "Ik wil sponsor worden",
    keywords: ["sponsor", "steunen"],
    summary: "Steun de club als sponsor — elke formule is mogelijk.",
    steps: [
      { description: "Neem contact op met de sponsorverantwoordelijke." },
    ],
    primaryContact: {
      contactType: "manual",
      role: "Sponsorverantwoordelijke",
      email: "sponsors@kcvvelewijt.be",
    },
  },
];
