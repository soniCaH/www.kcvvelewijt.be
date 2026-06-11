import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OrganigramSectionNav } from "./OrganigramSectionNav";
import {
  HUB_SEARCH_MEMBERS,
  HUB_SEARCH_PATHS,
} from "../HubSearch/hub-search.fixture";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// IntersectionObserver stub that captures the latest callback so tests can drive
// hero-visibility transitions. Only the hero observer is created when a
// `#hub-hero` element is present (the section observer bails with no sections).
let observerCb: IntersectionObserverCallback | null = null;

class FakeIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    observerCb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function emitHeroIntersecting(isIntersecting: boolean) {
  act(() => {
    observerCb?.(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

beforeEach(() => {
  observerCb = null;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.getElementById("hub-hero")?.remove();
});

function renderNav() {
  return render(
    <OrganigramSectionNav
      members={HUB_SEARCH_MEMBERS}
      responsibilityPaths={HUB_SEARCH_PATHS}
    />,
  );
}

describe("OrganigramSectionNav", () => {
  it("renders a distinctly-labelled nav landmark", () => {
    renderNav();
    expect(
      screen.getByRole("navigation", { name: "Secties van de hub" }),
    ).toBeInTheDocument();
  });

  it("renders both doors pointing at the section anchors", () => {
    renderNav();
    const hulp = screen.getByRole("link", { name: "Hulp" });
    const structuur = screen.getByRole("link", { name: "Structuur" });
    expect(hulp).toHaveAttribute("href", "#hulp");
    expect(structuur).toHaveAttribute("href", "#structuur");
  });

  it("marks Hulp active by default and moves active on click", () => {
    renderNav();
    const hulp = screen.getByRole("link", { name: "Hulp" });
    const structuur = screen.getByRole("link", { name: "Structuur" });
    expect(hulp).toHaveAttribute("aria-current", "location");
    expect(structuur).not.toHaveAttribute("aria-current");

    fireEvent.click(structuur);
    expect(structuur).toHaveAttribute("aria-current", "location");
    expect(hulp).not.toHaveAttribute("aria-current");
  });

  it("keeps the repeated search hidden by default (hero in view)", () => {
    renderNav();
    expect(
      screen.queryByLabelText("Zoek een persoon of hulpvraag"),
    ).not.toBeInTheDocument();
  });

  it("hides the search while the hero is in view, reveals it once scrolled past", () => {
    document.body.insertAdjacentHTML("afterbegin", '<div id="hub-hero"></div>');
    renderNav();

    // Hero in view → no second search field (avoids two searches at once).
    emitHeroIntersecting(true);
    expect(
      screen.queryByLabelText("Zoek een persoon of hulpvraag"),
    ).not.toBeInTheDocument();

    // Scrolled past the hero → the repeated search reveals.
    emitHeroIntersecting(false);
    expect(
      screen.getByLabelText("Zoek een persoon of hulpvraag"),
    ).toBeInTheDocument();
  });
});
