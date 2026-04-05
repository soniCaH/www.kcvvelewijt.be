import { createHash } from "crypto";
import { client, dataset } from "./sanity-client";

// ─── Helpers ────────────────────────────────────────────────────────────────

interface SanityRef {
  _type: "reference";
  _ref: string;
}

type SeedContact =
  | { contactType: "position"; organigramNode: SanityRef }
  | { contactType: "team-role"; teamRole: "trainer" | "afgevaardigde" }
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

function manualContact(fields: { role?: string; email?: string; phone?: string; department?: string }): SeedContact {
  return {
    contactType: "manual",
    ...fields,
  };
}

function teamRoleContact(teamRole: "trainer" | "afgevaardigde"): SeedContact {
  return {
    contactType: "team-role",
    teamRole,
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

const responsibilities: ResponsibilityDoc[] = [
  // ── Sportief (static) ───────────────────────────────────────────────────

  {
    _id: "responsibility-vragen-als-afgevaardigde",
    _type: "responsibility",
    title: "Vragen als afgevaardigde",
    slug: slug("vragen-als-afgevaardigde"),
    active: true,
    audience: ["trainer", "andere"],
    question: "heb vragen als afgevaardigde",
    keywords: ["afgevaardigde", "delegatie", "wedstrijdblad", "scheidsrechter", "wedstrijd", "ploegverantwoordelijke"],
    summary: "Neem als afgevaardigde contact op met de Jeugdsecretaris voor al je vragen rond wedstrijdadministratie.",
    category: "sportief",
    icon: "clipboard-list",
    primaryContact: positionContact("organigramNode-jeugdsecretaris"),
    steps: [
      step("Neem contact op met de Jeugdsecretaris voor vragen rond wedstrijdbladen, scheidsrechters en afgevaardigdentaken"),
    ],
  },
  {
    _id: "responsibility-proeftraining-aanvragen",
    _type: "responsibility",
    title: "Proeftraining aanvragen",
    slug: slug("proeftraining-aanvragen"),
    active: true,
    audience: ["ouder", "speler", "niet-lid"],
    question: "wil een proeftraining aanvragen",
    keywords: ["proeftraining", "proberen", "testen", "kennismaken", "eerste training", "nieuw", "uitproberen"],
    summary: "Neem contact op met de TVJO om een proeftraining in te plannen.",
    category: "sportief",
    icon: "play-circle",
    primaryContact: positionContact("organigramNode-tvjo"),
    steps: [
      step("Neem contact op met de TVJO om een proeftraining in te plannen"),
    ],
  },
  {
    _id: "responsibility-ploeg-veranderen",
    _type: "responsibility",
    title: "Van ploeg veranderen",
    slug: slug("ploeg-veranderen"),
    active: true,
    audience: ["ouder", "speler"],
    question: "wil van ploeg veranderen",
    keywords: ["ploeg", "veranderen", "wisselen", "andere ploeg", "overstappen", "indelingswijziging"],
    summary: "Bespreek je wens om van ploeg te veranderen met de TVJO.",
    category: "sportief",
    icon: "repeat",
    primaryContact: positionContact("organigramNode-tvjo"),
    steps: [
      step("Bespreek je wens om van ploeg te veranderen met de TVJO"),
    ],
  },
  {
    _id: "responsibility-scheidsrechter-worden",
    _type: "responsibility",
    title: "Scheidsrechter worden",
    slug: slug("scheidsrechter-worden"),
    active: true,
    audience: ["speler", "ouder", "niet-lid"],
    question: "wil scheidsrechter worden",
    keywords: ["scheidsrechter", "ref", "fluiten", "arbiter", "scheids"],
    summary: "Neem contact op met de Secretaris voor informatie over de scheidsrechtersopleiding.",
    category: "sportief",
    icon: "flag",
    primaryContact: positionContact("organigramNode-secretaris"),
    steps: [
      step("Neem contact op met de Secretaris voor informatie over de scheidsrechtersopleiding"),
    ],
  },
  {
    _id: "responsibility-sportongeval-senioren",
    _type: "responsibility",
    title: "Sportongeval senioren",
    slug: slug("sportongeval-senioren"),
    active: true,
    audience: ["speler"],
    question: "heb een sportongeval gehad als senior",
    keywords: ["sportongeval", "ongeval", "blessure", "letsel", "senioren", "eerste ploeg", "verzekering", "gerechtelijk"],
    summary: "Neem direct contact op met de Gerechtelijk Correspondent voor de afhandeling van je sportongeval.",
    category: "sportief",
    icon: "alert-triangle",
    primaryContact: positionContact("organigramNode-gerechtelijk-correspondent"),
    steps: [
      step("Neem direct contact op met de Gerechtelijk Correspondent"),
    ],
  },

  // ── Sportief (dynamic — team-role) ──────────────────────────────────────

  {
    _id: "responsibility-vraag-over-training",
    _type: "responsibility",
    title: "Vraag over de training",
    slug: slug("vraag-over-training"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb een vraag over de training",
    keywords: ["training", "oefening", "trainer", "ploeg", "trainingsuur", "trainingsdag", "schema"],
    summary: "Neem contact op met de trainer van je ploeg. Bij escalatie: JC of TVJO.",
    category: "sportief",
    icon: "dumbbell",
    primaryContact: teamRoleContact("trainer"),
    steps: [
      step("Neem contact op met de trainer van je ploeg", { contact: teamRoleContact("trainer") }),
      step("JC Onderbouw — voor U6 t/m U9", { contact: positionContact("organigramNode-jc-onderbouw") }),
      step("JC Middenbouw — voor U10 t/m U13", { contact: positionContact("organigramNode-jc-middenbouw") }),
      step("JC Bovenbouw — voor U14 t/m U21", { contact: positionContact("organigramNode-jc-bovenbouw") }),
      step("Escalatie: TVJO", { contact: positionContact("organigramNode-tvjo") }),
    ],
  },
  {
    _id: "responsibility-kind-niet-opgesteld",
    _type: "responsibility",
    title: "Kind niet opgesteld",
    slug: slug("kind-niet-opgesteld"),
    active: true,
    audience: ["ouder"],
    question: "begrijp niet waarom mijn kind niet opgesteld wordt",
    keywords: ["opgesteld", "opstelling", "niet spelen", "bank", "selectie", "niet geselecteerd", "wisselspeler"],
    summary: "Bespreek het eerst met de trainer van je ploeg. Bij onvoldoende antwoord: JC of TVJO.",
    category: "sportief",
    icon: "user-x",
    primaryContact: teamRoleContact("trainer"),
    steps: [
      step("Bespreek het met de trainer van je ploeg", { contact: teamRoleContact("trainer") }),
      step("JC Onderbouw — voor U6 t/m U9", { contact: positionContact("organigramNode-jc-onderbouw") }),
      step("JC Middenbouw — voor U10 t/m U13", { contact: positionContact("organigramNode-jc-middenbouw") }),
      step("JC Bovenbouw — voor U14 t/m U21", { contact: positionContact("organigramNode-jc-bovenbouw") }),
      step("Escalatie: TVJO", { contact: positionContact("organigramNode-tvjo") }),
    ],
  },
  {
    _id: "responsibility-afwezigheid-melden",
    _type: "responsibility",
    title: "Afwezigheid melden",
    slug: slug("afwezigheid-melden"),
    active: true,
    audience: ["ouder", "speler"],
    question: "wil een afwezigheid melden voor training of wedstrijd",
    keywords: ["afwezigheid", "afwezig", "niet kunnen", "ziek", "vakantie", "melden", "verwittigen"],
    summary: "Meld je afwezigheid aan de trainer of afgevaardigde van je ploeg.",
    category: "sportief",
    icon: "calendar-x",
    primaryContact: teamRoleContact("trainer"),
    steps: [
      step("Meld je afwezigheid aan de trainer van je ploeg", { contact: teamRoleContact("trainer") }),
      step("Of meld het aan de afgevaardigde van je ploeg", { contact: teamRoleContact("afgevaardigde") }),
    ],
  },
  {
    _id: "responsibility-sportongeval-jeugd",
    _type: "responsibility",
    title: "Sportongeval jeugd",
    slug: slug("sportongeval-jeugd"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb een sportongeval gehad als jeugdspeler",
    keywords: ["sportongeval", "ongeval", "blessure", "letsel", "jeugd", "verzekering", "dokter"],
    summary: "Meld het onmiddellijk aan de trainer of afgevaardigde. Zij helpen je met de verdere stappen.",
    category: "medisch",
    icon: "alert-triangle",
    primaryContact: teamRoleContact("trainer"),
    steps: [
      step("Meld het onmiddellijk aan de trainer of afgevaardigde van je ploeg", { contact: teamRoleContact("trainer") }),
      step("Neem contact op met de Gerechtelijk Correspondent voor de verzekering", { contact: positionContact("organigramNode-gerechtelijk-correspondent") }),
    ],
  },
  {
    _id: "responsibility-ploegindeling-vraag",
    _type: "responsibility",
    title: "Vraag over ploegindeling",
    slug: slug("ploegindeling-vraag"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb een vraag over de ploegindeling",
    keywords: ["ploegindeling", "indeling", "welke ploeg", "categorie", "leeftijdsgroep", "niveau"],
    summary: "Bespreek het met de trainer. Bij escalatie: JC of TVJO.",
    category: "sportief",
    icon: "users",
    primaryContact: teamRoleContact("trainer"),
    steps: [
      step("Bespreek het met de trainer van je ploeg", { contact: teamRoleContact("trainer") }),
      step("JC Onderbouw — voor U6 t/m U9", { contact: positionContact("organigramNode-jc-onderbouw") }),
      step("JC Middenbouw — voor U10 t/m U13", { contact: positionContact("organigramNode-jc-middenbouw") }),
      step("JC Bovenbouw — voor U14 t/m U21", { contact: positionContact("organigramNode-jc-bovenbouw") }),
      step("Escalatie: TVJO", { contact: positionContact("organigramNode-tvjo") }),
    ],
  },
  {
    _id: "responsibility-wedstrijdinfo-jeugd",
    _type: "responsibility",
    title: "Wedstrijdinformatie jeugd",
    slug: slug("wedstrijdinfo-jeugd"),
    active: true,
    audience: ["ouder", "speler"],
    question: "zoek informatie over een wedstrijd van mijn ploeg",
    keywords: ["wedstrijd", "wedstrijdinfo", "locatie", "uur", "tegenstander", "verplaatsing", "afspraak"],
    summary: "Neem contact op met de afgevaardigde van je ploeg voor wedstrijdinformatie.",
    category: "sportief",
    icon: "map-pin",
    primaryContact: teamRoleContact("afgevaardigde"),
    steps: [
      step("Neem contact op met de afgevaardigde van je ploeg", { contact: teamRoleContact("afgevaardigde") }),
      step("Of contacteer de trainer van je ploeg", { contact: teamRoleContact("trainer") }),
    ],
  },
  {
    _id: "responsibility-speler-gedrag-ploeg",
    _type: "responsibility",
    title: "Gedrag van een speler in de ploeg",
    slug: slug("speler-gedrag-ploeg"),
    active: true,
    audience: ["ouder", "trainer"],
    question: "wil het gedrag van een speler in de ploeg bespreken",
    keywords: ["gedrag", "speler", "pesten", "sfeer", "ploeg", "team", "samenwerking", "respect"],
    summary: "Bespreek het eerst met de trainer. Bij escalatie: JC of API.",
    category: "gedrag",
    icon: "message-circle",
    primaryContact: teamRoleContact("trainer"),
    steps: [
      step("Bespreek het met de trainer van je ploeg", { contact: teamRoleContact("trainer") }),
      step("JC Onderbouw — voor U6 t/m U9", { contact: positionContact("organigramNode-jc-onderbouw") }),
      step("JC Middenbouw — voor U10 t/m U13", { contact: positionContact("organigramNode-jc-middenbouw") }),
      step("JC Bovenbouw — voor U14 t/m U21", { contact: positionContact("organigramNode-jc-bovenbouw") }),
      step("Escalatie: TVJO", { contact: positionContact("organigramNode-tvjo") }),
      step("Escalatie: Aanspreekpunt Integriteit (API)", { contact: positionContact("organigramNode-api-integriteit") }),
    ],
  },
  {
    _id: "responsibility-materiaal-ploeg",
    _type: "responsibility",
    title: "Materiaal voor de ploeg",
    slug: slug("materiaal-ploeg"),
    active: true,
    audience: ["trainer"],
    question: "heb materiaal nodig voor mijn ploeg",
    keywords: ["materiaal", "ballen", "hesjes", "pionnen", "doelen", "uitrusting", "veld"],
    summary: "Neem contact op met de afgevaardigde van je ploeg of de materiaalbeheerder.",
    category: "sportief",
    icon: "package",
    primaryContact: teamRoleContact("afgevaardigde"),
    steps: [
      step("Neem contact op met de afgevaardigde van je ploeg", { contact: teamRoleContact("afgevaardigde") }),
      step("Of neem contact op met de materiaalbeheerder", { contact: positionContact("organigramNode-materiaal-kantinedienst-wedstrijden") }),
    ],
  },

  // ── Niet-sportief ───────────────────────────────────────────────────────

  {
    _id: "responsibility-opmerking-trainer-afgevaardigde",
    _type: "responsibility",
    title: "Opmerking over trainer/afgevaardigde",
    slug: slug("opmerking-trainer-afgevaardigde"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb een opmerking over een trainer of afgevaardigde",
    keywords: ["opmerking", "trainer", "afgevaardigde", "klacht", "feedback", "coach", "begeleider", "gedrag trainer"],
    summary: "Neem contact op met de Jeugdcoördinator (JC) van de juiste leeftijdsgroep. Bij escalatie: Jeugdvoorzitter of TVJO.",
    category: "gedrag",
    icon: "message-circle",
    primaryContact: positionContact("organigramNode-jc-onderbouw"),
    steps: [
      step("JC Onderbouw — voor U6 t/m U9", { contact: positionContact("organigramNode-jc-onderbouw") }),
      step("JC Middenbouw — voor U10 t/m U13", { contact: positionContact("organigramNode-jc-middenbouw") }),
      step("JC Bovenbouw — voor U14 t/m U21", { contact: positionContact("organigramNode-jc-bovenbouw") }),
      step("Escalatie: Jeugdvoorzitter", { contact: positionContact("organigramNode-jeugdvoorzitter") }),
      step("Escalatie: TVJO", { contact: positionContact("organigramNode-tvjo") }),
    ],
  },
  {
    _id: "responsibility-vrijwilliger-worden",
    _type: "responsibility",
    title: "Vrijwilliger worden",
    slug: slug("vrijwilliger-worden"),
    active: true,
    audience: ["ouder", "niet-lid", "supporter"],
    question: "wil me engageren als vrijwilliger",
    keywords: ["vrijwilliger", "helpen", "engageren", "meehelpen", "bijdragen", "hand toesteken", "volunteer"],
    summary: "Neem contact op met de Jeugdvoorzitter om te bespreken hoe je kan helpen.",
    category: "algemeen",
    icon: "heart-handshake",
    primaryContact: positionContact("organigramNode-jeugdvoorzitter"),
    steps: [
      step("Neem contact op met de Jeugdvoorzitter om te bespreken hoe je kan helpen"),
    ],
  },
  {
    _id: "responsibility-trainer-afgevaardigde-worden",
    _type: "responsibility",
    title: "Trainer of afgevaardigde worden",
    slug: slug("trainer-afgevaardigde-worden"),
    active: true,
    audience: ["ouder", "niet-lid"],
    question: "wil me engageren als trainer of afgevaardigde",
    keywords: ["trainer", "afgevaardigde", "coach", "worden", "opleiding", "cursus", "begeleiden"],
    summary: "Neem contact op met de TVJO om je interesse te bespreken.",
    category: "sportief",
    icon: "graduation-cap",
    primaryContact: positionContact("organigramNode-tvjo"),
    steps: [
      step("Neem contact op met de TVJO om je interesse en beschikbaarheid te bespreken"),
    ],
  },
  {
    _id: "responsibility-sponsor-worden",
    _type: "responsibility",
    title: "Sponsor worden",
    slug: slug("sponsor-worden"),
    active: true,
    audience: ["niet-lid", "supporter"],
    question: "wil de club sponsoren",
    keywords: ["sponsor", "sponsoring", "reclame", "reclamebord", "partnership", "steun", "adverteren", "publiciteit"],
    summary: "Neem contact op met de Commerciële Cel voor de sponsormogelijkheden.",
    category: "commercieel",
    icon: "handshake",
    primaryContact: positionContact("organigramNode-sponsoring"),
    steps: [
      step("Neem contact op met de Commerciële Cel voor de verschillende mogelijkheden"),
    ],
  },
  {
    _id: "responsibility-sponsors-werven",
    _type: "responsibility",
    title: "Helpen sponsors werven",
    slug: slug("sponsors-werven"),
    active: true,
    audience: ["ouder", "supporter"],
    question: "wil helpen sponsors te werven",
    keywords: ["sponsor", "werven", "zoeken", "helpen", "netwerk", "contacten"],
    summary: "Neem contact op met de Commerciële Cel om samen sponsors te zoeken.",
    category: "commercieel",
    icon: "users",
    primaryContact: positionContact("organigramNode-sponsoring"),
    steps: [
      step("Neem contact op met de Commerciële Cel om samen sponsors te zoeken"),
    ],
  },
  {
    _id: "responsibility-kantinedienst-wedstrijden",
    _type: "responsibility",
    title: "Kantinedienst wedstrijddagen",
    slug: slug("kantinedienst-wedstrijden"),
    active: true,
    audience: ["ouder", "trainer"],
    question: "heb een vraag over kantinedienst op wedstrijddagen",
    keywords: ["kantinedienst", "kantine", "wedstrijd", "bar", "toog", "dienst", "beurt"],
    summary: "Neem contact op met de verantwoordelijke Materiaal & Kantinedienst Wedstrijden.",
    category: "algemeen",
    icon: "coffee",
    primaryContact: positionContact("organigramNode-materiaal-kantinedienst-wedstrijden"),
    steps: [
      step("Neem contact op met de verantwoordelijke Materiaal & Kantinedienst Wedstrijden"),
    ],
  },
  {
    _id: "responsibility-kantinedienst-trainingen",
    _type: "responsibility",
    title: "Kantinedienst trainingen",
    slug: slug("kantinedienst-trainingen"),
    active: true,
    audience: ["ouder", "trainer"],
    question: "heb een vraag over kantinedienst op trainingen",
    keywords: ["kantinedienst", "kantine", "training", "bar", "toog", "dienst", "beurt"],
    summary: "Neem contact op met de verantwoordelijke Kantinedienst Trainingen.",
    category: "algemeen",
    icon: "coffee",
    primaryContact: positionContact("organigramNode-kantinedienst-trainingen"),
    steps: [
      step("Neem contact op met de verantwoordelijke Kantinedienst Trainingen"),
    ],
  },
  {
    _id: "responsibility-lidgeld-inschrijving",
    _type: "responsibility",
    title: "Lidgeld of inschrijving",
    slug: slug("lidgeld-inschrijving"),
    active: true,
    audience: ["ouder", "speler", "niet-lid"],
    question: "heb een vraag over lidgeld of inschrijving",
    keywords: ["lidgeld", "inschrijving", "inschrijven", "betalen", "kostprijs", "prijs", "bijdrage", "lid worden", "aansluiting"],
    summary: "Neem contact op met de Jeugdsecretaris voor vragen over lidgeld en inschrijvingen.",
    category: "administratief",
    icon: "credit-card",
    primaryContact: positionContact("organigramNode-jeugdsecretaris"),
    steps: [
      step("Neem contact op met de Jeugdsecretaris voor vragen over lidgeld en inschrijvingen"),
    ],
  },
  {
    _id: "responsibility-kledij-uitrusting",
    _type: "responsibility",
    title: "Kledij en uitrusting",
    slug: slug("kledij-uitrusting"),
    active: true,
    audience: ["ouder", "speler", "trainer"],
    question: "heb een vraag over kledij of uitrusting",
    keywords: ["kledij", "uitrusting", "truitje", "broek", "kousen", "schoenen", "materiaal", "bestellen", "bestelling"],
    summary: "Neem contact op met de verantwoordelijke Kledij.",
    category: "administratief",
    icon: "shirt",
    primaryContact: positionContact("organigramNode-kledij"),
    steps: [
      step("Neem contact op met de verantwoordelijke Kledij"),
    ],
  },
  {
    _id: "responsibility-allerlei-jeugd-ouders",
    _type: "responsibility",
    title: "Allerlei vragen jeugd/ouders",
    slug: slug("allerlei-jeugd-ouders"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb allerlei vragen over de jeugd of als ouder",
    keywords: ["vraag", "vragen", "jeugd", "ouder", "informatie", "info", "algemeen", "catch-all"],
    summary: "Neem contact op met de Jeugdvoorzitter voor allerlei vragen over de jeugdwerking.",
    category: "algemeen",
    icon: "help-circle",
    primaryContact: positionContact("organigramNode-jeugdvoorzitter"),
    steps: [
      step("Neem contact op met de Jeugdvoorzitter"),
    ],
  },

  // ── Administratief ────────────────────────────────────────────────────

  {
    _id: "responsibility-club-verlaten",
    _type: "responsibility",
    title: "Club verlaten / uitschrijven",
    slug: slug("club-verlaten"),
    active: true,
    audience: ["ouder", "speler"],
    question: "wil de club verlaten of me uitschrijven",
    keywords: ["verlaten", "uitschrijven", "stoppen", "opzeggen", "weg", "andere club", "vertrekken"],
    summary: "Neem contact op met de Secretaris voor de uitschrijvingsprocedure.",
    category: "administratief",
    icon: "log-out",
    primaryContact: positionContact("organigramNode-secretaris"),
    steps: [
      step("Neem contact op met de Secretaris voor de uitschrijvingsprocedure"),
    ],
  },
  {
    _id: "responsibility-transfer-aanvragen",
    _type: "responsibility",
    title: "Transfer aanvragen (andere club)",
    slug: slug("transfer-aanvragen"),
    active: true,
    audience: ["ouder", "speler", "niet-lid"],
    question: "kom van een andere club en wil overstappen",
    keywords: ["transfer", "overstap", "overstappen", "andere club", "wissel", "overschrijving", "aansluiting"],
    summary: "Neem contact op met de Secretaris voor de transferprocedure.",
    category: "administratief",
    icon: "arrow-right-left",
    primaryContact: positionContact("organigramNode-secretaris"),
    steps: [
      step("Neem contact op met de Secretaris voor de transferprocedure"),
    ],
  },
  {
    _id: "responsibility-contactgegevens-wijzigen",
    _type: "responsibility",
    title: "Contactgegevens wijzigen",
    slug: slug("contactgegevens-wijzigen"),
    active: true,
    audience: ["ouder", "speler", "trainer"],
    question: "wil mijn contactgegevens wijzigen",
    keywords: ["contactgegevens", "adres", "telefoon", "email", "wijzigen", "aanpassen", "veranderen", "profiel"],
    summary: "Log in op ProSoccerData of neem contact op met de beheerder.",
    category: "administratief",
    icon: "edit",
    primaryContact: positionContact("organigramNode-prosoccerdata"),
    steps: [
      step("Log in op ProSoccerData of neem contact op met de PSD-beheerder"),
    ],
  },
  {
    _id: "responsibility-aansluiting-voetbal-vlaanderen",
    _type: "responsibility",
    title: "Probleem aansluiting Voetbal Vlaanderen",
    slug: slug("aansluiting-voetbal-vlaanderen"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb een probleem met mijn aansluiting bij Voetbal Vlaanderen",
    keywords: ["voetbal vlaanderen", "aansluiting", "kbvb", "lidkaart", "registratie", "probleem"],
    summary: "Neem contact op met de Secretaris voor hulp bij aansluitingsproblemen.",
    category: "administratief",
    icon: "alert-circle",
    primaryContact: positionContact("organigramNode-secretaris"),
    steps: [
      step("Neem contact op met de Secretaris voor hulp bij aansluitingsproblemen"),
    ],
  },
  {
    _id: "responsibility-nieuw-seizoen",
    _type: "responsibility",
    title: "Start nieuw seizoen",
    slug: slug("nieuw-seizoen"),
    active: true,
    audience: ["ouder", "speler"],
    question: "wil weten wanneer het nieuwe seizoen begint",
    keywords: ["seizoen", "nieuw seizoen", "start", "begin", "wanneer", "kalender", "planning"],
    summary: "Neem contact op met de TVJO voor informatie over het nieuwe seizoen.",
    category: "sportief",
    icon: "calendar",
    primaryContact: positionContact("organigramNode-tvjo"),
    steps: [
      step("Neem contact op met de TVJO voor informatie over de seizoensplanning"),
    ],
  },

  // ── Medisch ───────────────────────────────────────────────────────────

  {
    _id: "responsibility-medisch-attest",
    _type: "responsibility",
    title: "Medisch attest nodig",
    slug: slug("medisch-attest"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb een medisch attest nodig voor sport",
    keywords: ["medisch attest", "dokter", "attest", "geschiktheid", "keuring", "sport", "doktersattest"],
    summary: "Neem contact op met de verantwoordelijke verzekering voor informatie over medische attesten.",
    category: "medisch",
    icon: "file-check",
    primaryContact: manualContact({ role: "Verzekering", email: "verzekering@kcvvelewijt.be" }),
    steps: [
      step("Neem contact op met de verantwoordelijke verzekering"),
    ],
  },
  {
    _id: "responsibility-allergieen-medicatie-melden",
    _type: "responsibility",
    title: "Allergieën of medicatie melden",
    slug: slug("allergieen-medicatie-melden"),
    active: true,
    audience: ["ouder"],
    question: "wil allergieën of medicatie van mijn kind melden",
    keywords: ["allergie", "medicatie", "medisch", "melden", "gezondheid", "astma", "epipen", "diabetes"],
    summary: "Meld het aan de TVJO en de trainer van je ploeg.",
    category: "medisch",
    icon: "pill",
    primaryContact: positionContact("organigramNode-tvjo"),
    steps: [
      step("Meld het aan de TVJO en aan de trainer van je ploeg"),
    ],
  },
  {
    _id: "responsibility-aed-ehbo",
    _type: "responsibility",
    title: "AED of EHBO nodig",
    slug: slug("aed-ehbo"),
    active: true,
    audience: ["speler", "ouder", "trainer", "supporter"],
    question: "zoek de AED of heb EHBO nodig op het terrein",
    keywords: ["AED", "EHBO", "defibrillator", "eerste hulp", "noodgeval", "hartslag", "reanimatie"],
    summary: "Ga naar de kantine, de AED hangt aan de ingang.",
    category: "medisch",
    icon: "heart-pulse",
    primaryContact: positionContact("organigramNode-kantine-evenementen"),
    steps: [
      step("Ga naar de kantine — de AED hangt aan de ingang van het gebouw"),
    ],
  },

  // ── Gedrag ────────────────────────────────────────────────────────────

  {
    _id: "responsibility-conflict-ouder-speler",
    _type: "responsibility",
    title: "Conflict met ouder of speler",
    slug: slug("conflict-ouder-speler"),
    active: true,
    audience: ["ouder", "speler"],
    question: "heb een conflict met een andere ouder of speler",
    keywords: ["conflict", "ruzie", "probleem", "onenigheid", "ouder", "speler", "bemiddeling"],
    summary: "Neem contact op met het API (Aanspreekpunt Integriteit).",
    category: "gedrag",
    icon: "shield",
    primaryContact: positionContact("organigramNode-api-integriteit"),
    steps: [
      step("Neem contact op met het Aanspreekpunt Integriteit (API)"),
    ],
  },
  {
    _id: "responsibility-fair-play-charter",
    _type: "responsibility",
    title: "Fair play charter raadplegen",
    slug: slug("fair-play-charter"),
    active: true,
    audience: ["ouder", "speler", "trainer", "supporter"],
    question: "wil het fair play charter raadplegen",
    keywords: ["fair play", "charter", "gedragscode", "regels", "sportiviteit", "respect"],
    summary: "Raadpleeg het charter op de website of neem contact op met het API.",
    category: "gedrag",
    icon: "book-open",
    primaryContact: positionContact("organigramNode-api-integriteit"),
    steps: [
      step("Raadpleeg het fair play charter op de website"),
    ],
  },

  // ── Algemeen ──────────────────────────────────────────────────────────

  {
    _id: "responsibility-terrein-kantine-huren",
    _type: "responsibility",
    title: "Terrein of kantine huren",
    slug: slug("terrein-kantine-huren"),
    active: true,
    audience: ["niet-lid", "supporter"],
    question: "wil het terrein of de kantine huren",
    keywords: ["huren", "terrein", "kantine", "zaal", "evenement", "feest", "locatie", "verhuur"],
    summary: "Neem contact op met de verantwoordelijke Kantine & Evenementen.",
    category: "commercieel",
    icon: "building",
    primaryContact: positionContact("organigramNode-kantine-evenementen"),
    steps: [
      step("Neem contact op met de verantwoordelijke Kantine & Evenementen"),
    ],
  },
  {
    _id: "responsibility-gevonden-voorwerpen",
    _type: "responsibility",
    title: "Gevonden voorwerpen",
    slug: slug("gevonden-voorwerpen"),
    active: true,
    audience: ["ouder", "speler", "supporter"],
    question: "heb iets verloren op het terrein",
    keywords: ["verloren", "gevonden", "voorwerp", "kwijt", "vergeten", "tas", "jas", "schoenen", "lost and found"],
    summary: "Vraag aan de kantine of je voorwerp is ingeleverd.",
    category: "algemeen",
    icon: "search",
    primaryContact: positionContact("organigramNode-kantine-evenementen"),
    steps: [
      step("Vraag aan de kantine of je verloren voorwerp is ingeleverd"),
    ],
  },
  {
    _id: "responsibility-klacht-indienen",
    _type: "responsibility",
    title: "Klacht indienen",
    slug: slug("klacht-indienen"),
    active: true,
    audience: ["ouder", "speler", "trainer", "supporter"],
    question: "wil een klacht indienen",
    keywords: ["klacht", "indienen", "formeel", "bezwaar", "ontevreden", "probleem", "melding"],
    summary: "Stuur een mail naar de Secretaris. Bij gedragsgerelateerde klachten: API.",
    category: "algemeen",
    icon: "file-warning",
    primaryContact: positionContact("organigramNode-secretaris"),
    steps: [
      step("Stuur een mail naar de Secretaris met je klacht", { contact: positionContact("organigramNode-secretaris") }),
      step("Bij gedragsgerelateerde klachten: neem contact op met het API", { contact: positionContact("organigramNode-api-integriteit") }),
    ],
  },
  {
    _id: "responsibility-contact-bestuur",
    _type: "responsibility",
    title: "Contact met het bestuur",
    slug: slug("contact-bestuur"),
    active: true,
    audience: ["ouder", "speler", "supporter", "niet-lid"],
    question: "wil contact met het bestuur",
    keywords: ["bestuur", "voorzitter", "contact", "vergadering", "directie", "leiding"],
    summary: "Neem contact op met de Voorzitter.",
    category: "algemeen",
    icon: "building-2",
    primaryContact: positionContact("organigramNode-voorzitter"),
    steps: [
      step("Neem contact op met de Voorzitter"),
    ],
  },
  {
    _id: "responsibility-geen-mails-meer",
    _type: "responsibility",
    title: "Geen mails meer van de club",
    slug: slug("geen-mails-meer"),
    active: true,
    audience: ["ouder", "speler"],
    question: "ontvang geen mails meer van de club",
    keywords: ["mail", "email", "ontvangen", "communicatie", "nieuwsbrief", "berichten", "geen mail"],
    summary: "Controleer je gegevens in ProSoccerData.",
    category: "administratief",
    icon: "mail-x",
    primaryContact: positionContact("organigramNode-prosoccerdata"),
    steps: [
      step("Controleer of je emailadres correct staat in ProSoccerData"),
    ],
  },

  // ── Commercieel ───────────────────────────────────────────────────────

  {
    _id: "responsibility-evenement-organiseren",
    _type: "responsibility",
    title: "Evenement organiseren op het terrein",
    slug: slug("evenement-organiseren"),
    active: true,
    audience: ["niet-lid", "supporter", "ouder"],
    question: "wil een evenement organiseren op het terrein",
    keywords: ["evenement", "organiseren", "feest", "activiteit", "terrein", "kantine", "verhuur"],
    summary: "Neem contact op met de verantwoordelijke Kantine & Evenementen.",
    category: "commercieel",
    icon: "party-popper",
    primaryContact: positionContact("organigramNode-kantine-evenementen"),
    steps: [
      step("Neem contact op met de verantwoordelijke Kantine & Evenementen"),
    ],
  },
];

// ─── Preflight validation ───────────────────────────────────────────────────

async function preflight() {
  // Collect all referenced organigramNode IDs
  const nodeIds = new Set<string>();
  for (const doc of responsibilities) {
    const pc = doc.primaryContact as Record<string, unknown>;
    const pcRef = pc.organigramNode as { _ref: string } | undefined;
    if (pcRef?._ref) nodeIds.add(pcRef._ref);

    for (const s of doc.steps) {
      const sc = (s as Record<string, unknown>).contact as Record<string, unknown> | undefined;
      const scRef = sc?.organigramNode as { _ref: string } | undefined;
      if (scRef?._ref) nodeIds.add(scRef._ref);
    }
  }

  // Verify all referenced nodes exist
  const existing = await client.fetch<string[]>(
    `*[_type == "organigramNode" && _id in $ids]._id`,
    { ids: [...nodeIds] },
  );
  const existingSet = new Set(existing);
  const missing = [...nodeIds].filter((id) => !existingSet.has(id));
  if (missing.length > 0) {
    throw new Error(`Missing organigramNode IDs: ${missing.join(", ")}`);
  }

  // Check for duplicate IDs
  const ids = responsibilities.map((d) => d._id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    throw new Error(`Duplicate _id values: ${dupes.join(", ")}`);
  }

  // Check for duplicate slugs
  const slugs = responsibilities.map((d) => d.slug.current);
  const slugDupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (slugDupes.length > 0) {
    throw new Error(`Duplicate slug values: ${slugDupes.join(", ")}`);
  }

  console.log(`Preflight OK — ${nodeIds.size} organigramNodes verified, ${responsibilities.length} responsibilities to seed`);
}

// ─── Seeding ────────────────────────────────────────────────────────────────

function omit<T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> {
  const result = { ...obj };
  for (const key of keys) delete result[key as keyof T];
  return result;
}

async function seed() {
  if (dataset === "production" && process.env.CONFIRM_PRODUCTION_SEED !== "yes") {
    throw new Error("Set CONFIRM_PRODUCTION_SEED=yes for production");
  }

  console.log(`Seeding ${responsibilities.length} responsibilities in dataset: ${dataset}`);

  await preflight();

  const tx = client.transaction();
  for (const doc of responsibilities) {
    tx.createIfNotExists(doc);
    tx.patch(doc._id, (p) => p.set(omit(doc, ["_id", "_type"])));
  }
  await tx.commit();
  for (const doc of responsibilities) {
    console.log(`  ✓ ${doc._id}`);
  }

  console.log(`\nDone — ${responsibilities.length} responsibility documents seeded.`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
