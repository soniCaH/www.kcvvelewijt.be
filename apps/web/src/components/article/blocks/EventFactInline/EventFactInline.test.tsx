import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventFactInline } from "./EventFactInline";
import type { EventFactValue } from "../EventFact/types";

const BASE: EventFactValue = {
  _type: "eventFact",
  title: "Steakfestijn 2026",
  date: "2026-06-13",
  startTime: "18:00",
  endTime: "22:00",
  location: "Sportpark Elewijt",
  capacity: 180,
  competitionTag: "Clubfeest",
  ticketUrl: "https://example.com/inschrijven",
  ticketLabel: "Inschrijven",
};

describe("<EventFactInline>", () => {
  it("renders the title, date line, meta row, and CTA for upcoming events", () => {
    render(<EventFactInline value={BASE} isPast={false} />);
    expect(screen.getByText("Steakfestijn 2026")).toBeInTheDocument();
    expect(screen.getByText(/13 juni/i)).toBeInTheDocument();
    expect(screen.getByText("Clubfeest")).toBeInTheDocument();
    const cta = screen.getByText("Inschrijven").closest("a");
    expect(cta?.getAttribute("href")).toBe("https://example.com/inschrijven");
  });

  it("renders the location + capacity meta on one line", () => {
    const { container } = render(
      <EventFactInline value={BASE} isPast={false} />,
    );
    const meta = container.querySelector('[data-event-fact-inline="meta"]');
    expect(meta?.textContent).toContain("Sportpark Elewijt");
    expect(meta?.textContent).toContain("Max 180 plaatsen");
  });

  it("hides the CTA when the event is past", () => {
    render(<EventFactInline value={BASE} isPast />);
    expect(screen.queryByText("Inschrijven")).toBeNull();
    expect(screen.getByText("Afgelopen")).toBeInTheDocument();
  });

  it("hides the CTA when ticketUrl is absent", () => {
    render(
      <EventFactInline
        value={{ ...BASE, ticketUrl: undefined }}
        isPast={false}
      />,
    );
    expect(screen.queryByText("Inschrijven")).toBeNull();
    expect(screen.getByText("Clubfeest")).toBeInTheDocument();
  });

  it("renders the ★ Ook in agenda link when linkedEventSlug is supplied", () => {
    render(
      <EventFactInline
        value={BASE}
        isPast={false}
        linkedEventSlug="steakfestijn-2026"
      />,
    );
    const link = screen.getByText(/Ook in agenda/i).closest("a");
    expect(link?.getAttribute("href")).toBe("/events/steakfestijn-2026");
  });

  it("does not render the linked-event line when slug is blank", () => {
    render(
      <EventFactInline value={BASE} isPast={false} linkedEventSlug="  " />,
    );
    expect(screen.queryByText(/Ook in agenda/i)).toBeNull();
  });

  it("renders the meta row only when at least one part is populated", () => {
    const { container } = render(
      <EventFactInline
        value={{
          ...BASE,
          location: undefined,
          capacity: undefined,
        }}
        isPast={false}
      />,
    );
    expect(
      container.querySelector('[data-event-fact-inline="meta"]'),
    ).toBeNull();
  });

  it("rejects javascript: protocol on ticketUrl", () => {
    render(
      <EventFactInline
        value={{ ...BASE, ticketUrl: "javascript:alert(1)" }}
        isPast={false}
      />,
    );
    expect(screen.queryByText("Inschrijven")).toBeNull();
  });

  it("applies the .eventfact-polaroid class so the nth-of-type CSS cycle can target it", () => {
    const { container } = render(
      <EventFactInline value={BASE} isPast={false} />,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("eventfact-polaroid");
  });

  it("uses the muted Afgelopen pill instead of competitionTag for past events", () => {
    render(<EventFactInline value={BASE} isPast />);
    expect(screen.getByText("Afgelopen")).toBeInTheDocument();
    expect(screen.queryByText("Clubfeest")).toBeNull();
  });

  it("renders a multi-day range as a single date line", () => {
    render(
      <EventFactInline
        value={{
          ...BASE,
          date: "2026-05-23",
          endDate: "2026-05-25",
        }}
        isPast={false}
      />,
    );
    // Multi-day same-month range -> "23–25 mei".
    expect(screen.getByText(/23.{1,2}25.{0,5}mei/i)).toBeInTheDocument();
  });
});
