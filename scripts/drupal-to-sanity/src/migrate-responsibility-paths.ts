import "dotenv/config";
import { createDoc, client } from "./sanity-uploader";

// Static data from the web app — copied inline to avoid cross-package imports in this script context
const responsibilityPaths = [
  {
    id: "club-sponsoren",
    role: ["niet-lid"],
    question: "wil de club graag sponsoren",
    keywords: ["sponsor", "sponsoring", "adverteren", "reclame", "partnership", "steun"],
    summary: "Neem contact op met de sponsoringverantwoordelijke voor de mogelijkheden.",
    category: "commercieel",
    icon: "handshake",
    primaryContact: {
      role: "Verantwoordelijke Sponsoring",
      email: "sponsoring@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    steps: [
      { description: "Bekijk de sponsormogelijkheden op de website", link: "/sponsors" },
      { description: "Contacteer de verantwoordelijke sponsoring voor een gesprek", contact: { role: "Verantwoordelijke Sponsoring", email: "sponsoring@kcvvelewijt.be" } },
      { description: "Bespreek de verschillende pakketten en mogelijkheden" },
      { description: "Onderteken de sponsorovereenkomst" },
    ],
  },
  {
    id: "herstel-blessure",
    role: ["speler", "ouder"],
    question: "ben hersteld van mijn ongeval/blessure",
    keywords: ["hersteld", "beter", "genezen", "terug trainen", "comeback", "opnieuw spelen"],
    summary: "Breng je trainer op de hoogte en lever een medisch attest af indien vereist.",
    category: "medisch",
    icon: "zap",
    primaryContact: {
      role: "Trainer",
      department: "jeugdbestuur",
    },
    steps: [
      { description: "Breng je trainer op de hoogte dat je weer kan trainen" },
      { description: "Bezorg een medisch attest indien de blessure langer dan 21 dagen duurde" },
      { description: "Volg de aanwijzingen van je trainer voor geleidelijke herstart" },
    ],
  },
  {
    id: "inschrijving-nieuw-lid",
    role: ["niet-lid", "ouder"],
    question: "wil mij graag inschrijven",
    keywords: ["inschrijven", "lid worden", "aansluiten", "nieuwe speler", "lidmaatschap", "registratie"],
    summary: "Gebruik het online inschrijvingsformulier of neem contact op met de jeugdsecretaris.",
    category: "administratief",
    icon: "file-text",
    primaryContact: {
      role: "Jeugdsecretaris",
      email: "jeugd@kcvvelewijt.be",
      department: "jeugdbestuur",
    },
    steps: [
      { description: "Ga naar de inschrijvingspagina op de website", link: "/club/register" },
      { description: "Vul het online formulier in met alle gevraagde gegevens" },
      { description: "Bezorg de nodige documenten: identiteitskaart, medisch attest, pasfoto" },
      { description: "Betaal het lidgeld volgens de instructies" },
      { description: "Je ontvangt een bevestiging per e-mail", contact: { role: "Jeugdsecretaris", email: "jeugd@kcvvelewijt.be" } },
    ],
  },
  {
    id: "inschrijving-stage",
    role: ["ouder", "speler"],
    question: "wil inschrijven voor een stage",
    keywords: ["stage", "kamp", "vakantie", "zomerstage", "paastage", "voetbalkamp"],
    summary: "Check de evenementenpagina en schrijf in via het online formulier.",
    category: "administratief",
    icon: "activity",
    primaryContact: {
      role: "Evenementencoördinator",
      email: "evenementen@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    steps: [
      { description: "Check de evenementenpagina voor beschikbare stages", link: "/events" },
      { description: "Vul het inschrijvingsformulier in voor de gewenste stage" },
      { description: "Betaal het stagegeld volgens de instructies" },
      { description: "Je ontvangt een bevestiging met praktische info", contact: { role: "Evenementencoördinator", email: "evenementen@kcvvelewijt.be" } },
    ],
  },
  {
    id: "mutualiteit-attest",
    role: ["ouder"],
    question: "wil het attest van mijn mutualiteit invullen",
    keywords: ["mutualiteit", "attest", "ziekenfonds", "terugbetaling", "dokter", "medisch"],
    summary: "Neem contact op met de secretaris voor het clubstempel en de handtekening.",
    category: "administratief",
    icon: "clipboard-list",
    primaryContact: {
      role: "Secretaris",
      email: "secretaris@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    steps: [
      { description: "Download of vraag het attest bij je mutualiteit" },
      { description: "Vul het attest in met de nodige gegevens" },
      { description: "Bezorg het attest aan de secretaris voor het clubstempel en de handtekening", contact: { role: "Secretaris", email: "secretaris@kcvvelewijt.be" } },
    ],
  },
  {
    id: "ongepast-gedrag-rapporteren",
    role: ["speler", "ouder", "trainer"],
    question: "wil graag ongepast gedrag rapporteren",
    keywords: ["ongepast", "gedrag", "klacht", "pesten", "discriminatie", "grensoverschrijdend", "melding"],
    summary: "Neem vertrouwelijk contact op met de voorzitter of de vertrouwenspersoon.",
    category: "gedrag",
    icon: "shield",
    primaryContact: {
      role: "Voorzitter",
      email: "voorzitter@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    steps: [
      { description: "Documenteer het incident (datum, tijd, wat er gebeurde, getuigen)" },
      { description: "Neem vertrouwelijk contact op met de voorzitter", contact: { role: "Voorzitter", email: "voorzitter@kcvvelewijt.be" } },
      { description: "Of contacteer de vertrouwenspersoon indien beschikbaar" },
      { description: "Je melding wordt discreet en serieus behandeld" },
    ],
  },
  {
    id: "ongeval-speler-training",
    role: ["speler", "ouder"],
    question: "heb een ongeval op training/wedstrijd",
    keywords: ["ongeval", "blessure", "letsel", "kwetsuur", "pijn", "training", "wedstrijd", "geblesseerd"],
    summary: "Meld het ongeval onmiddellijk bij je trainer en neem contact op met de verzekeringverantwoordelijke.",
    category: "medisch",
    icon: "heart",
    primaryContact: {
      role: "Verzekeringverantwoordelijke",
      email: "verzekering@kcvvelewijt.be",
      department: "algemeen",
    },
    steps: [
      { description: "Meld het ongeval onmiddellijk bij je trainer of ploegverantwoordelijke" },
      { description: "Raadpleeg indien nodig een arts of ga naar de spoeddienst" },
      { description: "Contacteer de verzekeringverantwoordelijke binnen 48 uur", contact: { role: "Verzekeringverantwoordelijke", email: "verzekering@kcvvelewijt.be" } },
      { description: "Vul het ongevalformulier in (beschikbaar via de club)", link: "/club/downloads" },
    ],
  },
  {
    id: "prosoccerdata-gebruiken",
    role: ["speler", "ouder", "trainer"],
    question: "wil graag weten hoe ik ProSoccerData kan gebruiken",
    keywords: ["prosoccerdata", "app", "software", "login", "account", "toegang"],
    summary: "Vraag je logingegevens bij je trainer of de technisch coördinator.",
    category: "algemeen",
    icon: "smartphone",
    primaryContact: {
      role: "Technisch Coördinator",
      email: "technisch@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    steps: [
      { description: "Vraag je logingegevens bij je trainer" },
      { description: "Download de ProSoccerData app of ga naar de website", link: "https://www.prosoccerdata.com" },
      { description: "Log in met je persoonlijke gegevens" },
      { description: "Bij problemen, contacteer de technisch coördinator", contact: { role: "Technisch Coördinator", email: "technisch@kcvvelewijt.be" } },
    ],
  },
  {
    id: "sportief-verantwoordelijke-zoeken",
    role: ["speler", "ouder"],
    question: "zoek de sportief verantwoordelijke voor mijn leeftijd",
    keywords: ["verantwoordelijke", "coördinator", "trainer", "leeftijdscategorie", "ploeg"],
    summary: "Check het organigram of neem contact op met de jeugdcoördinator.",
    category: "sportief",
    icon: "user",
    primaryContact: {
      role: "Jeugdcoördinator",
      email: "jeugd@kcvvelewijt.be",
      department: "jeugdbestuur",
    },
    steps: [
      { description: "Bekijk het organigram voor een overzicht van alle verantwoordelijken", link: "/club/organigram" },
      { description: 'Filter op "Jeugdbestuur" om de leeftijdscoördinatoren te zien' },
      { description: "Of contacteer de algemene jeugdcoördinator", contact: { role: "Jeugdcoördinator", email: "jeugd@kcvvelewijt.be" } },
    ],
  },
  {
    id: "trainer-worden",
    role: ["niet-lid"],
    question: "wil graag trainer worden",
    keywords: ["trainer", "coach", "trainers", "vrijwilliger", "helpen", "werken"],
    summary: "Neem contact op met de technisch coördinator of jeugdcoördinator.",
    category: "algemeen",
    icon: "graduation-cap",
    primaryContact: {
      role: "Technisch Coördinator",
      email: "technisch@kcvvelewijt.be",
      department: "hoofdbestuur",
    },
    steps: [
      { description: "Contacteer de technisch coördinator (senioren) of jeugdcoördinator (jeugd)", contact: { role: "Technisch Coördinator", email: "technisch@kcvvelewijt.be" } },
      { description: "Bespreek je ervaring en beschikbaarheid" },
      { description: "Volg eventueel een trainerscursus indien nodig" },
      { description: "Doorloop de nodige administratieve stappen (verzekering, VOG)" },
    ],
  },
  {
    id: "wedstrijden-zoeken",
    role: ["speler", "ouder", "supporter"],
    question: "zoek mijn wedstrijden",
    keywords: ["wedstrijden", "kalender", "programma", "uitslagen", "schema", "wanneer spelen"],
    summary: "Bekijk de wedstrijdkalender op de website of gebruik ProSoccerData.",
    category: "sportief",
    icon: "calendar",
    primaryContact: {
      role: "Website",
      email: "communicatie@kcvvelewijt.be",
    },
    steps: [
      { description: "Ga naar de teampage van je ploeg op de website", link: "/team" },
      { description: 'Bekijk het wedstrijdschema onder "Wedstrijden"' },
      { description: "Of gebruik ProSoccerData voor real-time updates", link: "https://www.prosoccerdata.com" },
    ],
  },
];

interface StepData {
  description: string;
  link?: string;
  contact?: { role: string; email?: string };
}

interface PathData {
  id: string;
  role: string[];
  question: string;
  keywords: string[];
  summary: string;
  category: string;
  icon: string;
  primaryContact: { role: string; email?: string; department?: string };
  steps: StepData[];
}

async function findStaffMemberByEmail(email: string): Promise<string | null> {
  const result = await client.fetch<{ _id: string } | null>(
    '*[_type == "staffMember" && email == $email][0]{_id}',
    { email },
  );
  return result?._id ?? null;
}

async function mapContact(contact: { role: string; email?: string; department?: string }) {
  if (contact.email) {
    const staffId = await findStaffMemberByEmail(contact.email);
    if (staffId) {
      return {
        staffMember: { _type: "reference", _ref: staffId },
        role: contact.role,
        ...(contact.department ? { department: contact.department } : {}),
      };
    }
  }
  return {
    role: contact.role,
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.department ? { department: contact.department } : {}),
  };
}

async function mapPath(path: PathData) {
  const [primaryContact, ...stepContacts] = await Promise.all([
    mapContact(path.primaryContact),
    ...path.steps.map((step) =>
      step.contact ? mapContact(step.contact) : Promise.resolve(null),
    ),
  ]);

  return {
    _type: "responsibilityPath",
    _id: `responsibility-path-${path.id}`,
    title: path.question.charAt(0).toUpperCase() + path.question.slice(1),
    slug: { _type: "slug", current: path.id },
    active: true,
    audience: path.role,
    question: path.question,
    keywords: path.keywords,
    summary: path.summary,
    category: path.category,
    icon: path.icon,
    primaryContact,
    steps: path.steps.map((step, i) => ({
      _type: "solutionStep",
      _key: Math.random().toString(36).slice(2),
      description: step.description,
      ...(step.link ? { link: step.link } : {}),
      ...(stepContacts[i] ? { contact: stepContacts[i] } : {}),
    })),
  };
}

async function main() {
  console.log(`Migrating ${responsibilityPaths.length} responsibility paths to Sanity...`);

  for (const path of responsibilityPaths) {
    const doc = await mapPath(path as PathData);
    await createDoc(doc as Record<string, unknown>);
    console.log(`  ✓ ${doc._id} (${path.id})`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
