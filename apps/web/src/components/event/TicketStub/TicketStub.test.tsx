import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { TicketStub } from "./TicketStub";

describe("TicketStub", () => {
  // Sanity stores event datetimes in UTC (Z-suffixed). The component pins
  // display to Europe/Brussels, so 18:00Z renders as 20:00 (CEST) — and the
  // assertions below are stable regardless of the test runner's own timezone.
  const baseProps = {
    title: "Spaghetti-avond",
    href: "/evenementen/spaghetti-avond",
    dateStart: "2026-09-12T18:00:00Z",
    eventType: "Clubevent" as const,
    location: "Sportpark Driesput, Elewijt",
  };

  it("renders the whole stub as a single link to the event detail", () => {
    render(<TicketStub {...baseProps} />);

    const link = screen.getByRole("link", { name: /Spaghetti-avond/i });
    expect(link).toHaveAttribute("href", "/evenementen/spaghetti-avond");
  });

  it("renders the title and location", () => {
    render(<TicketStub {...baseProps} />);

    expect(screen.getByText("Spaghetti-avond")).toBeInTheDocument();
    expect(screen.getByText(/Sportpark Driesput, Elewijt/)).toBeInTheDocument();
  });

  it("renders the eventType as a visible text pill (colour is never the only cue)", () => {
    render(<TicketStub {...baseProps} eventType="Jeugdwerking" />);

    expect(screen.getByText("Jeugdwerking")).toBeInTheDocument();
  });

  it("falls back to 'Andere' when eventType is missing", () => {
    render(<TicketStub {...baseProps} eventType={null} />);

    expect(screen.getByText("Andere")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-stub-date")).toHaveAttribute(
      "data-event-type",
      "Andere",
    );
  });

  it("encodes the resolved eventType on the date block for colour coding", () => {
    render(<TicketStub {...baseProps} eventType="Supportersactiviteit" />);

    expect(screen.getByTestId("ticket-stub-date")).toHaveAttribute(
      "data-event-type",
      "Supportersactiviteit",
    );
  });

  it("renders the date block with day, month and weekday in Brussels time", () => {
    render(<TicketStub {...baseProps} />);

    const dateBlock = screen.getByTestId("ticket-stub-date");
    // 18:00Z → 20:00 CEST, still Saturday 12 September 2026.
    expect(within(dateBlock).getByText("12")).toBeInTheDocument();
    expect(within(dateBlock).getByText(/sep/i)).toBeInTheDocument();
    expect(within(dateBlock).getByText(/za/i)).toBeInTheDocument();
  });

  it("shows the Brussels start time and location in the meta line", () => {
    render(<TicketStub {...baseProps} />);

    const meta = screen.getByTestId("ticket-stub-meta");
    expect(meta).toHaveTextContent("20:00");
    expect(meta).toHaveTextContent("Sportpark Driesput, Elewijt");
  });

  it("omits the time for all-day (Brussels-midnight) events but keeps the location", () => {
    // 2026-09-11T22:00Z === 2026-09-12T00:00 in Brussels (CEST) — an all-day
    // event entered as local midnight.
    render(<TicketStub {...baseProps} dateStart="2026-09-11T22:00:00Z" />);

    const meta = screen.getByTestId("ticket-stub-meta");
    expect(meta).not.toHaveTextContent(/\d{1,2}:\d{2}/);
    expect(meta).toHaveTextContent("Sportpark Driesput, Elewijt");
  });

  it("shows a day range (not a time) for multi-day events", () => {
    render(
      <TicketStub
        {...baseProps}
        dateStart="2026-09-14T10:00:00Z"
        dateEnd="2026-09-15T18:00:00Z"
      />,
    );

    // Date block still shows the start day (14 September, a Monday).
    expect(
      within(screen.getByTestId("ticket-stub-date")).getByText("14"),
    ).toBeInTheDocument();
    const meta = screen.getByTestId("ticket-stub-meta");
    expect(meta).toHaveTextContent(/14\s*[–-]\s*15/);
    expect(meta.textContent ?? "").not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("treats a same-day or reversed end as single-day (start time, no range)", () => {
    render(
      <TicketStub
        {...baseProps}
        dateStart="2026-09-12T18:00:00Z"
        dateEnd="2026-09-12T16:00:00Z"
      />,
    );

    const meta = screen.getByTestId("ticket-stub-meta");
    expect(meta).toHaveTextContent("20:00");
    expect(meta.textContent ?? "").not.toMatch(/[–-]/);
  });

  it("renders no meta line for an all-day event with no location", () => {
    render(
      <TicketStub
        {...baseProps}
        dateStart="2026-09-11T22:00:00Z"
        location={null}
      />,
    );

    expect(screen.queryByTestId("ticket-stub-meta")).not.toBeInTheDocument();
  });

  it("renders a hover/focus 'Meer details' reveal in the DOM", () => {
    render(<TicketStub {...baseProps} />);

    expect(screen.getByText(/Meer details/i)).toBeInTheDocument();
  });

  it("resets the hover tilt under reduced motion", () => {
    render(<TicketStub {...baseProps} />);

    const card = screen.getByTestId("ticket-stub-card");
    expect(card.className).toMatch(/motion-reduce:/);
    expect(card.className).toMatch(/group-hover:scale-\[1\.02\]/);
    expect(card.className).toMatch(/group-hover:-rotate-1/);
  });
});
