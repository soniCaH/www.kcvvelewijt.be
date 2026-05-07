export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: ReadonlyArray<FooterLink>;
}

export const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    heading: "Ontdek",
    links: [
      { label: "Nieuws", href: "/nieuws" },
      { label: "Kalender", href: "/kalender" },
      { label: "Evenementen", href: "/events" },
      { label: "Onze ploegen", href: "/ploegen" },
      { label: "Jeugdwerking", href: "/jeugd" },
    ],
  },
  {
    heading: "Aansluiten",
    links: [
      { label: "Als speler", href: "/club/inschrijven" },
      { label: "Als vrijwilliger", href: "/club/vrijwilliger" },
      { label: "Als sponsor", href: "/sponsors" },
    ],
  },
  {
    heading: "Bij de club",
    links: [
      { label: "Geschiedenis", href: "/club/geschiedenis" },
      { label: "Bestuur", href: "/club/bestuur" },
      { label: "Contact", href: "/club/contact" },
      { label: "Praktische info", href: "/club" },
    ],
  },
];

export const FOOTER_FOUNDING_YEAR = 1909;
export const FOOTER_ADDRESS_LINE = "Driesstraat 32 · 1982 Elewijt";
