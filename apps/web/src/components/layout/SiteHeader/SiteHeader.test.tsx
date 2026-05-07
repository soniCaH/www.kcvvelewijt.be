import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader } from "./SiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import type { TeamNavVM } from "@/lib/repositories/team.repository";

const makeTeam = (over: Partial<TeamNavVM>): TeamNavVM => ({
  id: over.slug ?? "team",
  name: over.name ?? "Team",
  slug: over.slug ?? "team",
  age: over.age ?? null,
  psdId: null,
  division: null,
  divisionFull: null,
  tagline: null,
  teamImageUrl: null,
});

const seniorTeams: TeamNavVM[] = [
  makeTeam({ slug: "kcvv-elewijt-a", name: "KCVV Elewijt A" }),
  makeTeam({ slug: "kcvv-elewijt-b", name: "KCVV Elewijt B" }),
];

const youthTeams: TeamNavVM[] = [
  makeTeam({ slug: "u15", name: "U15", age: "U15" }),
  makeTeam({ slug: "u13", name: "U13", age: "U13" }),
];

describe("SiteHeader", () => {
  it("renders sticky header with top: 0", () => {
    const { container } = render(<SiteHeader />);
    const header = container.querySelector("header");
    expect(header?.className).toMatch(/sticky/);
    expect(header?.className).toMatch(/top-0/);
  });

  it("renders the wordmark linking to /", () => {
    render(<SiteHeader />);
    const homeLinks = screen.getAllByRole("link", {
      name: /KCVV Elewijt — home/i,
    });
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0]).toHaveAttribute("href", "/");
  });

  it("does not render a founding-year superscript in the wordmark", () => {
    render(<SiteHeader />);
    expect(screen.queryByText(/SINDS 1909/i)).toBeNull();
    expect(screen.queryByText(/SINDS 1948/i)).toBeNull();
  });

  it("renders icon-only search link to /zoeken", () => {
    render(<SiteHeader />);
    const searchLinks = screen.getAllByRole("link", { name: /zoeken/i });
    expect(searchLinks.length).toBeGreaterThan(0);
    searchLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/zoeken");
    });
  });

  it("renders Word lid link to /club/inschrijven on desktop", () => {
    render(<SiteHeader />);
    const wordLid = screen.getAllByRole("link", { name: /word lid/i });
    expect(wordLid.length).toBeGreaterThan(0);
    expect(wordLid[0]).toHaveAttribute("href", "/club/inschrijven");
  });

  it("opens the drawer when the hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteHeader seniorTeams={seniorTeams} youthTeams={youthTeams} />);
    const hamburger = screen.getByRole("button", { name: /open menu/i });
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(hamburger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the same nav items as the static menu on desktop", () => {
    render(<SiteHeader />);
    expect(
      screen.getAllByRole("link", { name: "Home" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Nieuws" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /sponsors/i }).length,
    ).toBeGreaterThan(0);
  });
});
