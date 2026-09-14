import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSyncExternalStore } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HulpFinder } from "./HulpFinder";
import { FINDER_FIXTURE_PATHS } from "./__fixtures__/paths.fixture";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// `category` is purely URL-derived (#2564 review item 5), so a mocked
// `push`/`replace` that doesn't ALSO update what `useSearchParams` returns —
// and notify React of it — would leave every "click a category chip, see it
// take effect" test asserting against stale params. This tiny store mirrors
// real Next.js: pushing/replacing updates the params AND triggers a
// re-render in every mounted `useSearchParams()` consumer, exactly the way
// the real router does after a client-side navigation.
const searchParamsStore = vi.hoisted(() => {
  let current = new URLSearchParams();
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next: URLSearchParams) => {
      current = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

function paramsFromUrl(url: string): URLSearchParams {
  const query = url.split("?")[1]?.split("#")[0] ?? "";
  return new URLSearchParams(query);
}

function hashFromUrl(url: string): string {
  const hashIndex = url.indexOf("#");
  return hashIndex === -1 ? "" : url.slice(hashIndex);
}

// `pushParam` (the component under test) intentionally reads the LIVE
// `window.location.search`, not `useSearchParams()`'s return value — that's
// what lets the panel's `?member`/`?holder` deep-link (written via
// `history.replaceState`, which `useSearchParams` never observes) survive a
// filter change. A real Next.js app keeps `window.location` and
// `useSearchParams()` in lockstep automatically; this mock has to do that
// syncing by hand — search AND hash both — or a click that merges in a new
// param would only see the ONE param it just set (dropping whatever else
// `useSearchParams()` was reporting), and a dropped hash would wipe out
// `reveal()`'s own `#<id>` on the very next chip click.
function applyUrl(url: string) {
  const params = paramsFromUrl(url);
  searchParamsStore.set(params);
  // Property assignment, not `history.replaceState` — happy-dom doesn't
  // resolve a relative `history.replaceState` target against the test
  // environment's default `about:blank` origin (it silently no-ops), but
  // direct `location.search`/`.hash` assignment updates `window.location`
  // reliably regardless of origin.
  window.location.search = params.toString();
  window.location.hash = hashFromUrl(url);
}

function setMockSearchParams(params: URLSearchParams) {
  applyUrl(`/hulp?${params.toString()}`);
}

const mockPush = vi.fn((url: string) => applyUrl(url));
const mockReplace = vi.fn((url: string) => applyUrl(url));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/hulp",
  useSearchParams: () =>
    useSyncExternalStore(searchParamsStore.subscribe, searchParamsStore.get),
}));

let mockPanel: {
  openMemberById: ReturnType<typeof vi.fn>;
  openMember: ReturnType<typeof vi.fn>;
} | null = null;
vi.mock("@/components/organigram/HubMemberPanel", () => ({
  useHubMemberPanel: () => mockPanel,
}));

const trackView = vi.fn();
const trackContactClicked = vi.fn();
const trackOrganigramLink = vi.fn();
const trackStepLinkClicked = vi.fn();
vi.mock("@/hooks/useResponsibilityAnalytics", () => ({
  useResponsibilityAnalytics: () => ({
    trackRoleSelected: vi.fn(),
    trackSearch: vi.fn(),
    trackNoResults: vi.fn(),
    trackSuggestionClicked: vi.fn(),
    trackView,
    trackContactClicked,
    trackOrganigramLink,
    trackStepLinkClicked,
    startDwell: vi.fn(),
    stopDwell: vi.fn(),
    resetSession: vi.fn(),
  }),
}));

// happy-dom doesn't implement scrollIntoView — stub it so the finder's
// scroll-into-view effects don't throw, and so we can assert them.
const scrollIntoView = vi.fn();
beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  scrollIntoView.mockClear();
  mockPush.mockClear();
  vi.mocked(trackEvent).mockClear();
  trackView.mockClear();
  trackContactClicked.mockClear();
  trackOrganigramLink.mockClear();
  trackStepLinkClicked.mockClear();
  setMockSearchParams(new URLSearchParams());
  mockPanel = null;
  window.location.hash = "";
});

const q = (re: RegExp) => screen.getByRole("button", { name: re });
const qMaybe = (re: RegExp) => screen.queryByRole("button", { name: re });

describe("HulpFinder", () => {
  it('caps the "Alles" preview to the top 3 per category with an "Alle N →" affordance', () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    // administratief has 5 → only the first 3 render in the preview.
    expect(q(/hoe schrijf ik mijn kind in/i)).toBeInTheDocument();
    expect(q(/wat kost een lidmaatschap/i)).toBeInTheDocument();
    expect(q(/hoe vraag ik een transfer aan/i)).toBeInTheDocument();
    expect(qMaybe(/fiscaal attest/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /alle 5 vragen in administratief/i }),
    ).toBeInTheDocument();
  });

  it('"Alle N →" opens that category\'s full list and scrolls the finder into view', () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /alle 5 vragen in administratief/i }),
    );
    expect(q(/fiscaal attest/i)).toBeInTheDocument();
    // Switching category hides the other categories' questions.
    expect(qMaybe(/mijn kind is geblesseerd/i)).not.toBeInTheDocument();
    // The page got shorter — scroll the finder back to the top so the filtered
    // list is in view (not stranded lower on the page).
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" }),
    );
  });

  it("a category chip filters to that category only", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));
    expect(q(/mijn kind is geblesseerd/i)).toBeInTheDocument();
    expect(qMaybe(/ik wil sponsor worden/i)).not.toBeInTheDocument();
  });

  it("is single-open: opening a second question closes the first", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(q(/mijn kind is geblesseerd/i));
    expect(
      screen.getByText(/eerste zorg gaat altijd voor/i),
    ).toBeInTheDocument();
    fireEvent.click(q(/hoe schrijf ik mijn kind in/i));
    expect(
      screen.getByText(/inschrijven kan het hele seizoen/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/eerste zorg gaat altijd voor/i),
    ).not.toBeInTheDocument();
  });

  it("fires responsibility_view when a question opens", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(q(/hoe schrijf ik mijn kind in/i));
    expect(trackView).toHaveBeenCalledWith("inschrijven");
  });

  it("fires responsibility_contact_clicked from the answer's contact", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(q(/hoe schrijf ik mijn kind in/i));
    fireEvent.click(screen.getByRole("link", { name: /e-mail/i }));
    expect(trackContactClicked).toHaveBeenCalledWith("inschrijven", "email");
  });

  it("fires responsibility_organigram_link with the node id from 'Toon in structuur'", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(q(/mijn kind is geblesseerd/i));
    fireEvent.click(screen.getByRole("link", { name: /toon in structuur/i }));
    expect(trackOrganigramLink).toHaveBeenCalledWith("blessure", "node-gc");
  });

  it("opens the member panel in-page when inside a HubMemberPanel provider", () => {
    const openMemberById = vi.fn();
    mockPanel = { openMemberById, openMember: vi.fn() };
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(q(/mijn kind is geblesseerd/i));
    fireEvent.click(screen.getByRole("link", { name: /toon in structuur/i }));
    expect(openMemberById).toHaveBeenCalledWith(
      "node-gc",
      expect.objectContaining({ view: "cards" }),
    );
    expect(trackOrganigramLink).toHaveBeenCalledWith("blessure", "node-gc");
  });

  it("shows a per-category empty state when the active audience empties a category", () => {
    setMockSearchParams(new URLSearchParams("audience=supporter"));
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    // No medisch path is tagged 'supporter' → the category is empty for them.
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));
    // Names the active category by label (#2427 rule 5 — the copy is the
    // tell), not a generic "deze categorie".
    expect(screen.getByRole("status")).toHaveTextContent(
      /geen hulpvragen in medisch/i,
    );
  });

  it("marks the category undo with the hulp_category source + active facet for the global analytics listener (#2719)", () => {
    // The click-to-`empty_state_undo` wiring is a global listener's job now
    // (`EmptyStateUndoTracker`, tested on its own) — this host's job is only
    // to supply `analyticsSource`/`analyticsFacet`, rendered as inert
    // `data-*` attributes.
    setMockSearchParams(new URLSearchParams("audience=supporter"));
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));

    const undo = screen.getByRole("button", {
      name: "Toon alle categorieën",
    });
    expect(undo).toHaveAttribute(
      "data-empty-state-undo-source",
      "hulp_category",
    );
    expect(undo).toHaveAttribute("data-empty-state-undo-facet", "medisch");
  });

  it("names the active audience by label when it empties across every category", () => {
    // No path in this subset is tagged 'speler' — the audience branch (not
    // the per-category branch above) should fire, and should name the
    // audience ("Speler"), not the generic "deze rol" (#2427 rule 5, #2562
    // review — the category branch already did this, the audience branch
    // hadn't). `audience` reads from the URL (`?audience=`), so it is seeded
    // via `setMockSearchParams`, matching the sibling audience test below.
    setMockSearchParams(new URLSearchParams("audience=speler"));
    const pathsWithoutSpelerRole = FINDER_FIXTURE_PATHS.filter(
      (p) => !p.role.includes("speler"),
    );
    render(<HulpFinder responsibilityPaths={pathsWithoutSpelerRole} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /geen hulpvragen voor speler/i,
    );
    // "Toon alle doelgroepen", not "Toon alles" — the handler clears only
    // `audience`, so the label names the one facet it actually clears
    // (round 4 review).
    expect(
      screen.getByRole("button", { name: "Toon alle doelgroepen" }),
    ).toBeInTheDocument();
  });

  it("marks the audience undo with the hulp_audience source + active facet for the global analytics listener (#2719)", () => {
    setMockSearchParams(new URLSearchParams("audience=speler"));
    const pathsWithoutSpelerRole = FINDER_FIXTURE_PATHS.filter(
      (p) => !p.role.includes("speler"),
    );
    render(<HulpFinder responsibilityPaths={pathsWithoutSpelerRole} />);

    const undo = screen.getByRole("button", {
      name: "Toon alle doelgroepen",
    });
    expect(undo).toHaveAttribute(
      "data-empty-state-undo-source",
      "hulp_audience",
    );
    expect(undo).toHaveAttribute("data-empty-state-undo-facet", "speler");
  });

  it("the undo clears only the active audience, leaving an active category untouched", () => {
    // Both facets active at once: the audience branch still fires first
    // (it's checked before `category`), and its undo must clear audience
    // only. `category` is now purely URL-derived (#2564 review item 5), so
    // "untouched" means the pushed URL KEEPS `categorie=medisch` — dropping
    // it would be exactly the clobber round-1 finding 2 was about. The one
    // thing that must NOT reappear is `audience=`.
    setMockSearchParams(new URLSearchParams("audience=speler"));
    const pathsWithoutSpelerRole = FINDER_FIXTURE_PATHS.filter(
      (p) => !p.role.includes("speler"),
    );
    render(<HulpFinder responsibilityPaths={pathsWithoutSpelerRole} />);

    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Toon alle doelgroepen" }),
    );

    // `audience` is gone from the pushed URL; `categorie=medisch` survives.
    expect(mockPush).toHaveBeenLastCalledWith(
      expect.not.stringContaining("audience="),
      { scroll: false },
    );
    expect(mockPush).toHaveBeenLastCalledWith(
      expect.stringContaining("categorie=medisch"),
      { scroll: false },
    );
    // The category selection survives the undo click.
    expect(screen.getByRole("button", { name: "Medisch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("filters by the ?audience param (hero deep-link)", () => {
    setMockSearchParams(new URLSearchParams("audience=supporter"));
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    expect(q(/ik wil sponsor worden/i)).toBeInTheDocument();
    expect(qMaybe(/hoe schrijf ik mijn kind in/i)).not.toBeInTheDocument();
  });

  it("an audience chip writes the ?audience param", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouder" }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("audience=ouder"),
      { scroll: false },
    );
  });

  it("a category chip writes the ?categorie param", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("categorie=medisch"),
      { scroll: false },
    );
  });

  it("seeds the active category from ?categorie= (e.g. after browser back)", () => {
    setMockSearchParams(new URLSearchParams("categorie=medisch"));
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    expect(screen.getByRole("button", { name: "Medisch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(q(/mijn kind is geblesseerd/i)).toBeInTheDocument();
  });

  it("gains an explicit 'Alles' reset chip on the audience row (#2429/#2564)", () => {
    setMockSearchParams(new URLSearchParams("audience=ouder"));
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    // Both rows now carry an "Alles" chip.
    expect(screen.getAllByRole("button", { name: "Alles" }).length).toBe(2);

    // Re-pressing the already-active "Ouder" chip is a dedup no-op — the
    // toggle-off-by-reclicking idiom is retired in favour of "Alles" as the
    // one reset, matching every other absorbed row.
    fireEvent.click(screen.getByRole("button", { name: "Ouder" }));
    expect(mockPush).not.toHaveBeenCalled();

    const allesButtons = screen.getAllByRole("button", { name: "Alles" });
    fireEvent.click(allesButtons[0]!);
    expect(mockPush).toHaveBeenCalledWith(
      expect.not.stringContaining("audience="),
      { scroll: false },
    );
  });

  it("keeps the #<slug> deep-linked category after an unrelated audience chip click (#2564 review finding 2)", () => {
    // Reproduction: land on /hulp#<slug> (reveal() sets `category` locally,
    // WITHOUT touching ?categorie=), then press an audience chip — an
    // unrelated ?audience= URL push must not clobber the revealed category
    // back to "Alles".
    window.location.hash = "#blessure";
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);

    expect(q(/mijn kind is geblesseerd/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medisch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Ouder" }));

    expect(q(/mijn kind is geblesseerd/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medisch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("clears an ?audience= that would hide the #<slug> deep-linked question", () => {
    // Reproduction: filter on an audience the question isn't tagged for, then
    // pick it in the search. The category chip switched but the question was
    // filtered out before the category list was built, so nothing rendered.
    setMockSearchParams(new URLSearchParams("audience=supporter"));
    window.location.hash = "#blessure"; // role: ouder + speler, not supporter
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);

    expect(q(/mijn kind is geblesseerd/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medisch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Supporter" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("scrolls to an already-open question when it is re-picked in the search", () => {
    // `<HubSearch>` dispatches a `hashchange` for an identical hash so a
    // re-pick reaches the finder. The question is then already open in the
    // already-right category, so that reveal changes no state and the scroll
    // effect — keyed on `[openId, category]` — has no reason to run: the
    // reveal has to scroll (and disarm `pendingScroll`) itself.
    window.location.hash = "#blessure";
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);

    scrollIntoView.mockClear();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("shows an empty state when there are no paths", () => {
    render(<HulpFinder responsibilityPaths={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /nog geen hulpvragen/i,
    );
  });
});
