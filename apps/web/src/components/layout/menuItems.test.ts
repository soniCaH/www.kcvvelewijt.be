import { describe, it, expect } from "vitest";
import {
  staticMenuItems,
  buildMenuItems,
  buildJeugdItem,
  isMenuItemActive,
} from "./menuItems";
import type { MenuItem } from "./menuItems";
import type { TeamNavVM } from "@/lib/repositories/team.repository";

describe("staticMenuItems", () => {
  it("does not contain a Zoeken entry", () => {
    const labels = staticMenuItems.map((item) => item.label);
    expect(labels).not.toContain("Zoeken");
  });

  it("includes 'Word vrijwilliger' in 'De club' children after 'Contact'", () => {
    const deClub = staticMenuItems.find((item) => item.label === "De club");
    expect(deClub).toBeDefined();
    const children = deClub!.children!;
    const labels = children.map((c) => c.label);
    expect(labels).toContain("Word vrijwilliger");

    const contactIdx = labels.indexOf("Contact");
    const vrijwilligerIdx = labels.indexOf("Word vrijwilliger");
    expect(vrijwilligerIdx).toBe(contactIdx + 1);

    const vrijwilliger = children.find((c) => c.label === "Word vrijwilliger");
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

  it("preserves children on all items", () => {
    const result = buildMenuItems(seniorItems, jeugdItem);
    const jeugd = result.find((item) => item.label === "Jeugd");
    expect(jeugd?.children).toEqual([{ label: "U21", href: "/ploegen/u21" }]);

    const club = result.find((item) => item.label === "De club");
    expect(club?.children?.length).toBeGreaterThan(0);
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
