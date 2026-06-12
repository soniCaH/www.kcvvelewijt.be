import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HubSearch } from "./HubSearch";
import { HUB_SEARCH_MEMBERS, HUB_SEARCH_PATHS } from "./hub-search.fixture";
import type { SemanticSearchResult } from "@/hooks/useSemanticSearch";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "@/lib/analytics/track-event";

// Controllable semantic answer lane.
const mockSemantic: {
  results: SemanticSearchResult[];
  answer: string | undefined;
  loading: boolean;
  error: string | null;
  executedQuery: string;
  search: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} = {
  results: [],
  answer: undefined,
  loading: false,
  error: null,
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

describe("HubSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "";
    mockPanel = null;
    setSemantic({
      results: [],
      loading: false,
      error: null,
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
    // executedQuery !== the typed query → not settled yet, nothing stale to show.
    setSemantic({ results: [], executedQuery: "" });
    renderSearch();
    typeQuery("blessure");
    expect(await screen.findByText(/Slim zoeken/i)).toBeInTheDocument();
    expect(screen.queryByText(/Geen resultaten/)).not.toBeInTheDocument();
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

  it("falls back to keyword (no smart hint) when the endpoint errors", async () => {
    setSemantic({ error: "boom" });
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
