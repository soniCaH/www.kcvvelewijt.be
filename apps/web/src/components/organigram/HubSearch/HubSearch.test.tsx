import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HubSearch } from "./HubSearch";
import { HUB_SEARCH_MEMBERS, HUB_SEARCH_PATHS } from "./hub-search.fixture";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "@/lib/analytics/track-event";

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
  });

  it("renders the search input", () => {
    renderSearch();
    expect(
      screen.getByLabelText("Zoek een persoon of hulpvraag"),
    ).toBeInTheDocument();
  });

  it("returns both people and answers for a query (interleaved)", async () => {
    renderSearch();
    typeQuery("in");
    // Person result (Inge De Wit) + answer result (the inschrijven question).
    expect(await screen.findByText("Inge De Wit")).toBeInTheDocument();
    expect(
      await screen.findByText("Hoe schrijf ik mijn kind in?"),
    ).toBeInTheDocument();
  });

  it("scrolls to #structuur and tracks query_length when a person is chosen", async () => {
    renderSearch();
    typeQuery("in");
    const person = await screen.findByText("Inge De Wit");
    fireEvent.click(person);
    expect(window.location.hash).toBe("#structuur");
    expect(trackEvent).toHaveBeenCalledWith("organigram_search_used", {
      query_length: 2,
    });
  });

  it("deep-links the finder accordion by slug when an answer is chosen", async () => {
    renderSearch();
    typeQuery("blessure");
    const answer = await screen.findByText(
      "Wat moet ik doen bij een blessure?",
    );
    fireEvent.click(answer);
    // The answer's slug — <HulpFinder> opens + scrolls to it on hashchange.
    expect(window.location.hash).toBe("#blessure");
  });

  it("shows an empty state when nothing matches", async () => {
    renderSearch();
    typeQuery("zzzzz");
    expect(await screen.findByText(/Geen resultaten voor/)).toBeInTheDocument();
  });

  it("clears the query with the clear button", async () => {
    renderSearch();
    const input = typeQuery("in") as HTMLInputElement;
    await screen.findByText("Inge De Wit");
    fireEvent.click(screen.getByLabelText("Wissen"));
    expect(input.value).toBe("");
  });
});
