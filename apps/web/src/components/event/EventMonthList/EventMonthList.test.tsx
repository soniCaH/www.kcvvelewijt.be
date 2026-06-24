import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import type { EventListItemVM } from "@/lib/repositories/event.repository";
import { EventMonthList } from "./EventMonthList";

function makeEvent(overrides: Partial<EventListItemVM> = {}): EventListItemVM {
  return {
    id: "event-1",
    title: "Spaghetti-avond",
    href: "/evenementen/spaghetti-avond",
    eventType: "Clubevent",
    dateStart: "2026-09-12T12:00:00Z",
    dateEnd: null,
    location: "Sportpark Driesput, Elewijt",
    source: "event",
    ...overrides,
  };
}

describe("EventMonthList", () => {
  it("renders a month heading per chronological group", () => {
    render(
      <EventMonthList
        events={[
          makeEvent({ id: "a", dateStart: "2026-09-12T12:00:00Z" }),
          makeEvent({ id: "b", dateStart: "2026-10-03T12:00:00Z" }),
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "September.",
      "Oktober.",
    ]);
  });

  it("accents the month name (warm italic emphasis on the dark field)", () => {
    render(
      <EventMonthList
        events={[makeEvent({ id: "a", dateStart: "2026-09-12T12:00:00Z" })]}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    const em = heading.querySelector("em");
    expect(em).not.toBeNull();
    expect(em?.textContent).toBe("September");
    expect(em?.className).toContain("text-warm");
    // The trailing period stays unaccented (outside the <em>).
    expect(heading.textContent).toBe("September.");
  });

  it("links each ticket to the item's resolved href — event docs and event articles alike", () => {
    render(
      <EventMonthList
        events={[
          makeEvent({
            id: "a",
            href: "/evenementen/spaghetti-avond",
            title: "Spaghetti",
          }),
          makeEvent({
            id: "b",
            href: "/nieuws/jeugdtornooi-verslag",
            title: "Jeugdtornooi",
            source: "article",
            dateStart: "2026-09-20T12:00:00Z",
          }),
        ]}
      />,
    );

    // Event-doc ticket → /evenementen/[slug]; article ticket → /nieuws/[slug].
    expect(screen.getByRole("link", { name: /Spaghetti/i })).toHaveAttribute(
      "href",
      "/evenementen/spaghetti-avond",
    );
    expect(screen.getByRole("link", { name: /Jeugdtornooi/i })).toHaveAttribute(
      "href",
      "/nieuws/jeugdtornooi-verslag",
    );
  });

  it("renders nothing when there are no events", () => {
    const { container } = render(<EventMonthList events={[]} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});
