import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import type { EventListItemVM } from "@/lib/repositories/event.repository";

// Mock the data layer — the GROQ upcoming-only filter + the event/article merge
// are exercised in the repository test; here we drive the page from a fixed
// already-merged list.
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn(),
}));

vi.mock("@/lib/repositories/event.repository", () => ({
  EventRepository: {},
}));

const { runPromise } = await import("@/lib/effect/runtime");
const mockRunPromise = vi.mocked(runPromise);

function makeEvent(overrides: Partial<EventListItemVM> = {}): EventListItemVM {
  return {
    id: "event-1",
    title: "Spaghetti-avond",
    href: "/evenementen/spaghetti-avond",
    eventType: "Clubevent",
    dateStart: "2026-09-12T18:00:00Z",
    dateEnd: null,
    location: "Sportpark Driesput, Elewijt",
    source: "event",
    ...overrides,
  };
}

describe("/evenementen page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page heading", async () => {
    mockRunPromise.mockResolvedValue([]);

    const EvenementenPage = (await import("./page")).default;
    render(await EvenementenPage());

    expect(
      screen.getByRole("heading", { level: 1, name: /Evenementen/i }),
    ).toBeInTheDocument();
  });

  it("renders an empty-state message when there are no upcoming events", async () => {
    mockRunPromise.mockResolvedValue([]);

    const EvenementenPage = (await import("./page")).default;
    render(await EvenementenPage());

    expect(screen.getByText(/Geen evenementen gepland/i)).toBeInTheDocument();
  });

  it("renders a ticket per feed item, linking event docs to /evenementen and event articles to /nieuws", async () => {
    mockRunPromise.mockResolvedValue([
      makeEvent({
        href: "/evenementen/spaghetti-avond",
        title: "Spaghetti-avond",
      }),
      makeEvent({
        id: "article-1",
        href: "/nieuws/jeugdtornooi-verslag",
        title: "Jeugdtornooi",
        eventType: "Jeugdwerking",
        source: "article",
        dateStart: "2026-09-20T10:00:00Z",
      }),
    ]);

    const EvenementenPage = (await import("./page")).default;
    render(await EvenementenPage());

    // Event-doc ticket → detail route; article ticket → the article itself.
    expect(
      screen.getByRole("link", { name: /Spaghetti-avond/i }),
    ).toHaveAttribute("href", "/evenementen/spaghetti-avond");
    expect(screen.getByRole("link", { name: /Jeugdtornooi/i })).toHaveAttribute(
      "href",
      "/nieuws/jeugdtornooi-verslag",
    );
  });
});
