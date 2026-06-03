import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import type { EventVM } from "@/lib/repositories/event.repository";
import { EventMonthList } from "./EventMonthList";

function makeEvent(overrides: Partial<EventVM> = {}): EventVM {
  return {
    id: "event-1",
    title: "Spaghetti-avond",
    slug: "spaghetti-avond",
    eventType: "Clubevent",
    dateStart: "2026-09-12T12:00:00Z",
    dateEnd: null,
    location: "Sportpark Driesput, Elewijt",
    href: "#",
    featuredOnHome: false,
    coverImageUrl: null,
    ...overrides,
  };
}

describe("EventMonthList", () => {
  it("renders a month heading per chronological group", () => {
    render(
      <EventMonthList
        events={[
          makeEvent({ id: "a", slug: "a", dateStart: "2026-09-12T12:00:00Z" }),
          makeEvent({ id: "b", slug: "b", dateStart: "2026-10-03T12:00:00Z" }),
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "September.",
      "Oktober.",
    ]);
  });

  it("renders a ticket linking to /evenementen/[slug] per event", () => {
    render(
      <EventMonthList
        events={[
          makeEvent({ id: "a", slug: "spaghetti-avond", title: "Spaghetti" }),
          makeEvent({
            id: "b",
            slug: "supportersreis",
            title: "Supportersreis",
            dateStart: "2026-09-20T12:00:00Z",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Spaghetti/i })).toHaveAttribute(
      "href",
      "/evenementen/spaghetti-avond",
    );
    expect(
      screen.getByRole("link", { name: /Supportersreis/i }),
    ).toHaveAttribute("href", "/evenementen/supportersreis");
  });

  it("renders nothing when there are no events", () => {
    const { container } = render(<EventMonthList events={[]} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});
