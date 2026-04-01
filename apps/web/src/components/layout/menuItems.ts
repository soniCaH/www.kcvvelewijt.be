export interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

export const staticMenuItems: MenuItem[] = [
  { label: "Home", href: "/" },
  { label: "Nieuws", href: "/nieuws" },
  { label: "Evenementen", href: "/events" },
  { label: "Sponsors", href: "/sponsors" },
  { label: "Hulp", href: "/hulp" },
  {
    label: "De club",
    href: "/club",
    children: [
      { label: "Geschiedenis", href: "/club/geschiedenis" },
      { label: "Organigram", href: "/club/organigram" },
      { label: "Bestuur", href: "/club/bestuur" },
      { label: "Jeugdbestuur", href: "/club/jeugdbestuur" },
      { label: "KCVV Angels", href: "/club/angels" },
      { label: "KCVV Ultras", href: "/club/ultras" },
      { label: "Contact", href: "/club/contact" },
      { label: "Downloads", href: "/club/downloads" },
      { label: "Praktische Info", href: "/club/inschrijven" },
      { label: "Cashless clubkaart", href: "/club/cashless" },
    ],
  },
];

export const buildMenuItems = (
  seniorItems: (MenuItem | null)[],
  jeugdItem: MenuItem,
): MenuItem[] =>
  [
    ...staticMenuItems.slice(0, 3),
    ...seniorItems,
    jeugdItem,
    ...staticMenuItems.slice(3),
  ].filter((item): item is MenuItem => item !== null);
