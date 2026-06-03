import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventHero } from "./EventHero";

describe("EventHero", () => {
  it("renders the eventType pill, kicker, title and location", () => {
    const { container } = render(
      <EventHero
        title="Mosselfeest 2026"
        eventType="Clubevent"
        dateStart="2026-09-12T16:00:00Z"
        location="Kantine KCVV"
      />,
    );

    expect(screen.getByText("Clubevent")).toBeInTheDocument();
    // Kicker — Brussels-zoned date + start time (CSS uppercases the nl string).
    expect(screen.getByText(/12 september/)).toBeInTheDocument();
    expect(screen.getByText(/18:00/)).toBeInTheDocument();
    // Title is an h1; the location appears as a separate mono line.
    expect(
      container.querySelector("h1")?.textContent?.replace(/\s+/g, " "),
    ).toContain("Mosselfeest 2026");
    expect(screen.getByText("Kantine KCVV")).toBeInTheDocument();
  });

  it("accents the last word of the title (italic <em>)", () => {
    const { container } = render(
      <EventHero
        title="Mosselfeest 2026"
        eventType="Clubevent"
        dateStart="2026-09-12T16:00:00Z"
      />,
    );
    const em = container.querySelector("h1 em");
    expect(em).not.toBeNull();
    expect(em?.textContent).toContain("2026");
    expect(em?.className).toContain("italic");
  });

  it("falls back to the 'Andere' pill when eventType is null", () => {
    render(
      <EventHero
        title="Iets zonder type"
        eventType={null}
        dateStart="2026-09-12T16:00:00Z"
      />,
    );
    expect(screen.getByText("Andere")).toBeInTheDocument();
  });

  it("omits the location line when no location is set", () => {
    render(
      <EventHero
        title="Geen locatie"
        eventType="Andere"
        dateStart="2026-09-12T16:00:00Z"
        location={null}
      />,
    );
    // The only mono lines are pill + kicker; no third (location) line.
    expect(
      screen.queryByText(/KCVV|Kantine|Sportpark/),
    ).not.toBeInTheDocument();
  });

  it("wraps the cover in a TapedFigure only when a cover is provided", () => {
    const { container, rerender } = render(
      <EventHero
        title="Met cover"
        eventType="Clubevent"
        dateStart="2026-09-12T16:00:00Z"
        cover={<div data-testid="cover-img" />}
      />,
    );
    expect(screen.getByTestId("cover-img")).toBeInTheDocument();
    expect(container.querySelector("figure")).not.toBeNull();

    rerender(
      <EventHero
        title="Zonder cover"
        eventType="Clubevent"
        dateStart="2026-09-12T16:00:00Z"
      />,
    );
    expect(screen.queryByTestId("cover-img")).not.toBeInTheDocument();
    expect(container.querySelector("figure")).toBeNull();
  });

  it("renders the CTA slot", () => {
    render(
      <EventHero
        title="Met CTAs"
        eventType="Clubevent"
        dateStart="2026-09-12T16:00:00Z"
        ctas={<button type="button">Reserveer</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Reserveer" }),
    ).toBeInTheDocument();
  });

  it("shows a day range in the kicker for a multi-day event", () => {
    render(
      <EventHero
        title="Jeugdkamp"
        eventType="Jeugdwerking"
        dateStart="2026-09-14T08:00:00Z"
        dateEnd="2026-09-15T14:00:00Z"
      />,
    );
    expect(screen.getByText(/14 –/)).toBeInTheDocument();
    expect(screen.getByText(/15 september/)).toBeInTheDocument();
  });
});
