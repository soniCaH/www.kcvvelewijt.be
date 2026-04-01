import type { TeamNavVM } from "@/lib/repositories/team.repository";

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

// Senior/jeugd items are inserted after the first 3 static items (Home, Nieuws, Evenementen)
const HEADER_COUNT = 3;

export const buildMenuItems = (
  seniorItems: (MenuItem | null)[],
  jeugdItem: MenuItem,
): MenuItem[] =>
  [
    ...staticMenuItems.slice(0, HEADER_COUNT),
    ...seniorItems,
    jeugdItem,
    ...staticMenuItems.slice(HEADER_COUNT),
  ].filter((item): item is MenuItem => item !== null);

export const buildSeniorMenuItem = (
  team: TeamNavVM | undefined,
  label: string,
): MenuItem | null => {
  if (!team?.slug) return null;
  const href = `/ploegen/${team.slug}`;
  return {
    label,
    href,
    children: [
      { label: "Info", href },
      { label: "Spelers & Staff", href: `${href}?tab=opstelling` },
      { label: "Wedstrijden", href: `${href}?tab=wedstrijden` },
      { label: "Stand", href: `${href}?tab=klassement` },
    ],
  };
};

export const seniorNavLabel = (name: string): string => {
  const lastWord = name.trim().split(/\s+/).at(-1) ?? name;
  return /^[A-Z]$/.test(lastWord) ? `${lastWord}-Ploeg` : name;
};

export const buildJeugdItem = (youthTeams?: TeamNavVM[]): MenuItem => {
  const children = youthTeams
    ?.filter((t) => t.age != null)
    .map((t) => ({
      label: t.age!,
      href: `/ploegen/${t.slug}`,
    }));
  return {
    label: "Jeugd",
    href: "/jeugd",
    children: children?.length ? children : undefined,
  };
};

export const isMenuItemActive = (
  href: string,
  pathname: string,
  searchParams: URLSearchParams,
): boolean => {
  const [itemPath, itemQuery] = href.split("?");

  if (itemPath === "/") {
    return pathname === "/" && !itemQuery;
  }

  if (pathname === itemPath && !itemQuery) {
    return true;
  }

  if (itemQuery) {
    const itemParams = new URLSearchParams(itemQuery);
    const itemTab = itemParams.get("tab");
    return pathname === itemPath && searchParams.get("tab") === itemTab;
  }

  if (pathname?.startsWith(itemPath + "/")) {
    return true;
  }

  return false;
};
