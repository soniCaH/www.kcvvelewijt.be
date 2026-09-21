import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader } from "./SiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import type { TeamNavVM } from "@/lib/repositories/team.repository";
import { teamDisplayName } from "@/lib/utils/team-display-name";

const makeTeam = (over: Partial<TeamNavVM>): TeamNavVM => ({
  id: over.slug ?? "team",
  name: over.name ?? "Team",
  displayName:
    over.displayName ??
    teamDisplayName({ slug: over.slug ?? "team", name: over.name ?? "Team" }),
  slug: over.slug ?? "team",
  age: over.age ?? null,
  psdId: null,
  division: null,
  divisionFull: null,
  teamImageUrl: null,
});

const seniorTeams: TeamNavVM[] = [
  makeTeam({ slug: "kcvv-elewijt-a", name: "KCVV Elewijt A" }),
  makeTeam({ slug: "kcvv-elewijt-b", name: "KCVV Elewijt B" }),
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

  it("gives the desktop Zoeken link a 44×44 hit area — icon size unchanged (#2529 — Tap Target Rule)", () => {
    render(<SiteHeader />);
    const searchLinks = screen.getAllByRole("link", { name: /zoeken/i });
    const desktopLink = searchLinks.find(
      (link) => link.getAttribute("data-nav-source") === "desktop",
    );
    expect(desktopLink).toBeDefined();
    expect(desktopLink).toHaveClass("h-11");
    expect(desktopLink).toHaveClass("w-11");
    expect(desktopLink).toHaveClass("justify-center");
  });

  it("renders Word lid link to /club/word-lid on desktop", () => {
    render(<SiteHeader />);
    const wordLid = screen.getAllByRole("link", { name: /word lid/i });
    expect(wordLid.length).toBeGreaterThan(0);
    expect(wordLid[0]).toHaveAttribute("href", "/club/word-lid");
  });

  it("opens the drawer when the hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteHeader seniorTeams={seniorTeams} />);
    const hamburger = screen.getByRole("button", { name: /open menu/i });
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(hamburger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the 9-item flat nav on desktop, in order", () => {
    render(<SiteHeader seniorTeams={seniorTeams} />);
    const nav = screen.getAllByRole("navigation", {
      name: /hoofdnavigatie/i,
    })[0]!;
    const labels = Array.from(nav.querySelectorAll("a")).map(
      (a) => a.textContent,
    );
    expect(labels).toEqual([
      "Nieuws",
      "Wedstrijden",
      "Evenementen",
      "A-ploeg",
      "B-ploeg",
      "Jeugd",
      "Sponsors",
      "Hulp",
      "De club",
    ]);
  });

  it("labels a senior entry from the team's display name", () => {
    // The nav used to re-derive its own label off `name` (`seniorNavLabel`), a
    // second copy of the same rule — so an editorial rename reached the page
    // heading and the share card but not the link a click earlier (#2630).
    // The fixture's override is distinct from the slug-derived label on
    // purpose: agreeing with it would prove nothing.
    render(
      <SiteHeader
        seniorTeams={[
          makeTeam({
            slug: "kcvv-elewijt-a",
            name: "KCVV Elewijt A",
            displayName: "A-kern",
          }),
        ]}
      />,
    );
    const nav = screen.getAllByRole("navigation", {
      name: /hoofdnavigatie/i,
    })[0]!;
    const labels = Array.from(nav.querySelectorAll("a")).map(
      (a) => a.textContent,
    );
    expect(labels).toContain("A-kern");
    expect(labels).not.toContain("A-ploeg");
  });

  it("has no dropdown triggers — every nav entry is a plain link", () => {
    render(<SiteHeader seniorTeams={seniorTeams} />);
    expect(document.querySelector("[aria-haspopup]")).toBeNull();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("drops Home from the nav — the wordmark is the home link", () => {
    render(<SiteHeader seniorTeams={seniorTeams} />);
    expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
    expect(
      screen.getAllByRole("link", { name: /KCVV Elewijt — home/i })[0],
    ).toHaveAttribute("href", "/");
  });

  it("marks the active entry with aria-current, not colour alone", () => {
    // usePathname is mocked to "/", so no nav entry is active — assert the
    // negative here and the positive in the menuItems unit tests.
    render(<SiteHeader seniorTeams={seniorTeams} />);
    const nav = screen.getAllByRole("navigation", {
      name: /hoofdnavigatie/i,
    })[0]!;
    for (const link of nav.querySelectorAll("a")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("points Wedstrijden at /kalender", () => {
    render(<SiteHeader />);
    expect(
      screen.getAllByRole("link", { name: "Wedstrijden" })[0],
    ).toHaveAttribute("href", "/kalender");
  });

  // #2850 — a visitor who opens the drawer below `lg` and then widens the
  // viewport (or rotates a tablet) past it used to keep the takeover
  // mounted, overlaying the desktop row. Nothing else in this suite drives
  // an actual viewport change, so this is the one test that does.
  //
  // happy-dom's real `MediaQueryList`, under vitest's environment, does not
  // track `window.innerWidth` mutations (verified empirically in
  // `NavTakeover.test.tsx`), so — matching the existing `window.matchMedia`
  // mock in `CalendarWidget.test.tsx` — this stubs a controllable one
  // instead of trying to drive a real resize.
  describe("drawer retires itself when the viewport crosses into `lg`", () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      document.documentElement.style.removeProperty("--breakpoint-lg");
    });

    it("closes the takeover and moves focus to the desktop nav's first link, not the now-hidden hamburger", async () => {
      document.documentElement.style.setProperty("--breakpoint-lg", "900px");
      let matches = false;
      const listeners = new Set<(event: { matches: boolean }) => void>();
      window.matchMedia = vi.fn().mockReturnValue({
        get matches() {
          return matches;
        },
        addEventListener: vi.fn(
          (type: string, cb: (event: { matches: boolean }) => void) => {
            if (type === "change") listeners.add(cb);
          },
        ),
        removeEventListener: vi.fn(
          (type: string, cb: (event: { matches: boolean }) => void) => {
            if (type === "change") listeners.delete(cb);
          },
        ),
      } as unknown as MediaQueryList);

      const user = userEvent.setup();
      render(<SiteHeader seniorTeams={seniorTeams} />);

      await user.click(screen.getByRole("button", { name: /open menu/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      act(() => {
        matches = true;
        listeners.forEach((cb) => cb({ matches: true }));
      });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(
        screen.getAllByRole("link", { name: "Nieuws" })[0],
      );
    });
  });
});
