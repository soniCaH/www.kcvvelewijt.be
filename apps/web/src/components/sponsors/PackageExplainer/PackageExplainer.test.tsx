import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { PackageExplainer } from "./PackageExplainer";

const text = (el: HTMLElement) => el.textContent ?? "";

describe("PackageExplainer", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.mocked(trackEvent).mockClear();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("frames a choice in its heading and intro", () => {
    const { container } = render(<PackageExplainer />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Drie pakketten. Of één op maat.");
    expect(text(container)).toContain(
      "Kies een vast pakket, of laat ons samen iets bouwen dat bij je zaak past.",
    );
  });

  it("renders the three bundles with their checklists", () => {
    render(<PackageExplainer />);
    const card = (name: string) =>
      screen.getByRole("heading", { level: 3, name }).closest("li")!;
    expect(within(card("Groen")).getAllByRole("listitem").map(text)).toEqual([
      "TV Tool op de 3 grote schermen",
      "Uitgaanstraining",
      "Sponsordoek op het B-veld",
    ]);
    expect(within(card("Wit")).getAllByRole("listitem")).toHaveLength(3);
    expect(text(card("Wit"))).toContain("Sponsordoek op het A-veld");
    const crossing = within(card("Crossing")).getAllByRole("listitem");
    expect(crossing.map(text)).toContain("Onderleggers op de festijnen");
    expect(text(card("Crossing"))).toContain("Meest compleet");
    expect(crossing.length).toBeGreaterThan(
      within(card("Groen")).getAllByRole("listitem").length,
    );
  });

  it("observes only the heading, intro and bundle cards, not the long tail", () => {
    // The whole block is taller than a phone screen, so a 40% threshold on it
    // could never be reached there: the tracked wrapper stays short.
    const { container } = render(<PackageExplainer />);
    const tracked = container.querySelector<HTMLElement>(
      '[data-track-event="sponsor_packages_view"]',
    )!;
    expect(
      within(tracked).getByRole("heading", { level: 2 }),
    ).toBeInTheDocument();
    for (const name of ["Groen", "Wit", "Crossing"]) {
      expect(
        within(tracked).getByRole("heading", { level: 3, name }),
      ).toBeInTheDocument();
    }
    expect(
      within(tracked).queryByRole("heading", { name: "Of kies apart" }),
    ).not.toBeInTheDocument();
  });

  it("gives every checklist an explicit list role", () => {
    render(<PackageExplainer />);
    const card = screen
      .getByRole("heading", { level: 3, name: "Groen" })
      .closest("li")!;
    expect(within(card).getByRole("list")).toBeInTheDocument();
  });

  it("renders the op maat box", () => {
    const { container } = render(<PackageExplainer />);
    expect(
      screen.getByRole("heading", { name: "Op maat" }),
    ).toBeInTheDocument();
    expect(text(container)).toContain("Samen gebouwd");
    expect(text(container)).toContain(
      "Combineer wat je wil. We bouwen het samen.",
    );
    // The one-off items live under "Eenmalig", not in this box.
    const box = screen
      .getByRole("heading", { name: "Op maat" })
      .closest("div")!;
    expect(text(box)).not.toMatch(
      /VIP-lunch|tombola|Sinterklaas|jeugdkamp|themaavond/i,
    );
    // The "Word sponsor" band below invites; the box does not say it.
    expect(text(container)).not.toContain("Laten we praten");
  });

  it("lists every loose package under its group", () => {
    render(<PackageExplainer />);
    const groups: Record<string, string[]> = {
      "Op het complex": ["TV Tool", "Sponsordoek"],
      "Op de shirts": [
        "Uitgaanstraining",
        "Wedstrijduitrusting jeugd",
        "Wedstrijduitrusting senior",
      ],
      Online: ["Sponsored posts"],
      Eenmalig: [
        "Matchbal",
        "Onderleggers",
        "VIP-lunch",
        "Tombolaprijs",
        "Jeugdstage",
        "Sinterklaas",
        "Thema-avond",
      ],
    };
    expect(
      screen.getByRole("heading", { name: "Of kies apart" }),
    ).toBeVisible();
    for (const [label, names] of Object.entries(groups)) {
      const group = screen
        .getByRole("heading", { level: 4, name: label })
        .closest("section")!;
      expect(within(group).getAllByRole("term").map(text)).toEqual(names);
    }
  });

  it("gives each one-off item its own row under Eenmalig", () => {
    render(<PackageExplainer />);
    const group = screen
      .getByRole("heading", { level: 4, name: "Eenmalig" })
      .closest("section")!;
    const row = (name: string) =>
      text(
        within(group)
          .getAllByRole("term")
          .find((dt) => text(dt) === name)!.parentElement!,
      );
    expect(row("VIP-lunch")).toContain(
      "Sponsor een zondagse VIP-lunch voor onze trouwe supporters, voor een wedstrijd van het A-elftal.",
    );
    expect(row("Tombolaprijs")).toContain(
      "Een prijs in jouw naam op het steakrestaurant of het mosselfestijn.",
    );
    expect(row("Jeugdstage")).toContain(
      "Goodies voor de spelers van onze jeugdstages: drinkbussen, sjaals, t-shirts.",
    );
    expect(row("Sinterklaas")).toContain(
      "Een cadeautje van de Sint aan elke jeugdspeler, in jouw naam.",
    );
    expect(row("Thema-avond")).toContain(
      "Je naam op een van onze thema-avonden.",
    );
  });

  it("renders no euro amount at all", () => {
    const { container } = render(<PackageExplainer />);
    expect(text(container)).not.toMatch(/€|\beur\b|\beuro\b|\bbtw\b/i);
  });

  it("names no tier", () => {
    const { container } = render(<PackageExplainer />);
    expect(text(container)).not.toMatch(/hoofdsponsor|sympathisant/i);
    expect(text(container)).not.toMatch(/\btier\b/i);
  });

  it("drops team support and the season overview", () => {
    const { container } = render(<PackageExplainer />);
    expect(text(container)).not.toMatch(/Een ploeg steunen|Na elk seizoen/);
  });

  it("has no ending of its own: no contact, no closing line", () => {
    const { container } = render(<PackageExplainer />);
    expect(text(container)).not.toMatch(
      /Verantwoordelijke Sponsoring|Laten we praten|Benieuwd/,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      container.querySelector('a[href^="mailto:"]'),
    ).not.toBeInTheDocument();
  });

  it("ends with the loose packages", () => {
    const { container } = render(<PackageExplainer />);
    const last = container.querySelector("section")!.lastElementChild!;
    expect(text(last as HTMLElement)).toContain("Onderleggers");
  });

  it("fires sponsor_packages_view at 40% in view, once", () => {
    render(<PackageExplainer />);
    const observer = FakeIntersectionObserver.latest()!;
    expect((observer.options?.threshold as number[]).at(-1)).toBe(0.4);
    expect(trackEvent).not.toHaveBeenCalled();
    act(() => {
      observer.trigger([
        {
          // below 0.4 of the block and of the viewport (0.4 x 667 = 266.8 px)
          isIntersecting: true,
          intersectionRatio: 0.3,
          intersectionRect: { height: 100 } as DOMRectReadOnly,
          rootBounds: { height: 667 } as DOMRectReadOnly,
        },
      ]);
    });
    expect(trackEvent).not.toHaveBeenCalled();
    act(() => {
      observer.trigger([
        {
          isIntersecting: true,
          intersectionRatio: 1,
          intersectionRect: { height: 100 } as DOMRectReadOnly,
          rootBounds: { height: 667 } as DOMRectReadOnly,
        },
      ]);
      observer.trigger([
        {
          isIntersecting: true,
          intersectionRatio: 1,
          intersectionRect: { height: 100 } as DOMRectReadOnly,
          rootBounds: { height: 667 } as DOMRectReadOnly,
        },
      ]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("sponsor_packages_view", undefined);
  });
});
