import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SponsorTiers } from "./SponsorTiers";
import type { Sponsor } from "../Sponsors";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const s = (overrides: Partial<Sponsor> & { id: string }): Sponsor => ({
  name: `Sponsor ${overrides.id}`,
  logo: "",
  ...overrides,
});

const mixed: Sponsor[] = [
  // Hoofd tiles carry a logo so the name renders once (the caption); the wall
  // tiles have no logo so the name renders once (the missing-logo fallback).
  s({ id: "h1", name: "Hoofd Een", tier: "hoofdsponsor", logo: "/h1.png" }),
  s({ id: "h2", name: "Hoofd Twee", tier: "hoofdsponsor", logo: "/h2.png" }),
  s({ id: "sp", name: "Sponsor Drie", tier: "sponsor" }),
  s({ id: "sy", name: "Sympathisant Vier", tier: "sympathisant" }),
  s({ id: "un", name: "Untiered Vijf" }),
];

describe("SponsorTiers", () => {
  it("labels only the Hoofdsponsors group", () => {
    render(<SponsorTiers sponsors={mixed} />);
    expect(screen.getByText("Hoofdsponsors")).toBeInTheDocument();
    expect(screen.queryByText("Sponsors")).not.toBeInTheDocument();
    expect(screen.queryByText("Sympathisanten")).not.toBeInTheDocument();
  });

  it("puts hoofdsponsors in the labelled region and the rest in the unlabelled wall", () => {
    render(<SponsorTiers sponsors={mixed} />);
    const region = screen.getByRole("region", { name: "Hoofdsponsors" });
    expect(within(region).getByText("Hoofd Een")).toBeInTheDocument();
    expect(within(region).getByText("Hoofd Twee")).toBeInTheDocument();
    expect(within(region).queryByText("Sponsor Drie")).not.toBeInTheDocument();
    expect(within(region).queryByText("Untiered Vijf")).not.toBeInTheDocument();
    // The rest are outside the region (the wall).
    expect(screen.getByText("Sponsor Drie")).toBeInTheDocument();
    expect(screen.getByText("Sympathisant Vier")).toBeInTheDocument();
    expect(screen.getByText("Untiered Vijf")).toBeInTheDocument();
  });

  it("orders the wall sponsor before sympathisant (tier wins over name)", () => {
    const wallOnly: Sponsor[] = [
      s({ id: "sy", name: "Alpha", tier: "sympathisant" }),
      s({ id: "sp", name: "Zeta", tier: "sponsor" }),
    ];
    render(<SponsorTiers sponsors={wallOnly} />);
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["Zeta", "Alpha"]);
  });

  it("renders only the wall when there are no hoofdsponsors", () => {
    const noHoofd: Sponsor[] = [
      s({ id: "sp", name: "Sponsor X", tier: "sponsor" }),
      s({ id: "sy", name: "Sympathisant Y", tier: "sympathisant" }),
    ];
    render(<SponsorTiers sponsors={noHoofd} />);
    expect(screen.queryByText("Hoofdsponsors")).not.toBeInTheDocument();
    expect(screen.getByText("Sponsor X")).toBeInTheDocument();
    expect(screen.getByText("Sympathisant Y")).toBeInTheDocument();
  });

  it("renders only the hoofd grid when there is no wall", () => {
    const hoofdOnly: Sponsor[] = [
      s({ id: "h1", name: "Hoofd Een", tier: "hoofdsponsor" }),
      s({ id: "h2", name: "Hoofd Twee", tier: "hoofdsponsor" }),
    ];
    render(<SponsorTiers sponsors={hoofdOnly} />);
    const region = screen.getByRole("region", { name: "Hoofdsponsors" });
    // Every list item lives inside the hoofd region — there is no wall list.
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(within(region).getAllByRole("listitem")).toHaveLength(2);
  });
});
