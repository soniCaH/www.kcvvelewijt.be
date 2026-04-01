import { describe, it, expect } from "vitest";
import { staticMenuItems, buildMenuItems } from "./menuItems";
import type { MenuItem } from "./menuItems";

describe("staticMenuItems", () => {
  it("does not contain a Zoeken entry", () => {
    const labels = staticMenuItems.map((item) => item.label);
    expect(labels).not.toContain("Zoeken");
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
