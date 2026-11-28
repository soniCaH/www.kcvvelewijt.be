/** PROTOTYPE — throwaway. Do not ship. See #3911. */

// Copy is verbatim from docs/editorial/reglementen-en-beleid/page.md (#3911).
// `forWho` is NOT agreed copy: a short prototype label taken from pile.md.

export type Inline = string | { text: string; href?: string; strong?: boolean };

export interface PrototypeDoc {
  slug: string;
  title: string;
  forWho: string;
  intro: Inline[];
  /** Download button label, without the "(PDF, N bladen)" tail. */
  label: string;
  pages: number;
}

export interface PrototypeGroup {
  id: string;
  title: string;
  docs: PrototypeDoc[];
}

export const pagesLabel = (n: number): string =>
  n === 1 ? "1 blad" : `${n} bladen`;

export const pdfHref = (slug: string): string => `#pdf-${slug}`;

export const INTRO_LEAD: Inline[] = [
  "Bij KCVV Elewijt, de plezantste compagnie, zorgen we voor mekaar. Daarvoor maken we duidelijke afspraken: voor spelers, ouders, begeleiders en iedereen die onze sportsite betreedt.",
];

export const INTRO_SAFE: Inline[] = [
  "Elk kind moet zich veilig voelen bij onze club. Zie of voel je iets dat niet klopt? Ons Aanspreekpunt Integriteit (API) luistert, vertrouwelijk en zonder drempel.",
];

export const API_LINE: Inline[] = [
  { text: "Aanspreekpunt Integriteit:", strong: true },
  " mail naar ",
  { text: "api@kcvvelewijt.be", href: "mailto:api@kcvvelewijt.be" },
  ". Liever bellen of iemand spreken? ",
  {
    text: "Hier vind je wie onze API is",
    href: "/hulp?categorie=gedrag#hulp",
  },
  ".",
];

export const INTRO_INDEX: Inline[] = [
  "Hieronder vind je al onze afspraken: van Trots op 55, onze gedragscode (55 is ons stamnummer bij de voetbalbond), tot de huisregels van de sportsite.",
];

/** The ethische code renders right after this document when `?code=on`. */
export const ETHICS_AFTER_SLUG = "integriteit";

export const ETHICS = {
  title: "De ethische code van de voetbalbond",
  lead: 'KCVV Elewijt volgt de ethische code "naast het veld" van de Belgische voetbalbond:',
  items: [
    "We leven de toepasselijke wetgeving en de reglementen na.",
    "We behandelen iedereen rechtvaardig, eerlijk en met respect.",
    "We zijn statutair neutraal en omarmen de diversiteit binnen onze organisatie en de samenleving.",
    "We vermijden te allen tijde belangenconflicten.",
    "We beschermen en maken correct gebruik van de middelen van de federatie.",
    "We gaan respectvol om met vertrouwelijke informatie en beschermen de persoonsgegevens in ons bezit en beheer.",
    "We drukken ons steeds loyaal uit tegenover de pers en op sociale media.",
    "Onze bedrijfsvoering gebeurt op transparante wijze.",
    "We hanteren een nultolerantie ten aanzien van elke vorm van omkoping.",
    "We nemen geen deel aan gokactiviteiten en tolereren geen enkele vorm van matchfixing.",
  ],
  after:
    "Loyaal zijn betekent voor ons niet dat je nooit kritiek mag hebben, ook niet op de club. Zit je iets dwars? Zeg het ons gerust, het liefst rechtstreeks: aan de trainer, het (jeugd)bestuur of de API.",
} as const;

export const GROUPS: PrototypeGroup[] = [
  {
    id: "samen-veilig",
    title: "Samen veilig en respectvol",
    docs: [
      {
        slug: "trots-op-55",
        title: "Trots op 55",
        forWho: "Iedereen in de club",
        intro: [
          "Onze gedragscode in vijf regels, voor iedereen in de club: er is maar één plezantste compagnie, onze begeleiders zijn rolmodellen, onze spelers worden onze grootste supporters, onze ouders voelen zich betrokken, en onze omgeving is trots op onze club.",
        ],
        label: "Trots op 55",
        pages: 1,
      },
      {
        slug: "integriteit",
        title: "Integriteit en grensoverschrijdend gedrag",
        forWho: "Iedereen, vooral ouders",
        intro: [
          "Wat verstaan we onder grensoverschrijdend gedrag, en wat doen we als het gebeurt? Dit document beschrijft de vormen die de voetbalbond onderscheidt, de rol van onze API, onze ethische code en hoe we een melding of klacht behandelen.",
        ],
        label: "Integriteit en grensoverschrijdend gedrag",
        pages: 4,
      },
      {
        slug: "voetbal-groot-ouder",
        title: "De ideale voetbal(groot)ouder",
        forWho: "Ouders, grootouders, supporters",
        intro: [
          "Een brief aan ouders, grootouders en supporters. Moedig positief aan, kijk naar het hele team en respecteer de scheidsrechter, de tegenstander en onze trainers: zij zijn vrijwilligers.",
        ],
        label: "De ideale voetbal(groot)ouder",
        pages: 1,
      },
    ],
  },
  {
    id: "jeugd",
    title: "Voor jeugdspelers en ouders",
    docs: [
      {
        slug: "intern-reglement-jeugd",
        title: "Intern reglement jeugd",
        forWho: "Jeugdspelers en ouders",
        intro: [
          "Alle praktische afspraken voor jeugdspelers en hun ouders: afmelden, vervoer, kledij, kleedkamers, ophalen en sancties. Afmelden doe je minstens 24 uur vooraf via PSD (ProSoccerData), de app waarin de club ook alle officiële berichten, wedstrijd- en trainingsschema's en wijzigingen deelt.",
        ],
        label: "Intern reglement jeugd",
        pages: 4,
      },
      {
        slug: "blessures",
        title: "Blessures en revalidatie",
        forWho: "Geblesseerde jeugdspelers en ouders",
        intro: [
          "Geblesseerd? Lees hoe je revalideert met onze clubkinesist, wat de verzekering van de voetbalbond terugbetaalt en welke termijnen je niet mag missen. Een ongeval op training of wedstrijd meld je binnen de week: ",
          { text: "zo doe je dat", href: "/hulp#sportongeval" },
          ".",
        ],
        label: "Blessures en revalidatie",
        pages: 1,
      },
      {
        slug: "lifestyle",
        title: "Lifestyle en gezondheid",
        forWho: "Jeugdspelers en ouders",
        intro: [
          "Hoe we jeugdspelers helpen gezond te kiezen: eten, drinken, slapen, hygiëne, en geen alcohol, tabak of vapes tijdens clubactiviteiten. Met de jaarplanning van onze gezondheidsposters: elke maand één thema.",
        ],
        label: "Lifestyle- en gezondheidsbeleid jeugd",
        pages: 3,
      },
      {
        slug: "opleidingsvisie",
        title: "Opleidingsvisie",
        forWho: "Ouders en trainers",
        intro: [
          "Hoe we spelers opleiden, van de voetbalspeeltuin tot de U21: fun and formation, per leeftijdsgroep uitgewerkt. Kinderen komen met goesting naar de training en gaan met tegengoesting naar huis.",
        ],
        label: "Opleidingsvisie jeugd",
        pages: 34,
      },
    ],
  },
  {
    id: "sportsite",
    title: "Op de sportsite",
    docs: [
      {
        slug: "rio",
        title: "Reglement van Inwendige Orde",
        forWho: "Iedereen op de sportsite",
        intro: [
          "De huisregels van onze sportsite, het Reglement van Inwendige Orde (RIO). Ze gelden voor iedereen, op elk evenement: wie de sportsite betreedt, aanvaardt ze. Je leest er onder meer welke voorwerpen en welk gedrag niet toegelaten zijn.",
        ],
        label: "Reglement van Inwendige Orde",
        pages: 6,
      },
    ],
  },
];

export const CLOSING_LINE: Inline[] = [
  "Staat je vraag er niet bij? Op ",
  { text: "de hulppagina", href: "/hulp" },
  " vind je altijd de juiste persoon.",
];
