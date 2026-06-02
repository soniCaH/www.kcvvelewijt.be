import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { TicketStub } from "./TicketStub";

describe("TicketStub", () => {
  const baseProps = {
    title: "Spaghetti-avond",
    href: "/evenementen/spaghetti-avond",
    // 18:00 UTC = 20:00 Brussels (CEST) — safely mid-day, so the rendered
    // calendar date is stable regardless of the runner's timezone.
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

  it("renders the date block with day, month and weekday from dateStart", () => {
    render(<TicketStub {...baseProps} />);

    const dateBlock = screen.getByTestId("ticket-stub-date");
    // 12 September 2026 is a Saturday (Europe/Brussels). Matched without the
    // locale's trailing period / case so styling owns presentation.
    expect(within(dateBlock).getByText("12")).toBeInTheDocument();
    expect(within(dateBlock).getByText(/sep/i)).toBeInTheDocument();
    expect(within(dateBlock).getByText(/za/i)).toBeInTheDocument();
  });

  it("shows the location in the meta line", () => {
    render(<TicketStub {...baseProps} />);

    expect(screen.getByTestId("ticket-stub-meta")).toHaveTextContent(
      "Sportpark Driesput, Elewijt",
    );
  });

  it("omits the meta line when there is no location", () => {
    render(<TicketStub {...baseProps} location={null} />);

    expect(screen.queryByTestId("ticket-stub-meta")).not.toBeInTheDocument();
  });
});
