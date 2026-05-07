import { describe, it, expect } from "vitest";
import {
  staticMenuItems,
  buildMenuItems,
  buildJeugdItem,
  isMenuItemActive,
  flattenChildren,
  hasSubmenu,
} from "./menuItems";
import type { MenuItem } from "./menuItems";
import type { TeamNavVM } from "@/lib/repositories/team.repository";

describe("staticMenuItems", () => {
  it("does not contain a Zoeken entry", () => {
    const labels = staticMenuItems.map((item) => item.label);
    expect(labels).not.toContain("Zoeken");
  });

  it("places De club children under two groups: Wie we zijn / Praktisch", () => {
    const deClub = staticMenuItems.find((item) => item.label === "De club");
    expect(deClub).toBeDefined();
    expect(deClub!.children).toBeUndefined();
    const groupLabels = deClub!.childGroups!.map((g) => g.label);
    expect(groupLabels).toEqual(["Wie we zijn", "Praktisch"]);
  });

  it("groups identity content under 'Wie we zijn' (6 items)", () => {
    const deClub = staticMenuItems.find((item) => item.label === "De club")!;
    const wieWeZijn = deClub.childGroups!.find(
      (g) => g.label === "Wie we zijn",
    )!;
    const labels = wieWeZijn.items.map((i) => i.label);
    expect(labels).toEqual([
      "Geschiedenis",
      "Organigram",
      "Bestuur",
      "Jeugdbestuur",
      "KCVV Angels",
      "KCVV Ultras",
    ]);
  });

  it("groups operational content under 'Praktisch' (5 items)", () => {
    const deClub = staticMenuItems.find((item) => item.label === "De club")!;
    const praktisch = deClub.childGroups!.find((g) => g.label === "Praktisch")!;
    const labels = praktisch.items.map((i) => i.label);
    expect(labels).toEqual([
      "Praktische Info",
      "Word vrijwilliger",
      "Cashless clubkaart",
      "Contact",
      "Downloads",
    ]);
  });

  it("preserves Word vrijwilliger href for backwards compatibility", () => {
    const deClub = staticMenuItems.find((item) => item.label === "De club")!;
    const vrijwilliger = deClub
      .childGroups!.flatMap((g) => g.items)
      .find((i) => i.label === "Word vrijwilliger");
    expect(vrijwilliger?.href).toBe("/club/vrijwilliger");
  });
});

describe("buildMenuItems", () => {
  const seniorItems: MenuItem[] = [
    { label: "A-Ploeg", href: "/ploegen/a-ploeg" },
    { label: "B-Ploeg", href: "/ploegen/b-ploeg" },
  ];

  const jeugdItem: MenuItem = {
    label: "Jeugd",
    href: "/jeugd",
    children: [{ label: "U21", href: "/ploegen/u21" }],
  };

  it("inserts senior items and jeugd after the first 3 static items", () => {
    const result = buildMenuItems(seniorItems, jeugdItem);
    const labels = result.map((item) => item.label);

    expect(labels).toEqual([
      "Home",
      "Nieuws",
      "Evenementen",
      "A-Ploeg",
      "B-Ploeg",
      "Jeugd",
      "Sponsors",
      "Hulp",
      "De club",
    ]);
  });

  it("works with no senior items", () => {
    const result = buildMenuItems([], jeugdItem);
    const labels = result.map((item) => item.label);

    expect(labels).toEqual([
      "Home",
      "Nieuws",
      "Evenementen",
      "Jeugd",
      "Sponsors",
      "Hulp",
      "De club",
    ]);
  });

  it("filters out null entries from seniorItems", () => {
    const seniorItems: (MenuItem | null)[] = [
      { label: "A", href: "/a" },
      null,
      { label: "B", href: "/b" },
    ];
    const result = buildMenuItems(seniorItems, jeugdItem);
    const labels = result.map((item) => item.label);

    expect(labels).toEqual([
      "Home",
      "Nieuws",
      "Evenementen",
      "A",
      "B",
      "Jeugd",
      "Sponsors",
      "Hulp",
      "De club",
    ]);
  });

  it("preserves children/childGroups on all items", () => {
    const result = buildMenuItems(seniorItems, jeugdItem);
    const jeugd = result.find((item) => item.label === "Jeugd");
    expect(jeugd?.children).toEqual([{ label: "U21", href: "/ploegen/u21" }]);

    const club = result.find((item) => item.label === "De club");
    expect(club?.childGroups?.length).toBeGreaterThan(0);
  });
});

describe("flattenChildren", () => {
  it("returns empty array when neither children nor childGroups are set", () => {
    const item: MenuItem = { label: "Home", href: "/" };
    expect(flattenChildren(item)).toEqual([]);
  });

  it("returns flat children when only children is set", () => {
    const item: MenuItem = {
      label: "Teams",
      href: "/ploegen",
      children: [
        { label: "Info", href: "/ploegen/a" },
        { label: "Stand", href: "/ploegen/a?tab=stand" },
      ],
    };
    expect(flattenChildren(item)).toEqual(item.children);
  });

  it("flattens childGroups into a single array preserving order", () => {
    const item: MenuItem = {
      label: "De club",
      href: "/club",
      childGroups: [
        {
          label: "A",
          items: [{ label: "X", href: "/x" }],
        },
        {
          label: "B",
          items: [
            { label: "Y", href: "/y" },
            { label: "Z", href: "/z" },
          ],
        },
      ],
    };
    expect(flattenChildren(item).map((c) => c.label)).toEqual(["X", "Y", "Z"]);
  });

  it("prefers childGroups over children when both are set", () => {
    const item: MenuItem = {
      label: "Both",
      href: "/both",
      children: [{ label: "from-children", href: "/c" }],
      childGroups: [
        { label: "G", items: [{ label: "from-groups", href: "/g" }] },
      ],
    };
    expect(flattenChildren(item).map((c) => c.label)).toEqual(["from-groups"]);
  });
});

describe("hasSubmenu", () => {
  it("is false for leaf items", () => {
    expect(hasSubmenu({ label: "Home", href: "/" })).toBe(false);
  });

  it("is true when children has at least one entry", () => {
    expect(
      hasSubmenu({
        label: "Teams",
        href: "/ploegen",
        children: [{ label: "Info", href: "/ploegen/a" }],
      }),
    ).toBe(true);
  });

  it("is true when childGroups has at least one entry", () => {
    expect(
      hasSubmenu({
        label: "De club",
        href: "/club",
        childGroups: [{ label: "G", items: [{ label: "X", href: "/x" }] }],
      }),
    ).toBe(true);
  });

  it("is false when both arrays are present but empty", () => {
    expect(
      hasSubmenu({
        label: "Empty",
        href: "/e",
        children: [],
        childGroups: [],
      }),
    ).toBe(false);
  });
});

describe("isMenuItemActive", () => {
  const params = (tab?: string) => {
    const sp = new URLSearchParams();
    if (tab) sp.set("tab", tab);
    return sp;
  };

  it("marks parent item active on its own tabbed page", () => {
    expect(
      isMenuItemActive(
        "/ploegen/a-ploeg",
        "/ploegen/a-ploeg",
        params("wedstrijden"),
      ),
    ).toBe(true);
  });

  it("marks parent item active with no query params", () => {
    expect(
      isMenuItemActive("/ploegen/a-ploeg", "/ploegen/a-ploeg", params()),
    ).toBe(true);
  });

  it("marks tab child active when tab matches", () => {
    expect(
      isMenuItemActive(
        "/ploegen/a-ploeg?tab=wedstrijden",
        "/ploegen/a-ploeg",
        params("wedstrijden"),
      ),
    ).toBe(true);
  });

  it("does not mark tab child active when tab differs", () => {
    expect(
      isMenuItemActive(
        "/ploegen/a-ploeg?tab=wedstrijden",
        "/ploegen/a-ploeg",
        params("klassement"),
      ),
    ).toBe(false);
  });

  it("marks home active only on exact /", () => {
    expect(isMenuItemActive("/", "/", params())).toBe(true);
    expect(isMenuItemActive("/", "/nieuws", params())).toBe(false);
  });

  it("marks child paths active", () => {
    expect(isMenuItemActive("/club", "/club/geschiedenis", params())).toBe(
      true,
    );
  });
});

describe("buildJeugdItem", () => {
  it("returns undefined children when youthTeams is undefined", () => {
    const item = buildJeugdItem(undefined);
    expect(item.children).toBeUndefined();
  });

  it("returns undefined children when all teams are filtered out", () => {
    const teams: TeamNavVM[] = [
      { slug: "u21", age: null, name: "U21" },
    ] as TeamNavVM[];
    const item = buildJeugdItem(teams);
    expect(item.children).toBeUndefined();
  });

  it("returns undefined children for empty array", () => {
    const item = buildJeugdItem([]);
    expect(item.children).toBeUndefined();
  });

  it("returns children when youth teams have ages", () => {
    const teams: TeamNavVM[] = [
      { slug: "u21", age: "U21", name: "U21" },
    ] as TeamNavVM[];
    const item = buildJeugdItem(teams);
    expect(item.children).toEqual([{ label: "U21", href: "/ploegen/u21" }]);
  });
});
