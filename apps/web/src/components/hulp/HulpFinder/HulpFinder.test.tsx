/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HulpFinder } from "./HulpFinder";
import { FINDER_FIXTURE_PATHS } from "./__fixtures__/paths.fixture";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/hulp",
  useSearchParams: () => mockSearchParams,
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

// jsdom doesn't implement scrollIntoView — stub it so the finder's
// scroll-into-view effects don't throw, and so we can assert them.
const scrollIntoView = vi.fn();
beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  scrollIntoView.mockClear();
  mockReplace.mockClear();
  trackView.mockClear();
  trackContactClicked.mockClear();
  trackOrganigramLink.mockClear();
  trackStepLinkClicked.mockClear();
  mockSearchParams = new URLSearchParams();
  mockPanel = null;
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
    mockSearchParams = new URLSearchParams("audience=supporter");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    // No medisch path is tagged 'supporter' → the category is empty for them.
    fireEvent.click(screen.getByRole("button", { name: "Medisch" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      /geen hulpvragen in deze categorie/i,
    );
  });

  it("filters by the ?audience param (hero deep-link)", () => {
    mockSearchParams = new URLSearchParams("audience=supporter");
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    expect(q(/ik wil sponsor worden/i)).toBeInTheDocument();
    expect(qMaybe(/hoe schrijf ik mijn kind in/i)).not.toBeInTheDocument();
  });

  it("an audience chip writes the ?audience param", () => {
    render(<HulpFinder responsibilityPaths={FINDER_FIXTURE_PATHS} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouder" }));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("audience=ouder"),
      { scroll: false },
    );
  });

  it("shows an empty state when there are no paths", () => {
    render(<HulpFinder responsibilityPaths={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /nog geen hulpvragen/i,
    );
  });
});
