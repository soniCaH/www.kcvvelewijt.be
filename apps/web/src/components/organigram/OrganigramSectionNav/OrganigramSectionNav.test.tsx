import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { OrganigramSectionNav } from "./OrganigramSectionNav";
import {
  HUB_SEARCH_MEMBERS,
  HUB_SEARCH_PATHS,
} from "../HubSearch/hub-search.fixture";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// `FakeIntersectionObserver.latest()` is safe only because no single test
// here needs both observers at once: the hero-reveal one exists when
// `#hub-hero` is in the DOM, the scroll-spy one when `appendSectionTargets()`
// has added `#hulp`/`#structuur` — and each test below sets up exactly one
// of the two.
function emitHeroIntersecting(isIntersecting: boolean) {
  act(() => {
    FakeIntersectionObserver.latest()!.trigger([{ isIntersecting }]);
  });
}

beforeEach(() => {
  FakeIntersectionObserver.reset();
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.getElementById("hub-hero")?.remove();
  document.getElementById("hulp")?.remove();
  document.getElementById("structuur")?.remove();
  document.documentElement.style.scrollPaddingTop = "";
});

function renderNav() {
  return render(
    <OrganigramSectionNav
      members={HUB_SEARCH_MEMBERS}
      responsibilityPaths={HUB_SEARCH_PATHS}
    />,
  );
}

/** Appends real `#hulp`/`#structuur` targets so the shared `useSectionNav`
 *  hook's scroll-spy observer actually mounts (it bails on zero targets) —
 *  mirroring the two sections the hub always renders. */
function appendSectionTargets() {
  const hulp = document.createElement("div");
  hulp.id = "hulp";
  const structuur = document.createElement("div");
  structuur.id = "structuur";
  document.body.append(hulp, structuur);
  return { hulp, structuur };
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

  // Focus-on-click (#2478 rule 8) is `<SectionNavChip>`'s own contract,
  // covered by `SectionNavChip.test.tsx` — this component delegates
  // rendering to it entirely, so re-asserting it here is the same hand-copy
  // drift #2478's chip extraction (A1) already fixed one layer up.
  describe("scroll-spy — the fill means the section being read, not the one last clicked (#2478 rule 3)", () => {
    it("wires the topmost intersecting section's id into aria-current on its chip", () => {
      const { structuur } = appendSectionTargets();
      renderNav();

      act(() => {
        FakeIntersectionObserver.latest()!.trigger([
          {
            isIntersecting: true,
            target: structuur,
            boundingClientRect: { top: 5 } as DOMRectReadOnly,
          },
        ]);
      });

      expect(screen.getByRole("link", { name: "Structuur" })).toHaveAttribute(
        "aria-current",
        "location",
      );
      expect(screen.getByRole("link", { name: "Hulp" })).not.toHaveAttribute(
        "aria-current",
      );
    });

    it("does not change the fill on click by itself — only a later intersection does", () => {
      const { structuur } = appendSectionTargets();
      renderNav();

      act(() => {
        FakeIntersectionObserver.latest()!.trigger([
          {
            isIntersecting: true,
            target: structuur,
            boundingClientRect: { top: 5 } as DOMRectReadOnly,
          },
        ]);
      });

      // Clicking "Hulp" navigates, but the fill still means "the section
      // being read" — which the observer has not yet reported as Hulp.
      fireEvent.click(screen.getByRole("link", { name: "Hulp" }));

      expect(screen.getByRole("link", { name: "Structuur" })).toHaveAttribute(
        "aria-current",
        "location",
      );
      expect(screen.getByRole("link", { name: "Hulp" })).not.toHaveAttribute(
        "aria-current",
      );
    });
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
