import type { ResponsibilityPath } from "@/types/responsibility";

export const mockResponsibilityPaths: ResponsibilityPath[] = [
  {
    id: "club-sponsoren",
    role: ["niet-lid"],
    question: "wil de club graag sponsoren",
    keywords: [
      "sponsor",
      "sponsoring",
      "adverteren",
      "reclame",
      "partnership",
      "steun",
    ],
    summary:
      "Neem contact op met de sponsoringverantwoordelijke voor de mogelijkheden.",
    category: "commercieel",
    icon: "handshake",
    primaryContact: {
      role: "Verantwoordelijke Sponsoring",
      email: "sponsoring@kcvvelewijt.be",
      department: "hoofdbestuur",
      orgLink: "/club/organigram",
      memberId: "sponsoring-manager",
    },
    steps: [
      {
        order: 1,
        description: "Bekijk de sponsormogelijkheden op de website",
        link: "/sponsors",
      },
      {
        order: 2,
        description:
          "Contacteer de verantwoordelijke sponsoring voor een gesprek",
        contact: {
          role: "Verantwoordelijke Sponsoring",
          email: "sponsoring@kcvvelewijt.be",
        },
      },
      {
        order: 3,
        description: "Bespreek de verschillende pakketten en mogelijkheden",
      },
      { order: 4, description: "Onderteken de sponsorovereenkomst" },
    ],
  },
  {
    id: "herstel-blessure",
    role: ["speler", "ouder"],
    question: "ben hersteld van mijn ongeval/blessure",
    keywords: [
      "hersteld",
      "beter",
      "genezen",
      "terug trainen",
      "comeback",
      "opnieuw spelen",
    ],
    summary:
      "Breng je trainer op de hoogte en lever een medisch attest af indien vereist.",
    category: "medisch",
    icon: "zap",
    primaryContact: { role: "Trainer", department: "jeugdbestuur" },
    steps: [
      {
        order: 1,
        description: "Breng je trainer op de hoogte dat je weer kan trainen",
      },
      {
        order: 2,
        description:
          "Bezorg een medisch attest indien de blessure langer dan 21 dagen duurde",
      },
      {
        order: 3,
        description:
          "Volg de aanwijzingen van je trainer voor geleidelijke herstart",
      },
    ],
  },
  {
    id: "inschrijving-nieuw-lid",
    role: ["niet-lid", "ouder"],
    question: "wil mij graag inschrijven",
    keywords: [
      "inschrijven",
      "lid worden",
      "aansluiten",
      "nieuwe speler",
      "lidmaatschap",
      "registratie",
    ],
    summary:
      "Gebruik het online inschrijvingsformulier of neem contact op met de jeugdsecretaris.",
    category: "administratief",
    icon: "file-text",
    primaryContact: {
      role: "Jeugdsecretaris",
      email: "jeugd@kcvvelewijt.be",
      department: "jeugdbestuur",
      orgLink: "/club/organigram",
      memberId: "youth-coordinator",
    },
    steps: [
      {
        order: 1,
        description: "Ga naar de inschrijvingspagina op de website",
        link: "/club/inschrijven",
      },
      {
        order: 2,
        description: "Vul het online formulier in met alle gevraagde gegevens",
      },
      {
        order: 3,
        description:
          "Bezorg de nodige documenten: identiteitskaart, medisch attest, pasfoto",
      },
      { order: 4, description: "Betaal het lidgeld volgens de instructies" },
      {
        order: 5,
        description: "Je ontvangt een bevestiging per e-mail",
        contact: { role: "Jeugdsecretaris", email: "jeugd@kcvvelewijt.be" },
      },
    ],
  },
  {
    id: "inschrijving-stage",
    role: ["ouder", "speler"],
    question: "wil inschrijven voor een stage",
    keywords: [
      "stage",
      "kamp",
      "vakantie",
      "zomerstage",
      "paastage",
      "voetbalkamp",
    ],
    summary:
      "Check de evenementenpagina en schrijf in via het online formulier.",
    category: "administratief",
    icon: "activity",
    primaryContact: {
      role: "Evenementencoördinator",
      email: "evenementen@kcvvelewijt.be",
      department: "hoofdbestuur",
      orgLink: "/club/organigram",
    },
    steps: [
      {
        order: 1,
        description: "Check de evenementenpagina voor beschikbare stages",
        link: "/events",
      },
      {
        order: 2,
        description: "Vul het inschrijvingsformulier in voor de gewenste stage",
      },
      { order: 3, description: "Betaal het stagegeld volgens de instructies" },
      {
        order: 4,
        description: "Je ontvangt een bevestiging met praktische info",
        contact: {
          role: "Evenementencoördinator",
          email: "evenementen@kcvvelewijt.be",
        },
      },
    ],
  },
  {
    id: "mutualiteit-attest",
    role: ["ouder"],
    question: "wil het attest van mijn mutualiteit invullen",
    keywords: [
      "mutualiteit",
      "attest",
      "ziekenfonds",
      "terugbetaling",
      "dokter",
      "medisch",
    ],
    summary:
      "Neem contact op met de secretaris voor het clubstempel en de handtekening.",
    category: "administratief",
    icon: "clipboard-list",
    primaryContact: {
      role: "Secretaris",
      email: "secretaris@kcvvelewijt.be",
      department: "hoofdbestuur",
      orgLink: "/club/organigram",
    },
    steps: [
      {
        order: 1,
        description: "Download of vraag het attest bij je mutualiteit",
      },
      { order: 2, description: "Vul het attest in met de nodige gegevens" },
      {
        order: 3,
        description:
          "Bezorg het attest aan de secretaris voor het clubstempel en de handtekening",
        contact: { role: "Secretaris", email: "secretaris@kcvvelewijt.be" },
      },
    ],
  },
  {
    id: "ongepast-gedrag-rapporteren",
    role: ["speler", "ouder", "trainer"],
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
    summary:
      "Neem vertrouwelijk contact op met de voorzitter of de vertrouwenspersoon.",
    category: "gedrag",
    icon: "shield",
    primaryContact: {
      role: "Voorzitter",
      email: "voorzitter@kcvvelewijt.be",
      department: "hoofdbestuur",
      orgLink: "/club/organigram",
    },
    steps: [
      {
        order: 1,
        description:
          "Documenteer het incident (datum, tijd, wat er gebeurde, getuigen)",
      },
      {
        order: 2,
        description: "Neem vertrouwelijk contact op met de voorzitter",
        contact: { role: "Voorzitter", email: "voorzitter@kcvvelewijt.be" },
      },
      {
        order: 3,
        description: "Of contacteer de vertrouwenspersoon indien beschikbaar",
      },
      {
        order: 4,
        description: "Je melding wordt discreet en serieus behandeld",
      },
    ],
  },
  {
    id: "ongeval-speler-training",
    role: ["speler", "ouder"],
    question: "heb een ongeval op training/wedstrijd",
    keywords: [
      "ongeval",
      "blessure",
      "letsel",
      "kwetsuur",
      "pijn",
      "training",
      "wedstrijd",
      "geblesseerd",
    ],
    summary:
      "Meld het ongeval onmiddellijk bij je trainer en neem contact op met de verzekeringverantwoordelijke.",
    category: "medisch",
    icon: "heart",
    primaryContact: {
      role: "Verzekeringverantwoordelijke",
      email: "verzekering@kcvvelewijt.be",
      department: "algemeen",
      orgLink: "/club/organigram",
    },
    steps: [
      {
        order: 1,
        description:
          "Meld het ongeval onmiddellijk bij je trainer of ploegverantwoordelijke",
      },
      {
        order: 2,
        description:
          "Raadpleeg indien nodig een arts of ga naar de spoeddienst",
      },
      {
        order: 3,
        description: "Contacteer de verzekeringverantwoordelijke binnen 48 uur",
        contact: {
          role: "Verzekeringverantwoordelijke",
          email: "verzekering@kcvvelewijt.be",
        },
      },
      {
        order: 4,
        description: "Vul het ongevalformulier in (beschikbaar via de club)",
        link: "/club/downloads",
      },
    ],
  },
  {
    id: "prosoccerdata-gebruiken",
    role: ["speler", "ouder", "trainer"],
    question: "wil graag weten hoe ik ProSoccerData kan gebruiken",
    keywords: [
      "prosoccerdata",
      "app",
      "software",
      "login",
      "account",
      "toegang",
    ],
    summary:
      "Vraag je logingegevens bij je trainer of de technisch coördinator.",
    category: "algemeen",
    icon: "smartphone",
    primaryContact: {
      role: "Technisch Coördinator",
      email: "technisch@kcvvelewijt.be",
      department: "hoofdbestuur",
      orgLink: "/club/organigram",
    },
    steps: [
      { order: 1, description: "Vraag je logingegevens bij je trainer" },
      {
        order: 2,
        description: "Download de ProSoccerData app of ga naar de website",
        link: "https://www.prosoccerdata.com",
      },
      { order: 3, description: "Log in met je persoonlijke gegevens" },
      {
        order: 4,
        description: "Bij problemen, contacteer de technisch coördinator",
        contact: {
          role: "Technisch Coördinator",
          email: "technisch@kcvvelewijt.be",
        },
      },
    ],
  },
  {
    id: "sportief-verantwoordelijke-zoeken",
    role: ["speler", "ouder"],
    question: "zoek de sportief verantwoordelijke voor mijn leeftijd",
    keywords: [
      "verantwoordelijke",
      "coördinator",
      "trainer",
      "leeftijdscategorie",
      "ploeg",
    ],
    summary: "Check het organigram of neem contact op met de jeugdcoördinator.",
    category: "sportief",
    icon: "user",
    primaryContact: {
      role: "Jeugdcoördinator",
      email: "jeugd@kcvvelewijt.be",
      department: "jeugdbestuur",
      orgLink: "/club/organigram",
    },
    steps: [
      {
        order: 1,
        description:
          "Bekijk het organigram voor een overzicht van alle verantwoordelijken",
        link: "/club/organigram",
      },
      {
        order: 2,
        description:
          'Filter op "Jeugdbestuur" om de leeftijdscoördinatoren te zien',
      },
      {
        order: 3,
        description: "Of contacteer de algemene jeugdcoördinator",
        contact: { role: "Jeugdcoördinator", email: "jeugd@kcvvelewijt.be" },
      },
    ],
  },
  {
    id: "trainer-worden",
    role: ["niet-lid"],
    question: "wil graag trainer worden",
    keywords: [
      "trainer",
      "coach",
      "trainers",
      "vrijwilliger",
      "helpen",
      "werken",
    ],
    summary:
      "Neem contact op met de technisch coördinator of jeugdcoördinator.",
    category: "algemeen",
    icon: "graduation-cap",
    primaryContact: {
      role: "Technisch Coördinator",
      email: "technisch@kcvvelewijt.be",
      department: "hoofdbestuur",
      orgLink: "/club/organigram",
    },
    steps: [
      {
        order: 1,
        description:
          "Contacteer de technisch coördinator (senioren) of jeugdcoördinator (jeugd)",
        contact: {
          role: "Technisch Coördinator",
          email: "technisch@kcvvelewijt.be",
        },
      },
      { order: 2, description: "Bespreek je ervaring en beschikbaarheid" },
      {
        order: 3,
        description: "Volg eventueel een trainerscursus indien nodig",
      },
      {
        order: 4,
        description:
          "Doorloop de nodige administratieve stappen (verzekering, VOG)",
      },
    ],
  },
  {
    id: "wedstrijden-zoeken",
    role: ["speler", "ouder", "supporter"],
    question: "zoek mijn wedstrijden",
    keywords: [
      "wedstrijden",
      "kalender",
      "programma",
      "uitslagen",
      "schema",
      "wanneer spelen",
    ],
    summary:
      "Bekijk de wedstrijdkalender op de website of gebruik ProSoccerData.",
    category: "sportief",
    icon: "calendar",
    primaryContact: { role: "Website", email: "communicatie@kcvvelewijt.be" },
    steps: [
      {
        order: 1,
        description: "Ga naar de teampage van je ploeg op de website",
        link: "/team",
      },
      {
        order: 2,
        description: 'Bekijk het wedstrijdschema onder "Wedstrijden"',
      },
      {
        order: 3,
        description: "Of gebruik ProSoccerData voor real-time updates",
        link: "https://www.prosoccerdata.com",
      },
    ],
  },
];
