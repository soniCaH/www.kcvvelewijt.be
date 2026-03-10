/**
 * Migrate hardcoded club pages (cashless, register, downloads) into Sanity `page` documents.
 *
 * Run against staging:    SANITY_DATASET=staging tsx src/migrate-pages.ts
 * Run against production: SANITY_DATASET=production tsx src/migrate-pages.ts
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import { client } from "./sanity-uploader";

// scripts/drupal-to-sanity is always the CWD when pnpm runs the script
const REPO_ROOT = resolve(process.cwd(), "../..");

// ─── Portable Text helpers ────────────────────────────────────────────────────

let keyCounter = 0;
const key = () => `k${++keyCounter}`;

interface Span {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}

interface MarkDef {
  _type: "link";
  _key: string;
  href: string;
}

interface Block {
  _type: "block";
  _key: string;
  style: string;
  listItem?: "bullet";
  level?: number;
  markDefs: MarkDef[];
  children: Span[];
}

interface FileAttachmentBlock {
  _type: "fileAttachment";
  _key: string;
  file: { _type: "file"; asset: { _type: "reference"; _ref: string } };
  label: string;
}

type BodyBlock = Block | FileAttachmentBlock;

function h2(text: string): Block {
  return {
    _type: "block",
    _key: key(),
    style: "h2",
    markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  };
}

function h3(text: string): Block {
  return {
    _type: "block",
    _key: key(),
    style: "h3",
    markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  };
}

function p(segments: Array<{ text: string; bold?: boolean; href?: string }>): Block {
  const markDefs: MarkDef[] = [];
  const children: Span[] = [];

  for (const seg of segments) {
    const marks: string[] = [];
    if (seg.bold) marks.push("strong");
    if (seg.href) {
      const linkKey = key();
      markDefs.push({ _type: "link", _key: linkKey, href: seg.href });
      marks.push(linkKey);
    }
    children.push({ _type: "span", _key: key(), text: seg.text, marks });
  }

  return { _type: "block", _key: key(), style: "normal", markDefs, children };
}

function bullet(segments: Array<{ text: string; bold?: boolean; href?: string }>): Block {
  const markDefs: MarkDef[] = [];
  const children: Span[] = [];

  for (const seg of segments) {
    const marks: string[] = [];
    if (seg.bold) marks.push("strong");
    if (seg.href) {
      const linkKey = key();
      markDefs.push({ _type: "link", _key: linkKey, href: seg.href });
      marks.push(linkKey);
    }
    children.push({ _type: "span", _key: key(), text: seg.text, marks });
  }

  return {
    _type: "block",
    _key: key(),
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs,
    children,
  };
}

function simpleP(text: string): Block {
  return p([{ text }]);
}

function simpleBullet(text: string): Block {
  return bullet([{ text }]);
}

function fileAttachment(assetRef: string, label: string): FileAttachmentBlock {
  return {
    _type: "fileAttachment",
    _key: key(),
    file: { _type: "file", asset: { _type: "reference", _ref: assetRef } },
    label,
  };
}

// ─── Page content ─────────────────────────────────────────────────────────────

const cashlessBody: BodyBlock[] = [
  h2("Wat"),
  p([
    { text: "Sinds januari 2023 werkt KCVV Elewijt met een " },
    { text: "cashless clubkaart", bold: true },
    {
      text: " in de kantine. De kaart vervangt de oude jetons en maakt het mogelijk om snel en eenvoudig te betalen. Je krijgt een gratis kaart aan de toog en laadt ze op met een bedrag naar keuze.",
    },
  ]),

  h2("Waarom"),
  bullet([{ text: "Correcte prijszetting:", bold: true }, { text: " elke consumptie wordt exact afgerekend — geen gedoe meer met wisselgeld of jetons." }]),
  bullet([{ text: "Voorraadbeheer:", bold: true }, { text: " de club kan de stock nauwkeurig opvolgen." }]),
  bullet([{ text: "Gemak:", bold: true }, { text: " geen cash nodig, geen jetons kwijtraken. Opladen kan aan de toog of via de app." }]),

  h2("Wat met mijn jetons?"),
  p([
    { text: "Supporters die nog jetons hebben, kunnen deze laten omzetten naar een cashless kaart. Elke jeton heeft een waarde van " },
    { text: "1 euro", bold: true },
    { text: " en wordt op je saldo gezet." },
  ]),

  h2("KNIP-app"),
  p([
    { text: "Op je clubkaart staat een QR-code waarmee je de kaart koppelt aan een persoonlijk account via de " },
    { text: "KNIP-app", bold: true },
    { text: " (beschikbaar op " },
    { text: "Apple iOS", href: "https://apps.apple.com/be/app/knip/id1596978498" },
    { text: " en " },
    { text: "Android", href: "https://play.google.com/store/apps/details?id=be.knip.app" },
    { text: ")." },
  ]),
  simpleP("Via de app kan je:"),
  simpleBullet("Je saldo raadplegen zonder de kaart te scannen"),
  simpleBullet("Betalen via je smartphone als je je kaart vergeten bent"),
  simpleBullet("Bij verlies of diefstal je saldo laten overzetten naar een nieuwe kaart"),

  h2("Komt eraan"),
  simpleBullet("Betalen via Payconiq"),
  simpleBullet("Je kaart vanop afstand opladen via de app — zonder aan te schuiven aan de toog"),

  h2("Algemene voorwaarden"),
  p([
    { text: "De volledige algemene voorwaarden van de cashless clubkaart zijn beschikbaar aan de toog of op aanvraag via " },
    { text: "info@kcvvelewijt.be", href: "mailto:info@kcvvelewijt.be" },
    { text: "." },
  ]),
];

const registerBody: BodyBlock[] = [
  h2("Inschrijvingen"),
  p([
    { text: "Alle spelers en speelsters vanaf 4-5 jaar zijn welkom om een/enkele proeftrainingen af te werken voor definitief in te schrijven. Hiervoor kan je contact opnemen met de trainer (" },
    { text: "overzicht", href: "/jeugd" },
    { text: ") of de jeugdverantwoordelijken." },
  ]),
  p([
    { text: "Overtuigd en wil je graag lid worden van KCVV Elewijt? Inschrijven kan wekelijks in onze kantine na afspraak met de GC via " },
    { text: "jeugd@kcvvelewijt.be", href: "mailto:jeugd@kcvvelewijt.be" },
    { text: "." },
  ]),

  h3("Bijdrage lidgeld"),
  bullet([
    { text: "CM: " },
    { text: "Aanvraag terugbetaling", href: "https://www.cm.be/media/Aanvraag-terugbetaling-inschrijving-sportvereniging_tcm47-24959.pdf" },
  ]),
  bullet([
    { text: "De Voorzorg/FSMB/Solidaris: " },
    { text: "Terugbetaling sport", href: "https://www.solidaris-vlaanderen.be/terugbetaling-sport" },
  ]),
  bullet([
    { text: "Liberale mutualiteit: " },
    { text: "Formulier terugbetaling sport", href: "https://www.lm-ml.be/nl/documenten/formulier-terugbetaling-sport" },
  ]),
  bullet([
    { text: "VNZ: " },
    { text: "Sport & fitnessclub", href: "https://www.vnz.be/voordelen-terugbetalingen/sport-fitnessclub/" },
  ]),
  bullet([
    { text: "OZ/Partena/Helan: " },
    { text: "Sportclub lidgeld", href: "https://www.helan.be/nl/ons-aanbod/ziekenfonds/voordelen-en-terugbetalingen/sportclub-lidgeld/" },
  ]),

  h2("ProSoccerData"),
  simpleP(
    "KCVV Elewijt gebruikt de tool \"ProSoccerData\" als primair en centraal communicatiemiddel tussen trainers, spelers, ouders... Via deze weg worden trainingen ingepland, wedstrijdselecties ingevuld, communicatie verzorgd, spelers en ouders op te hoogte gehouden van wijzigingen of evenementen enz...",
  ),
  simpleP("Elke speler of ouder krijgt toegang tot deze tool via een persoonlijke login."),
  p([
    { text: "Website: " },
    { text: "https://kcvv.prosoccerdata.com/", href: "https://kcvv.prosoccerdata.com/" },
  ]),

  h2("Steuntje via Trooper of Makro"),
  h3("Trooper"),
  simpleP(
    "Trooper werkt samen met een groot aantal webshops die zich in de kijker willen zetten. In ruil voor een extra klik via Trooper krijgen wij een percentje op jouw volgende bestelling.",
  ),
  p([
    { text: "Surf voor je een bestelling plaatst even via " },
    { text: "https://trooper.be/kcvvelewijt", href: "https://trooper.be/kcvvelewijt" },
    { text: "." },
  ]),
  p([
    { text: "Lees er meer over!", href: "/news/2020-04-12-steun-kcvv-elewijt-trooper-mymakro" },
  ]),

  h3("MyMakro"),
  simpleP("Link nu jouw Makro voordeelkaart aan onze vereniging. Bij elke aankoop bij Makro en partners steun je KCVV Elewijt!"),
  p([
    { text: "Surf naar " },
    { text: "https://my.makro.be/nl/link-vereniging/02277464", href: "https://my.makro.be/nl/link-vereniging/02277464" },
    { text: " om je kaart te koppelen." },
  ]),
  simpleP("Onze vereniging dankt jullie van harte!"),

  h2("Volg ons op sociale media"),
  bullet([{ text: "Facebook", href: "https://facebook.com/KCVVElewijt" }]),
  bullet([{ text: "X / Twitter", href: "https://twitter.com/kcvve" }]),
  bullet([{ text: "Instagram", href: "https://www.instagram.com/kcvve" }]),
];

// ─── PDF upload helper ────────────────────────────────────────────────────────

const PUBLIC_DIR = resolve(REPO_ROOT, "apps/web/public");

async function uploadPdf(filename: string): Promise<string> {
  const filepath = resolve(PUBLIC_DIR, "downloads", filename);
  console.log(`  Uploading ${filename}...`);
  const buffer = readFileSync(filepath);
  const asset = await client.assets.upload("file", buffer, { filename });
  console.log(`  Uploaded ${filename} → ${asset._id}`);
  return asset._id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dataset = process.env.SANITY_DATASET ?? "production";
  console.log(`\nMigrating pages to Sanity dataset: ${dataset}\n`);

  // ── Upload PDFs for downloads page ──────────────────────────────────────────
  console.log("Uploading PDFs...");
  const [accidentRef, rioRef, parentRef] = await Promise.all([
    uploadPdf("insurance_medical_attest_template_nl.pdf"),
    uploadPdf("reglement_inwendige_orde_2022.pdf"),
    uploadPdf("2022-2023_-_De_ideale_voetbalgrootouder.pdf"),
  ]);

  const downloadsBody: BodyBlock[] = [
    h2("Aangiftes"),
    fileAttachment(accidentRef, "Ongevalsaangifte"),

    h2("Reglementen"),
    fileAttachment(rioRef, "Reglement van Inwendige Orde"),
    fileAttachment(parentRef, "De 'ideale' voetbal(groot)ouders"),
  ];

  // ── Create page documents ────────────────────────────────────────────────────
  const pages = [
    {
      _id: "page-cashless",
      _type: "page",
      title: "Cashless Clubkaart",
      slug: { _type: "slug", current: "cashless" },
      body: cashlessBody,
    },
    {
      _id: "page-register",
      _type: "page",
      title: "Praktische Informatie",
      slug: { _type: "slug", current: "register" },
      body: registerBody,
    },
    {
      _id: "page-downloads",
      _type: "page",
      title: "Digitale documenten - downloads",
      slug: { _type: "slug", current: "downloads" },
      body: downloadsBody,
    },
  ];

  for (const page of pages) {
    console.log(`Creating page: ${page.title} (${page.slug.current})...`);
    await client.createOrReplace(page);
    console.log(`  ✓ ${page.slug.current}`);
  }

  console.log("\nDone! All pages migrated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
