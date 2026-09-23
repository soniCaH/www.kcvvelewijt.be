import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { HulpFinder } from "./HulpFinder";
import { FINDER_FIXTURE_PATHS } from "./__fixtures__/paths.fixture";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// Both facets live in the URL and are written with `history.pushState` /
// `replaceState`, so the tests drive the real `window.history` and spy on it
// rather than mocking the Next router.
function setUrl(url: string) {
  window.history.replaceState({}, "", url);
}

/** The URL argument of the last `pushState` (or `replaceState`) call. */
const lastUrl = (spy: MockInstance<History["pushState"]>) =>
  String(spy.mock.lastCall?.[2]);

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
let pushState: MockInstance<History["pushState"]>;
let replaceState: MockInstance<History["replaceState"]>;
beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  scrollIntoView.mockClear();
  vi.mocked(trackEvent).mockClear();
  trackView.mockClear();
  trackContactClicked.mockClear();
  trackOrganigramLink.mockClear();
  trackStepLinkClicked.mockClear();
  setUrl("/hulp");
  mockPanel = null;
  pushState = vi.spyOn(window.history, "pushState");
  replaceState = vi.spyOn(window.history, "replaceState");
});

afterEach(() => {
  pushState.mockRestore();
  replaceState.mockRestore();
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
    const email = screen.getByRole("link", { name: /e-mail/i });
    // Following the `mailto:` would move happy-dom off the origin, and every
    // later relative `replaceState` in this file would then silently no-op.
    email.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(email);
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
    setUrl("/hulp?audience=supporter");
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
    setUrl("/hulp?audience=supporter");
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
    // via `setUrl`, matching the sibling audience test below.
    setUrl("/hulp?audience=speler");
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
    setUrl("/hulp?audience=speler");
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
    setUrl("/hulp?audience=speler");
    const pathsWithoutSpelerRole = FINDER_FIXTURE_PATHS.filter(
      (p) => !p.role.includes("speler"),
    );
    render(<HulpFinder responsibilityPaths={pathsWithoutSpelerRole} />);

    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Toon alle doelgroepen" }),
    );

    // `audience` is gone from the pushed URL; `categorie=medisch` survives.
    expect(lastUrl(pushState)).not.toContain("audience=");
    expect(lastUrl(pushState)).toContain("categorie=medisch");
    // The category selection survives the undo click.
    expect(screen.getByRole("button", { name: "Medisch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("filters by the ?audience param (hero deep-link)", () => {
    setUrl("/hulp?audience=supporter");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    expect(q(/ik wil sponsor worden/i)).toBeInTheDocument();
    expect(qMaybe(/hoe schrijf ik mijn kind in/i)).not.toBeInTheDocument();
  });

  it("an audience chip writes the ?audience param", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouder" }));
    expect(lastUrl(pushState)).toBe("/hulp?audience=ouder#hulp");
  });

  it("a category chip writes the ?categorie param", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));
    expect(lastUrl(pushState)).toBe("/hulp?categorie=medisch#hulp");
  });

  it("seeds the active category from ?categorie= (e.g. after browser back)", () => {
    setUrl("/hulp?categorie=medisch");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    expect(screen.getByRole("button", { name: "Medisch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(q(/mijn kind is geblesseerd/i)).toBeInTheDocument();
  });

  it("gains an explicit 'Alles' reset chip on the audience row (#2429/#2564)", () => {
    setUrl("/hulp?audience=ouder");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    // Both rows now carry an "Alles" chip.
    expect(screen.getAllByRole("button", { name: "Alles" }).length).toBe(2);

    // Re-pressing the already-active "Ouder" chip is a dedup no-op — the
    // toggle-off-by-reclicking idiom is retired in favour of "Alles" as the
    // one reset, matching every other absorbed row.
    fireEvent.click(screen.getByRole("button", { name: "Ouder" }));
    expect(pushState).not.toHaveBeenCalled();

    const allesButtons = screen.getAllByRole("button", { name: "Alles" });
    fireEvent.click(allesButtons[0]!);
    expect(lastUrl(pushState)).toBe("/hulp#hulp");
  });

  it("keeps the #<slug> deep-linked category after an unrelated audience chip click (#2564 review finding 2)", () => {
    // Reproduction: land on /hulp#<slug> (reveal() sets `category` locally,
    // WITHOUT touching ?categorie=), then press an audience chip — an
    // unrelated ?audience= URL push must not clobber the revealed category
    // back to "Alles".
    setUrl("/hulp#blessure");
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
    setUrl("/hulp?audience=supporter#blessure"); // role: ouder + speler, not supporter
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
    setUrl("/hulp#blessure");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);

    scrollIntoView.mockClear();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("a #<slug> deep-link rewrites the URL in place — both params, the slug hash, no new history entry", () => {
    setUrl("/hulp?audience=supporter#blessure");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    expect(pushState).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search).toBe(
      "/hulp?categorie=medisch",
    );
    expect(window.location.hash).toBe("#blessure");
  });

  it("keeps the member panel's ?member= param on a filter press", () => {
    setUrl("/hulp?member=node-gc");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));
    expect(lastUrl(pushState)).toBe(
      "/hulp?member=node-gc&categorie=medisch#hulp",
    );
  });

  it("restores both previous facets on browser back (popstate)", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouder" }));
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));
    act(() => {
      setUrl("/hulp");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    for (const alles of screen.getAllByRole("button", { name: "Alles" })) {
      expect(alles).toHaveAttribute("aria-pressed", "true");
    }
  });

  it("shows an empty state when there are no paths", () => {
    render(<HulpFinder responsibilityPaths={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /nog geen hulpvragen/i,
    );
  });
});
