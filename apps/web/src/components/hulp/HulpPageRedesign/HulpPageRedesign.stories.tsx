/**
 * Hulp Page Redesign — Visual Prototype (Approach B: Search + Browse)
 *
 * Replaces the current ResponsibilityFinder UX:
 * - No role dropdown (the inline "Ik ben [Speler] en ik [vraag]" pattern is gone)
 * - Big search input at the top of the gray section (no role pre-filter)
 * - Below the search: 6 categorized sections with question cards (browseable)
 * - Answer view: ONE prominent contact card + steps as plain text instructions —
 *   contact is shown ONCE, never repeated per step
 *
 * Two stories:
 * - Browse: empty search, full category browse below
 * - Answer: search filled with an example query, answer card displayed
 *
 * Mock data: 20 representative paths across the 6 production categories
 * (production has ~39 paths in Sanity, this prototype only needs enough for
 * visual evaluation).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  ChevronRight,
  Heart,
  Trophy,
  FileText,
  Users,
  Tag,
  User,
  Mail,
  Phone,
} from "@/lib/icons";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";

/* ---------------------------------------------------------------------------
 * Mock data — 20 representative responsibility paths across 6 categories
 * --------------------------------------------------------------------------- */

type CategoryKey =
  | "medisch"
  | "sportief"
  | "administratief"
  | "gedrag"
  | "algemeen"
  | "commercieel";

interface MockContact {
  name: string;
  role: string;
  email: string;
  phone?: string;
}

interface MockPath {
  id: string;
  category: CategoryKey;
  question: string;
  summary: string;
  contact: MockContact;
  steps: string[];
}

// Object literal type (no `Record<string, MockContact>` annotation) so
// TypeScript narrows each key to the specific MockContact and we don't
// need non-null assertions on lookups.
const CONTACTS = {
  jeugd: {
    name: "Lien Wouters",
    role: "Jeugdcoördinator",
    email: "jeugd@kcvvelewijt.be",
    phone: "+32 470 12 34 56",
  },
  secretariaat: {
    name: "Els Martens",
    role: "Secretaris",
    email: "secretariaat@kcvvelewijt.be",
    phone: "+32 471 23 45 67",
  },
  trainer: {
    name: "Marc Van den Berg",
    role: "Hoofdtrainer",
    email: "trainer@kcvvelewijt.be",
  },
  voorzitter: {
    name: "Jan Willems",
    role: "Voorzitter",
    email: "voorzitter@kcvvelewijt.be",
  },
  materiaal: {
    name: "Wim Goossens",
    role: "Materiaalmeester",
    email: "materiaal@kcvvelewijt.be",
  },
  sponsoring: {
    name: "Koen Peeters",
    role: "Sponsoring",
    email: "sponsors@kcvvelewijt.be",
    phone: "+32 472 34 56 78",
  },
  events: {
    name: "Sarah Mertens",
    role: "Evenementen",
    email: "events@kcvvelewijt.be",
  },
};

const mockPaths: MockPath[] = [
  // Medisch
  {
    id: "sportongeval-jeugd",
    category: "medisch",
    question: "Mijn kind heeft een sportongeval",
    summary: "Wat te doen na een ongeval op training of wedstrijd",
    contact: CONTACTS.jeugd,
    steps: [
      "Verleen onmiddellijk eerste hulp en bel indien nodig 112.",
      "Verwittig de trainer of afgevaardigde van het ongeval.",
      "Vraag binnen 48 uur het sportongevallenformulier op via het secretariaat.",
      "Vul het formulier in samen met de behandelende arts.",
      "Bezorg het ingevulde formulier terug aan het secretariaat binnen 14 dagen.",
    ],
  },
  {
    id: "mutualiteit-attest",
    category: "medisch",
    question: "Ik heb een attest van mijn mutualiteit nodig",
    summary: "Aanvragen van een attest voor terugbetaling lidgeld",
    contact: CONTACTS.secretariaat,
    steps: [
      "Mail je vraag met je naam en lidnummer.",
      "Vermeld de naam van je mutualiteit (CM, Solidaris, ...).",
      "Het attest wordt binnen 5 werkdagen per mail bezorgd.",
    ],
  },
  {
    id: "allergieen-medicatie",
    category: "medisch",
    question: "Ik wil een allergie of medicatie melden",
    summary: "Belangrijke medische info doorgeven aan trainer en afgevaardigde",
    contact: CONTACTS.jeugd,
    steps: [
      "Mail de jeugdcoördinator met de naam en leeftijd van het kind.",
      "Beschrijf de allergie of medicatie en wat te doen bij een reactie.",
      "Deze info wordt vertrouwelijk gedeeld met trainer en afgevaardigde.",
    ],
  },
  // Sportief
  {
    id: "proeftraining",
    category: "sportief",
    question: "Mag mijn kind een proeftraining doen?",
    summary: "Hoe vraag je een proeftraining aan voor de jeugd",
    contact: CONTACTS.jeugd,
    steps: [
      "Stuur een mail met naam, geboortedatum en huidige club.",
      "De jeugdcoördinator stelt een trainingsdatum voor met de juiste leeftijdsgroep.",
      "Kom op de afgesproken dag naar Sportpark Elewijt.",
    ],
  },
  {
    id: "ploegindeling",
    category: "sportief",
    question: "Vraag over de ploegindeling",
    summary: "Hoe wordt mijn kind ingedeeld in een ploeg",
    contact: CONTACTS.jeugd,
    steps: [
      "Bekijk eerst de visie van onze jeugdopleiding op de site.",
      "Heb je een specifieke vraag? Mail de jeugdcoördinator.",
      "Een gesprek wordt indien nodig ingepland.",
    ],
  },
  {
    id: "kind-niet-opgesteld",
    category: "sportief",
    question: "Mijn kind wordt niet opgesteld",
    summary: "Omgaan met speeltijd-discussies",
    contact: CONTACTS.trainer,
    steps: [
      "Bespreek dit eerst rechtstreeks met de trainer na de wedstrijd.",
      "Geef de trainer de kans om uit te leggen waarom de keuze gemaakt werd.",
      "Komt er geen oplossing? Contacteer de jeugdcoördinator.",
    ],
  },
  {
    id: "materiaal-ploeg",
    category: "sportief",
    question: "Vraag over materiaal voor de ploeg",
    summary: "Ballen, kegels, hesjes en ander trainingsmateriaal",
    contact: CONTACTS.materiaal,
    steps: [
      "Stel je vraag rechtstreeks aan de materiaalmeester via mail.",
      "Vermeld voor welke ploeg het materiaal nodig is.",
    ],
  },
  // Administratief
  {
    id: "lidgeld-inschrijving",
    category: "administratief",
    question: "Ik wil mij of mijn kind inschrijven",
    summary: "Lidmaatschap en lidgeld bij KCVV Elewijt",
    contact: CONTACTS.secretariaat,
    steps: [
      "Vul het inschrijvingsformulier in op onze website.",
      "Betaal het lidgeld via overschrijving of Payconiq.",
      "Je ontvangt een bevestiging zodra de betaling verwerkt is.",
      "Een spelerspas wordt aangevraagd via Voetbal Vlaanderen.",
    ],
  },
  {
    id: "transfer-aanvragen",
    category: "administratief",
    question: "Ik wil een transfer aanvragen",
    summary: "Transfer van of naar een andere club",
    contact: CONTACTS.secretariaat,
    steps: [
      "Mail het secretariaat met je naam en je huidige club.",
      "De secretaris start de transferaanvraag bij Voetbal Vlaanderen.",
      "Wacht op de bevestiging — meestal binnen 2 weken.",
    ],
  },
  {
    id: "afwezigheid-melden",
    category: "administratief",
    question: "Ik kan niet komen trainen of spelen",
    summary: "Een afwezigheid correct melden",
    contact: CONTACTS.trainer,
    steps: [
      "Verwittig je trainer ten laatste 24 uur op voorhand.",
      "Bij ziekte of blessure mag dit korter, maar verwittig zo snel mogelijk.",
    ],
  },
  {
    id: "kledij-uitrusting",
    category: "administratief",
    question: "Vraag over kledij of uitrusting",
    summary: "Kit, training, schoenen en bestellingen",
    contact: CONTACTS.materiaal,
    steps: [
      "Bekijk eerst onze webshop voor de standaard uitrusting.",
      "Voor maatadvies of bestellingen buiten de webshop: contacteer de materiaalmeester.",
    ],
  },
  // Gedrag
  {
    id: "conflict-ouder-speler",
    category: "gedrag",
    question: "Ik heb een conflict met een ouder of speler",
    summary: "Bemiddelen bij conflicten in en rond de club",
    contact: CONTACTS.jeugd,
    steps: [
      "Spreek het probleem eerst rustig uit met de andere persoon.",
      "Komt er geen oplossing? Contacteer de jeugdcoördinator voor bemiddeling.",
      "In ernstige gevallen wordt het bestuur betrokken.",
    ],
  },
  {
    id: "klacht-indienen",
    category: "gedrag",
    question: "Ik wil een klacht indienen",
    summary: "Formele klachtenprocedure bij het bestuur",
    contact: CONTACTS.voorzitter,
    steps: [
      "Stel je klacht schriftelijk op met een duidelijke beschrijving van de feiten.",
      "Mail de klacht naar de voorzitter.",
      "Het bestuur behandelt elke klacht binnen 14 dagen.",
    ],
  },
  {
    id: "fair-play",
    category: "gedrag",
    question: "Vraag over de Fair Play code",
    summary: "Onze gedragscode voor spelers, ouders en supporters",
    contact: CONTACTS.voorzitter,
    steps: [
      "Lees de Fair Play charter op onze website.",
      "Wordt ondertekend bij inschrijving — geldt voor het hele seizoen.",
    ],
  },
  // Algemeen
  {
    id: "vrijwilliger-worden",
    category: "algemeen",
    question: "Ik wil vrijwilliger worden bij de club",
    summary: "Helpende handen zijn altijd welkom",
    contact: CONTACTS.voorzitter,
    steps: [
      "Mail de voorzitter met je interesses (kantine, evenementen, jeugd, ...).",
      "Een korte kennismaking wordt ingepland.",
      "Je wordt gekoppeld aan de werkgroep waar je het best past.",
    ],
  },
  {
    id: "contactgegevens-wijzigen",
    category: "algemeen",
    question: "Ik wil mijn contactgegevens wijzigen",
    summary: "Adres, telefoonnummer of e-mail bijwerken",
    contact: CONTACTS.secretariaat,
    steps: [
      "Mail het secretariaat met je naam, lidnummer en de nieuwe gegevens.",
      "De wijziging wordt binnen 1 werkdag verwerkt.",
    ],
  },
  {
    id: "gevonden-voorwerpen",
    category: "algemeen",
    question: "Ik ben iets verloren of vond iets",
    summary: "Gevonden voorwerpen in de kantine of kleedkamer",
    contact: CONTACTS.materiaal,
    steps: [
      "Vraag eerst rond bij de trainer of in de kantine.",
      "Niets gevonden? Mail de materiaalmeester met een beschrijving.",
    ],
  },
  // Commercieel
  {
    id: "sponsor-worden",
    category: "commercieel",
    question: "Ik wil sponsor worden van KCVV",
    summary: "Word partner van onze club",
    contact: CONTACTS.sponsoring,
    steps: [
      "Bekijk onze sponsorpakketten op de sponsorspagina.",
      "Mail de sponsorverantwoordelijke voor een persoonlijk gesprek.",
      "Een sponsorovereenkomst wordt opgemaakt.",
    ],
  },
  {
    id: "evenement-organiseren",
    category: "commercieel",
    question: "Ik wil een evenement organiseren",
    summary: "Eigen evenement op het sportcomplex",
    contact: CONTACTS.events,
    steps: [
      "Mail de evenementenverantwoordelijke met een korte beschrijving.",
      "Vermeld de gewenste datum en het verwachte aantal deelnemers.",
      "Een vergadering wordt ingepland om de details te bespreken.",
    ],
  },
  {
    id: "kantine-huren",
    category: "commercieel",
    question: "Ik wil de kantine huren",
    summary: "Privéfeest of vergadering in onze kantine",
    contact: CONTACTS.events,
    steps: [
      "Mail je verzoek met datum, type evenement en aantal personen.",
      "We bevestigen de beschikbaarheid binnen 3 dagen.",
      "Een huurovereenkomst wordt opgemaakt.",
    ],
  },
];

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; color: string; icon: LucideIcon }
> = {
  medisch: { label: "Medisch", color: "text-red-500", icon: Heart },
  sportief: { label: "Sportief", color: "text-green-600", icon: Trophy },
  administratief: {
    label: "Administratief",
    color: "text-purple-500",
    icon: FileText,
  },
  gedrag: { label: "Gedrag", color: "text-orange-500", icon: Users },
  algemeen: { label: "Algemeen", color: "text-gray-500", icon: User },
  commercieel: { label: "Commercieel", color: "text-blue-500", icon: Tag },
};

const CATEGORY_ORDER: CategoryKey[] = [
  "medisch",
  "sportief",
  "administratief",
  "gedrag",
  "algemeen",
  "commercieel",
];

/* ---------------------------------------------------------------------------
 * Helper components
 * --------------------------------------------------------------------------- */

function SearchInput({
  value = "",
  placeholder,
}: {
  value?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-kcvv-gray">
        <Search className="h-6 w-6" />
      </div>
      <input
        type="text"
        defaultValue={value}
        placeholder={
          placeholder ?? "Bijv. inschrijving, sportongeval, ploegindeling..."
        }
        className="w-full rounded-sm border border-gray-200 bg-white py-5 pl-14 pr-5 text-base text-kcvv-black shadow-md placeholder:text-kcvv-gray focus:border-kcvv-green-bright focus:outline-none focus:ring-2 focus:ring-kcvv-green-bright/30"
      />
    </div>
  );
}

function QuestionCard({ path }: { path: MockPath }) {
  const meta = CATEGORY_META[path.category];
  const Icon = meta.icon;
  return (
    <a
      href="#"
      className="group flex items-start gap-4 rounded-sm border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-kcvv-green-bright hover:shadow-card-hover"
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-gray-50 ${meta.color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-title text-base font-bold leading-tight text-kcvv-black">
          {path.question}
        </h4>
        <p className="mt-1 text-sm leading-snug text-kcvv-gray">
          {path.summary}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 flex-shrink-0 self-center text-kcvv-gray transition-transform group-hover:translate-x-1 group-hover:text-kcvv-green-bright" />
    </a>
  );
}

function CategorySection({ category }: { category: CategoryKey }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const paths = mockPaths.filter((p) => p.category === category);
  if (paths.length === 0) return null;
  return (
    <div>
      <div className="mb-6 flex items-center gap-3 border-l-4 border-kcvv-green-bright pl-4">
        <Icon className={`h-7 w-7 shrink-0 ${meta.color}`} />
        {/* `!` modifiers force the size + font over the global h1-h6
            cascade in globals.css (which sets h3 to 24px / font-title /
            kcvv-gray-blue by default). Same pattern as SectionHeader. */}
        <h3 className="font-body! text-xl! font-black! uppercase tracking-tight! leading-none! text-kcvv-black! mb-0!">
          {meta.label}
        </h3>
        <span className="text-sm font-normal text-kcvv-gray">
          ({paths.length})
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {paths.map((p) => (
          <QuestionCard key={p.id} path={p} />
        ))}
      </div>
    </div>
  );
}

function BrowseContent() {
  return (
    <div className="space-y-12">
      {CATEGORY_ORDER.map((cat) => (
        <CategorySection key={cat} category={cat} />
      ))}
    </div>
  );
}

function ContactCard({ contact }: { contact: MockContact }) {
  return (
    <div className="rounded-sm border-l-4 border-kcvv-green-bright bg-white p-6 shadow-sm">
      <div className="mb-1 text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-green-dark">
        Contactpersoon
      </div>
      <div className="font-title text-2xl font-bold text-kcvv-black">
        {contact.name}
      </div>
      <div className="mt-1 text-sm text-kcvv-gray">{contact.role}</div>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex items-center gap-2 text-kcvv-black hover:text-kcvv-green-bright"
        >
          <Mail className="h-4 w-4 text-kcvv-green-dark" />
          {contact.email}
        </a>
        {contact.phone && (
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 text-kcvv-black hover:text-kcvv-green-bright"
          >
            <Phone className="h-4 w-4 text-kcvv-green-dark" />
            {contact.phone}
          </a>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ path }: { path: MockPath }) {
  const meta = CATEGORY_META[path.category];
  const Icon = meta.icon;
  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <a
        href="#"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.05em] text-kcvv-gray hover:text-kcvv-black"
      >
        ← Terug naar overzicht
      </a>

      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm bg-white shadow-sm ${meta.color}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div
            className={`text-xs font-bold uppercase tracking-[0.15em] ${meta.color}`}
          >
            {meta.label}
          </div>
          <h2 className="mt-1 font-title text-3xl font-black uppercase leading-tight text-kcvv-black md:text-4xl">
            {path.question}
          </h2>
          <p className="mt-2 text-base text-kcvv-gray">{path.summary}</p>
        </div>
      </div>

      {/* Two-column: contact + steps */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
        <ContactCard contact={path.contact} />
        <div>
          <div className="mb-4 text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-gray">
            Wat te doen
          </div>
          <ol className="space-y-3">
            {path.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kcvv-green-bright font-title text-sm font-black text-kcvv-black">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-kcvv-black">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {/* Feedback */}
          <div className="mt-8 flex items-center gap-3 rounded-sm bg-white p-4 text-sm text-kcvv-gray">
            <span>Was dit antwoord nuttig?</span>
            <button
              type="button"
              className="rounded-sm border border-gray-200 px-3 py-1 hover:border-kcvv-green-bright hover:text-kcvv-green-bright"
            >
              Ja
            </button>
            <button
              type="button"
              className="rounded-sm border border-gray-200 px-3 py-1 hover:border-kcvv-alert hover:text-kcvv-alert"
            >
              Nee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Section configs
 * --------------------------------------------------------------------------- */

const heroSection: SectionConfig = {
  key: "hero",
  bg: "kcvv-black",
  paddingTop: "pt-0",
  paddingBottom: "pb-0",
  content: (
    <PageHero
      size="compact"
      gradient="dark"
      label="Help"
      headline="Vind de juiste persoon"
      body="Stel je vraag of blader door de categorieën hieronder."
    />
  ),
  transition: { type: "diagonal", direction: "right", overlap: "full" },
};

const ctaSection: SectionConfig = {
  key: "cta",
  bg: "kcvv-green-dark",
  paddingTop: "pt-16",
  paddingBottom: "pb-16",
  content: (
    <SectionCta
      variant="dark"
      heading="Niet gevonden wat je zocht?"
      body="Stuur ons een bericht en we helpen je graag verder."
      buttonLabel="Contact opnemen"
      buttonHref="mailto:info@kcvvelewijt.be"
    />
  ),
};

/* ---------------------------------------------------------------------------
 * Meta + stories
 * --------------------------------------------------------------------------- */

const meta = {
  title: "Pages/Hulp Redesign",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Browse view — search input empty, full categorized browse below.
 */
export const Browse: Story = {
  render: () => {
    const sections: SectionConfig[] = [
      heroSection,
      {
        key: "search-browse",
        bg: "gray-100",
        content: (
          <div className="mx-auto max-w-inner-lg space-y-16 px-4 md:px-10">
            <div>
              <SearchInput />
              <p className="mt-3 text-center text-xs text-kcvv-gray">
                Tip: probeer trefwoorden zoals <em>inschrijving</em>,{" "}
                <em>sportongeval</em>, of <em>transfer</em>.
              </p>
            </div>
            <BrowseContent />
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      ctaSection,
    ];
    return <SectionStack sections={sections} />;
  },
};

/**
 * Answer view — example query in the search input, answer card displayed
 * below. Demonstrates the new "one contact, never repeated" pattern.
 */
export const Answer: Story = {
  render: () => {
    const path =
      mockPaths.find((p) => p.id === "lidgeld-inschrijving") ?? mockPaths[0];
    if (!path) return <div>Mock path not found</div>;
    const sections: SectionConfig[] = [
      heroSection,
      {
        key: "search-answer",
        bg: "gray-100",
        content: (
          <div className="mx-auto max-w-inner-lg space-y-12 px-4 md:px-10">
            <SearchInput value="inschrijving" />
            <AnswerCard path={path} />
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      ctaSection,
    ];
    return <SectionStack sections={sections} />;
  },
};
