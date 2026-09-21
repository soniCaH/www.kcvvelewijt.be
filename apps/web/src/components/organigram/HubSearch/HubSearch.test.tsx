import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { HubSearch } from "./HubSearch";
import {
  HubSearchQueryProvider,
  useHubSearchTopInsetPublisher,
} from "./HubSearchQueryProvider";
import { HUB_SEARCH_MEMBERS, HUB_SEARCH_PATHS } from "./hub-search.fixture";
import type { SemanticSearchResult } from "@/hooks/useSemanticSearch";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "@/lib/analytics/track-event";

// Controllable semantic answer lane.
const mockSemantic: {
  results: SemanticSearchResult[];
  answer: string | undefined;
  loading: boolean;
  error: boolean;
  executedQuery: string;
  search: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} = {
  results: [],
  answer: undefined,
  loading: false,
  error: false,
  executedQuery: "",
  search: vi.fn(),
  clear: vi.fn(),
};
vi.mock("@/hooks/useSemanticSearch", () => ({
  useSemanticSearch: () => mockSemantic,
}));

let mockPanel: { openMember: ReturnType<typeof vi.fn> } | null = null;
vi.mock("@/components/organigram/HubMemberPanel", () => ({
  useHubMemberPanel: () => mockPanel,
}));

function setSemantic(
  patch: Partial<Pick<typeof mockSemantic, "results" | "loading" | "error">> & {
    executedQuery?: string;
  },
) {
  Object.assign(mockSemantic, patch);
}

/** Build a semantic hit for one of the fixture paths (slug == path id). */
function hit(slug: string, score: number): SemanticSearchResult {
  return {
    id: slug,
    slug,
    type: "responsibility",
    score,
    title: "",
    excerpt: "",
  };
}

function renderSearch() {
  return render(
    <HubSearch
      members={HUB_SEARCH_MEMBERS}
      responsibilityPaths={HUB_SEARCH_PATHS}
    />,
  );
}

function typeQuery(text: string) {
  const input = screen.getByLabelText("Zoek een persoon of hulpvraag");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: text } });
  return input;
}

/** Stands in for `<OrganigramSectionNav>`, the real publisher of the
 *  pinned strip's height. */
function InsetPublisher({ value }: { value: number }) {
  const publish = useHubSearchTopInsetPublisher();
  useEffect(() => {
    publish(value);
  }, [publish, value]);
  return null;
}

describe("HubSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "";
    mockPanel = null;
    setSemantic({
      results: [],
      loading: false,
      error: false,
      executedQuery: "",
    });
  });

  it("opens the member panel when a person is chosen and a provider is present (F5)", async () => {
    const openMember = vi.fn();
    mockPanel = { openMember };
    renderSearch();
    typeQuery("in");
    fireEvent.click(await screen.findByText("Inge De Wit"));
    expect(openMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: "secretaris" }),
      expect.objectContaining({ view: "cards" }),
    );
    expect(window.location.hash).toBe("#structuur");
  });

  it("renders the search input", () => {
    renderSearch();
    expect(
      screen.getByLabelText("Zoek een persoon of hulpvraag"),
    ).toBeInTheDocument();
  });

  it("wears the section-nav chip's paper weight in the nav variant — 1px border, 1px shadow (#2478 rule 5 addendum)", () => {
    render(
      <HubSearch
        members={HUB_SEARCH_MEMBERS}
        responsibilityPaths={HUB_SEARCH_PATHS}
        variant="nav"
      />,
    );
    const box = screen.getByLabelText(
      "Zoek een persoon of hulpvraag",
    ).parentElement!;

    expect(box).toHaveClass("border");
    expect(box).not.toHaveClass("border-2");
    expect(box.className).toContain("shadow-[1px_1px_0_0_var(--color-ink)]");
  });

  it("keeps the hero variant's 2px border and 4px shadow byte-unchanged", () => {
    renderSearch();
    const box = screen.getByLabelText(
      "Zoek een persoon of hulpvraag",
    ).parentElement!;

    expect(box).toHaveClass("border-2");
    expect(box.className).toContain("shadow-[4px_4px_0_0_var(--color-ink)]");
  });

  it("interleaves keyword people with semantic answers", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    typeQuery("in");
    // Person (keyword, after debounce) + answer (semantic, mapped by slug).
    expect(await screen.findByText("Inge De Wit")).toBeInTheDocument();
    expect(
      screen.getByText("Hoe schrijf ik mijn kind in?"),
    ).toBeInTheDocument();
  });

  it("renders answer-forward (summary + lees meer) when the top score ≥ 0.5", async () => {
    setSemantic({ results: [hit("blessure", 0.82)], executedQuery: "bezeerd" });
    renderSearch();
    typeQuery("bezeerd");
    expect(
      await screen.findByText(/Lees volledig antwoord/i),
    ).toBeInTheDocument();
    // The CMS summary is shown inline (not an LLM answer).
    expect(
      screen.getByText(/Verwittig de gerechtigd correspondent/i),
    ).toBeInTheDocument();
  });

  it("stays list-only (no answer-forward) when the top score < 0.5", async () => {
    setSemantic({ results: [hit("blessure", 0.41)], executedQuery: "x" });
    renderSearch();
    typeQuery("x");
    expect(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Lees volledig antwoord/i),
    ).not.toBeInTheDocument();
  });

  it("shows a smart-search hint in semantic mode", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    typeQuery("in");
    expect(await screen.findByText(/Slim gezocht/i)).toBeInTheDocument();
  });

  it("shimmers (no empty-state flash) while the answer lane is still resolving", async () => {
    // executedQuery !== the typed query → not settled yet, nothing stale to
    // show, and "bezeerd" is literally in no path (#3092 renders those at once).
    setSemantic({ results: [], executedQuery: "" });
    renderSearch();
    typeQuery("bezeerd");
    expect(await screen.findByText(/Slim zoeken/i)).toBeInTheDocument();
    expect(screen.queryByText(/Geen resultaten/)).not.toBeInTheDocument();
  });

  // #3092 — an editor's keyword must find its path whatever semantic ranks.
  it("shows a literal keyword hit the semantic lane left out", async () => {
    setSemantic({
      results: [hit("inschrijven", 0.44)],
      executedQuery: "ongeval",
    });
    renderSearch();
    typeQuery("ongeval");
    expect(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hoe schrijf ik mijn kind in?"),
    ).toBeInTheDocument();
  });

  it("renders a literal hit at once, and says it is still searching", async () => {
    setSemantic({ results: [], executedQuery: "" });
    renderSearch();
    typeQuery("verzekering");
    expect(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Slim zoeken/i)).toBeInTheDocument();
    expect(screen.queryByText(/Slim gezocht/i)).not.toBeInTheDocument();
  });

  it("keeps a confident semantic answer as the forward card, with the literal hit after it", async () => {
    setSemantic({
      results: [hit("inschrijven", 0.82)],
      executedQuery: "ongeval",
    });
    renderSearch();
    typeQuery("ongeval");
    expect(
      await screen.findByText(/Lees volledig antwoord/i),
    ).toBeInTheDocument();
    // The literal lane waits out the 200ms typing debounce.
    expect(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Hoe schrijf ik mijn kind in?")).toHaveLength(1);
  });

  it("keyboard-selects the answer-forward card (ArrowDown + Enter)", async () => {
    setSemantic({ results: [hit("blessure", 0.82)], executedQuery: "bezeerd" });
    renderSearch();
    const input = typeQuery("bezeerd");
    await screen.findByText(/Lees volledig antwoord/i);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(window.location.hash).toBe("#blessure");
  });

  it("drops a stale keyboard highlight when the result set recomposes (shimmer→answer-forward)", async () => {
    // Shimmer first: a person query is highlighted while the answer lane resolves.
    setSemantic({ results: [], executedQuery: "" });
    const view = renderSearch();
    const input = typeQuery("in");
    await screen.findByText(/Slim zoeken/i);
    fireEvent.keyDown(input, { key: "ArrowDown" }); // highlight the first member

    // The answer lane settles with a strong answer-forward → navItems recompose
    // (member at index 0 is now the answer card). The highlight must be dropped.
    setSemantic({ results: [hit("inschrijven", 0.82)], executedQuery: "in" });
    view.rerender(
      <HubSearch
        members={HUB_SEARCH_MEMBERS}
        responsibilityPaths={HUB_SEARCH_PATHS}
      />,
    );
    await screen.findByText(/Lees volledig antwoord/i);

    // Enter now selects nothing (no stale index → no wrong-item navigation).
    fireEvent.keyDown(input, { key: "Enter" });
    expect(window.location.hash).toBe("");
  });

  it("drops a stale highlight on a settled→settled recompose (answer-forward changes, no shimmer)", async () => {
    // Already settled with one answer-forward (no shimmer at any point).
    setSemantic({ results: [hit("blessure", 0.82)], executedQuery: "x" });
    const view = renderSearch();
    const input = typeQuery("x");
    await screen.findByText(/Lees volledig antwoord/i);
    fireEvent.keyDown(input, { key: "ArrowDown" }); // highlight the answer-forward

    // A fresh settle for the SAME query promotes a DIFFERENT answer-forward —
    // showShimmer stays false throughout, so only a content-keyed reset catches it.
    setSemantic({ results: [hit("inschrijven", 0.82)], executedQuery: "x" });
    view.rerender(
      <HubSearch
        members={HUB_SEARCH_MEMBERS}
        responsibilityPaths={HUB_SEARCH_PATHS}
      />,
    );
    await screen.findByText("Hoe schrijf ik mijn kind in?");

    // The highlight was dropped → Enter does not fire the newly-promoted answer.
    fireEvent.keyDown(input, { key: "Enter" });
    expect(window.location.hash).toBe("");
  });

  it("falls back to keyword (no smart hint) when the endpoint errors", async () => {
    setSemantic({ error: true });
    renderSearch();
    typeQuery("blessure");
    // Keyword fallback still finds the answer by its keyword.
    expect(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Slim gezocht|Beste match/i),
    ).not.toBeInTheDocument();
  });

  it("scrolls to #structuur and tracks query_length when a person is chosen", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    typeQuery("in");
    fireEvent.click(await screen.findByText("Inge De Wit"));
    expect(window.location.hash).toBe("#structuur");
    expect(trackEvent).toHaveBeenCalledWith("organigram_search_used", {
      query_length: 2,
    });
  });

  it("deep-links the finder accordion by slug when an answer is chosen", async () => {
    setSemantic({
      results: [hit("blessure", 0.41)],
      executedQuery: "blessure",
    });
    renderSearch();
    typeQuery("blessure");
    fireEvent.click(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    );
    expect(window.location.hash).toBe("#blessure");
  });

  it("still fires a hashchange when the SAME answer is chosen twice", async () => {
    // The finder reopens a card on `hashchange`. Writing the same hash value
    // a second time changes nothing, so the browser fires no event and a card
    // the visitor collapsed in between would stay shut.
    setSemantic({
      results: [hit("blessure", 0.41)],
      executedQuery: "blessure",
    });
    const onHashChange = vi.fn();
    window.addEventListener("hashchange", onHashChange);
    renderSearch();
    typeQuery("blessure");
    fireEvent.click(
      await screen.findByText("Wat moet ik doen bij een blessure?"),
    );
    expect(window.location.hash).toBe("#blessure");

    // Search the very same question again — picking it must reach the finder a
    // second time, even though the hash already holds this slug. Re-typing the
    // query matters: selecting closes the dropdown, so the first result row is
    // detached and clicking it again would be a no-op for the wrong reason.
    typeQuery("blessure");
    const sameRow = await screen.findByText(
      "Wat moet ik doen bij een blessure?",
    );
    // Cleared here, with no `await` left before the assertion: happy-dom does
    // not fire `hashchange` synchronously on a hash write, so anything the
    // first pick queued must not be allowed to land in this count.
    onHashChange.mockClear();
    fireEvent.click(sameRow);
    window.removeEventListener("hashchange", onHashChange);
    expect(onHashChange).toHaveBeenCalled();
  });

  it("shows an empty state with a contact escape when nothing matches", async () => {
    setSemantic({ results: [], executedQuery: "zzzzz" });
    renderSearch();
    typeQuery("zzzzz");
    expect(await screen.findByText(/Geen resultaten voor/)).toBeInTheDocument();

    const escape = screen.getByRole("link", { name: /Contacteer de club/ });
    expect(escape).toHaveAttribute("href", "/club/contact");
    fireEvent.click(escape);
    expect(trackEvent).toHaveBeenCalledWith(
      "organigram_search_contact_escape",
      expect.objectContaining({ query_length: 5 }),
    );
  });

  it("clears the query with the clear button", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    const input = typeQuery("in") as HTMLInputElement;
    await screen.findByText("Inge De Wit");
    fireEvent.click(screen.getByLabelText("Wissen"));
    expect(input.value).toBe("");
  });

  it("Escape closes the listbox but keeps focus in the input, and typing reopens it (S2)", async () => {
    const user = userEvent.setup();
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    const input = screen.getByLabelText(
      "Zoek een persoon of hulpvraag",
    ) as HTMLInputElement;
    await user.click(input);
    await user.type(input, "in");
    await screen.findByText("Inge De Wit");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    // Popup closed, but focus stays in the input (not blurred to <body>).
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveFocus();

    // Typing reopens the popup (onChange re-sets isFocused).
    await user.type(input, "g");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
  });

  it("announces the result count to screen readers via a polite live region (S1)", async () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    renderSearch();
    typeQuery("in");
    await screen.findByText("Inge De Wit");
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/\d+ resulta(at|ten)/);
  });
});

/**
 * The hub mounts `<HubSearch>` twice — hero + sticky nav — and hands the
 * search over as the hero scrolls behind the pinned chrome (#3043). Before
 * that handoff each instance held its own query and popup state, so the hero's
 * listbox stayed open over the header with no visible input under it.
 */
describe("HubSearch — the hub handoff (#3043)", () => {
  beforeEach(() => {
    // `mockSemantic` is module-level: reset it here too, or a `setSemantic`
    // from one test leaks into the next (and out of this describe).
    vi.clearAllMocks();
    setSemantic({
      results: [],
      loading: false,
      error: false,
      executedQuery: "",
    });
    FakeIntersectionObserver.reset();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The real page's hero placeholder (`OrganigramHero.tsx`), not the
  // component default — the test should break if the page stops passing it.
  const HERO_PLACEHOLDER = 'bv. "mijn kind is geblesseerd" of een naam…';
  const NAV_PLACEHOLDER = "Zoek…";

  function renderPair() {
    render(
      <HubSearchQueryProvider>
        <HubSearch
          members={HUB_SEARCH_MEMBERS}
          responsibilityPaths={HUB_SEARCH_PATHS}
          variant="hero"
          placeholder={HERO_PLACEHOLDER}
        />
        <HubSearch
          members={HUB_SEARCH_MEMBERS}
          responsibilityPaths={HUB_SEARCH_PATHS}
          variant="nav"
          placeholder={NAV_PLACEHOLDER}
        />
      </HubSearchQueryProvider>,
    );
    const hero = screen.getByPlaceholderText(HERO_PLACEHOLDER);
    const nav = screen.getByPlaceholderText(NAV_PLACEHOLDER);
    return {
      hero,
      nav,
      heroRoot: hero.closest("[data-hub-search]") as HTMLElement,
      navRoot: nav.closest("[data-hub-search]") as HTMLElement,
    };
  }

  /** The LIVE observer watching one instance's own wrapper, if it has one —
   *  the last constructed, since the effect rebuilds when the section nav
   *  publishes its measured inset and the earlier one is disconnected. */
  function observersFor(root: HTMLElement) {
    return FakeIntersectionObserver.instances.filter((instance) =>
      instance.observed.includes(root),
    );
  }

  function observerFor(root: HTMLElement) {
    return observersFor(root).at(-1);
  }

  function scrollBehindChrome(root: HTMLElement) {
    const observer = observerFor(root);
    if (!observer) throw new Error("no IntersectionObserver for that wrapper");
    act(() => {
      observer.trigger([{ isIntersecting: false }]);
    });
  }

  it("shares one query, so what is typed in the hero shows in the nav copy", () => {
    const { hero, nav } = renderPair();
    fireEvent.focus(hero);
    fireEvent.change(hero, { target: { value: "mijn kind is geblesseerd" } });

    expect(nav).toHaveValue("mijn kind is geblesseerd");
  });

  it("never watches the nav copy — it lives inside the strip that would inset it away", () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    const { hero, navRoot } = renderPair();

    // The nav copy sits INSIDE the sticky bar, i.e. above the observer root's
    // own top edge. Observing it would report "not intersecting" on the first
    // delivery and never flip, so the handed-off popup would never render.
    expect(observerFor(navRoot)).toBeUndefined();

    fireEvent.focus(hero);
    fireEvent.change(hero, { target: { value: "in" } });
    expect(navRoot.querySelector('[role="listbox"]')).toBeInTheDocument();
  });

  it("insets its observer by the strip the section nav measured, not by a guess", () => {
    const TOP_INSET = 117;
    render(
      <HubSearchQueryProvider>
        <InsetPublisher value={TOP_INSET} />
        <HubSearch
          members={HUB_SEARCH_MEMBERS}
          responsibilityPaths={HUB_SEARCH_PATHS}
          variant="hero"
          placeholder={HERO_PLACEHOLDER}
        />
      </HubSearchQueryProvider>,
    );
    const heroRoot = screen
      .getByPlaceholderText(HERO_PLACEHOLDER)
      .closest("[data-hub-search]") as HTMLElement;

    // The geometry is the feature: an observer that insets by the header alone
    // leaves the popup painting over the section bar for the bar's own height.
    expect(observerFor(heroRoot)?.options?.rootMargin).toBe(
      `-${TOP_INSET}px 0px 0px 0px`,
    );
    // The bar measures itself after first paint, so the observer built against
    // the `0`-seeded inset must be torn down, not left running alongside.
    expect(
      observersFor(heroRoot)
        .slice(0, -1)
        .every((observer) => observer.disconnected),
    ).toBe(true);
  });

  it("suppresses no popup when there is no sticky chrome to hide behind", () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    render(
      <HubSearch
        members={HUB_SEARCH_MEMBERS}
        responsibilityPaths={HUB_SEARCH_PATHS}
        placeholder={HERO_PLACEHOLDER}
      />,
    );
    const root = screen
      .getByPlaceholderText(HERO_PLACEHOLDER)
      .closest("[data-hub-search]") as HTMLElement;

    // Storybook and any other provider-less host: a box rendered near the top
    // of the viewport must not lose its popup to an inset that assumes a
    // header the page does not have.
    expect(observerFor(root)?.options?.rootMargin).toBe("-0px 0px 0px 0px");
  });

  it("closes the hero popup when the hero box tucks behind the chrome, and keeps the nav copy's", () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    const { hero, heroRoot, navRoot } = renderPair();
    fireEvent.focus(hero);
    fireEvent.change(hero, { target: { value: "in" } });
    expect(heroRoot.querySelector('[role="listbox"]')).toBeInTheDocument();

    scrollBehindChrome(heroRoot);

    expect(heroRoot.querySelector('[role="listbox"]')).not.toBeInTheDocument();
    expect(navRoot.querySelector('[role="listbox"]')).toBeInTheDocument();
  });

  it("keeps a press on a nav result alive — the hero's outside-click must not close the shared popup", () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    const { hero, heroRoot, navRoot } = renderPair();
    fireEvent.focus(hero);
    fireEvent.change(hero, { target: { value: "in" } });
    scrollBehindChrome(heroRoot);

    const option = navRoot.querySelector('[role="option"]') as HTMLElement;
    // Both instances listen on `document` for an outside `mousedown`. Sharing
    // `open` means the hero's listener would close the nav's popup here,
    // unmounting the row before its `click` could ever fire `select()`.
    fireEvent.mouseDown(option);

    expect(navRoot.querySelector('[role="listbox"]')).toBeInTheDocument();
  });

  it("releases the caret instead of handing it over, so no invisible input keeps focus", () => {
    const { hero, nav, heroRoot } = renderPair();
    fireEvent.focus(hero);
    hero.focus();
    fireEvent.change(hero, { target: { value: "in" } });
    expect(hero).toHaveFocus();

    scrollBehindChrome(heroRoot);

    // Owner call (#3043): the caret does not jump to the nav copy — moving it
    // would raise the software keyboard on a phone. It is dropped instead, so
    // the box the visitor can no longer see does not keep keyboard focus.
    expect(nav).not.toHaveFocus();
    expect(hero).not.toHaveFocus();
  });

  it("stops the off-screen instance embedding the shared query, so one search runs per keystroke", () => {
    const { hero, heroRoot } = renderPair();
    fireEvent.focus(hero);
    fireEvent.change(hero, { target: { value: "in" } });
    mockSemantic.search.mockClear();

    scrollBehindChrome(heroRoot);

    expect(mockSemantic.search).toHaveBeenCalledWith("");
  });

  it("renders the popup below the sticky header's own z-index, never level with it", () => {
    setSemantic({ results: [hit("inschrijven", 0.42)], executedQuery: "in" });
    const { hero, heroRoot } = renderPair();
    fireEvent.focus(hero);
    fireEvent.change(hero, { target: { value: "in" } });

    // `<SiteHeader>` is `z-50`; at an equal z-index paint order would hand this
    // popup the header.
    const listbox = heroRoot.querySelector('[role="listbox"]');
    expect(listbox).toHaveClass("z-40");
    expect(listbox).not.toHaveClass("z-50");
  });
});
