import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import type { EventVM } from "@/lib/repositories/event.repository";

// Mock the data layer — the GROQ upcoming-only filter is exercised in the
// repository test; here we drive the page from a fixed list.
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn(),
}));

vi.mock("@/lib/repositories/event.repository", () => ({
  EventRepository: {},
}));

const { runPromise } = await import("@/lib/effect/runtime");
const mockRunPromise = vi.mocked(runPromise);

function makeEvent(overrides: Partial<EventVM> = {}): EventVM {
  return {
    id: "event-1",
    title: "Spaghetti-avond",
    slug: "spaghetti-avond",
    eventType: "Clubevent",
    dateStart: "2026-09-12T18:00:00Z",
    dateEnd: null,
    location: "Sportpark Driesput, Elewijt",
    href: "#",
    featuredOnHome: false,
    coverImageUrl: null,
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

  it("renders a ticket linking to /evenementen/[slug] per upcoming event", async () => {
    mockRunPromise.mockResolvedValue([
      makeEvent({ slug: "spaghetti-avond", title: "Spaghetti-avond" }),
      makeEvent({
        id: "event-2",
        slug: "supportersreis",
        title: "Supportersreis",
        eventType: "Supportersactiviteit",
      }),
    ]);

    const EvenementenPage = (await import("./page")).default;
    render(await EvenementenPage());

    expect(
      screen.getByRole("link", { name: /Spaghetti-avond/i }),
    ).toHaveAttribute("href", "/evenementen/spaghetti-avond");
    expect(
      screen.getByRole("link", { name: /Supportersreis/i }),
    ).toHaveAttribute("href", "/evenementen/supportersreis");
  });
});
