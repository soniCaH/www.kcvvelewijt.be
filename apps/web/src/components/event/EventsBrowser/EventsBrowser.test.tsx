import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { EventVM } from "@/lib/repositories/event.repository";
import { trackEvent } from "@/lib/analytics/track-event";
import { EventsBrowser } from "./EventsBrowser";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
const mockTrackEvent = vi.mocked(trackEvent);

function ev(overrides: Partial<EventVM> & { id: string }): EventVM {
  return {
    title: "Evenement",
    slug: overrides.id,
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

const EVENTS: EventVM[] = [
  ev({
    id: "spaghetti-avond",
    title: "Spaghetti-avond",
    eventType: "Clubevent",
  }),
  ev({
    id: "supportersreis",
    title: "Supportersreis",
    eventType: "Supportersactiviteit",
    dateStart: "2026-10-04T08:00:00Z",
  }),
];

describe("<EventsBrowser>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the empty-list state with no filter row when there are no events", () => {
    render(<EventsBrowser events={[]} />);

    expect(
      screen.getByText(/geen evenementen gepland — kom snel terug/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: /filter evenementen op type/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the filter row and every event by default", () => {
    render(<EventsBrowser events={EVENTS} />);

    expect(
      screen.getByRole("group", { name: /filter evenementen op type/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /spaghetti-avond/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /supportersreis/i }),
    ).toBeInTheDocument();
  });

  it("narrows the list to the selected type and hides non-matching months", async () => {
    render(<EventsBrowser events={EVENTS} />);

    await userEvent.click(screen.getByRole("button", { name: "Clubevent" }));

    expect(
      screen.getByRole("link", { name: /spaghetti-avond/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /supportersreis/i }),
    ).not.toBeInTheDocument();
    // The Clubevent is in September, the Supportersactiviteit in October — the
    // now-empty October header must drop.
    expect(screen.queryByText(/oktober/i)).not.toBeInTheDocument();
    expect(screen.getByText(/september/i)).toBeInTheDocument();
  });

  it("buckets a type-less event under the Andere chip", async () => {
    render(
      <EventsBrowser
        events={[
          ev({ id: "vergadering", title: "Vergadering", eventType: null }),
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Andere" }));

    expect(
      screen.getByRole("link", { name: /vergadering/i }),
    ).toBeInTheDocument();
  });

  it("shows a per-category message + reset when a type has no events", async () => {
    render(<EventsBrowser events={EVENTS} />);

    await userEvent.click(screen.getByRole("button", { name: "Jeugdwerking" }));

    // The message lives in a polite live region so screen readers announce it
    // when a filter selection empties the list (client-side state change).
    expect(screen.getByRole("status")).toHaveTextContent(
      /geen evenementen in de categorie jeugdwerking gepland/i,
    );
    // Filter row stays visible in the filtered-to-zero state.
    expect(
      screen.getByRole("group", { name: /filter evenementen op type/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Toon alles" }));

    expect(
      screen.getByRole("link", { name: /spaghetti-avond/i }),
    ).toBeInTheDocument();
  });

  it("fires event_filter with the selected event_type on a real change", async () => {
    render(<EventsBrowser events={EVENTS} />);

    await userEvent.click(screen.getByRole("button", { name: "Clubevent" }));

    expect(mockTrackEvent).toHaveBeenCalledWith("event_filter", {
      event_type: "Clubevent",
    });
  });

  it("does not re-fire event_filter when the active chip is re-pressed (dedup guard)", async () => {
    render(<EventsBrowser events={EVENTS} />);

    const allesChip = screen.getByRole("button", { name: "Alles" });
    // "Alles" is already selected → no-op, no analytics.
    await userEvent.click(allesChip);
    expect(mockTrackEvent).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Clubevent" }));
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    // Re-pressing the now-active Clubevent chip must not fire again.
    await userEvent.click(screen.getByRole("button", { name: "Clubevent" }));
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it("renders the filtered-to-zero state when seeded via initialSelected", () => {
    render(<EventsBrowser events={EVENTS} initialSelected="Jeugdwerking" />);

    const group = screen.getByRole("group", {
      name: /filter evenementen op type/i,
    });
    expect(
      within(group).getByRole("button", { name: "Jeugdwerking" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(
        /geen evenementen in de categorie jeugdwerking gepland/i,
      ),
    ).toBeInTheDocument();
  });
});
