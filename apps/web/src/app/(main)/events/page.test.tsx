import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn(),
}));

vi.mock("@/lib/repositories/event.repository", () => ({
  EventRepository: {},
}));

// Import after mocks
const { runPromise } = await import("@/lib/effect/runtime");
const mockRunPromise = vi.mocked(runPromise);

describe("/events page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty state", () => {
    beforeEach(() => {
      mockRunPromise.mockResolvedValue([]);
    });

    it("renders empty state heading when no upcoming events", async () => {
      const EventsPage = (await import("./page")).default;
      const jsx = await EventsPage();
      render(jsx);

      expect(
        screen.getByRole("heading", { name: /geen evenementen gepland/i }),
      ).toBeInTheDocument();
    });

    it("renders description text", async () => {
      const EventsPage = (await import("./page")).default;
      const jsx = await EventsPage();
      render(jsx);

      expect(
        screen.getByText(/bekijk het laatste nieuws of de wedstrijdkalender/i),
      ).toBeInTheDocument();
    });

    it("renders CTA links to /nieuws and /kalender", async () => {
      const EventsPage = (await import("./page")).default;
      const jsx = await EventsPage();
      render(jsx);

      const nieuwsLink = screen.getByRole("link", { name: /naar nieuws/i });
      expect(nieuwsLink).toHaveAttribute("href", "/nieuws");

      const kalenderLink = screen.getByRole("link", {
        name: /wedstrijdkalender/i,
      });
      expect(kalenderLink).toHaveAttribute("href", "/kalender");
    });

    it("does not render EventsList", async () => {
      const EventsPage = (await import("./page")).default;
      const jsx = await EventsPage();
      const { container } = render(jsx);

      expect(
        screen.queryByText(/geen evenementen gevonden/i),
      ).not.toBeInTheDocument();
      // The events list container should not be present
      expect(container.querySelectorAll("article")).toHaveLength(0);
    });
  });

  describe("with events", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    beforeEach(() => {
      mockRunPromise.mockResolvedValue([
        {
          title: "Pasta-avond",
          href: "/events/pasta-avond",
          dateStart: futureDate,
          dateEnd: null,
          coverImageUrl: null,
        },
      ]);
    });

    it("renders EventsList when events exist", async () => {
      const EventsPage = (await import("./page")).default;
      const jsx = await EventsPage();
      render(jsx);

      // Should NOT show empty state
      expect(
        screen.queryByRole("heading", { name: /geen evenementen gepland/i }),
      ).not.toBeInTheDocument();
    });
  });
});
