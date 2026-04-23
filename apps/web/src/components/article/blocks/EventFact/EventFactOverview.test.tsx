import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventFactOverview } from "./EventFactOverview";

describe("EventFactOverview", () => {
  it("renders the Dutch-formatted date cluster (day + short month + weekday)", () => {
    render(
      <EventFactOverview
        value={{
          title: "Lentetornooi U13",
          date: "2026-04-27",
        }}
      />,
    );
    const dateCell = screen.getByTestId("event-overview-date");
    expect(dateCell.textContent).toMatch(/27/);
    expect(dateCell.textContent).toMatch(/apr/i);
    // 2026-04-27 is a Monday.
    expect(dateCell.textContent).toMatch(/maandag/i);
  });

  it("renders on a full-bleed dark band so consecutive rows stack into one section", () => {
    const { container } = render(
      <EventFactOverview
        value={{ title: "Lentetornooi", date: "2026-04-27" }}
      />,
    );
    const section = container.querySelector("[data-testid='event-overview']");
    expect(section).toHaveClass("bg-kcvv-gray-dark");
    expect(section).toHaveClass("full-bleed");
  });

  it("renders the title + time + location + age-group metadata line", () => {
    render(
      <EventFactOverview
        value={{
          title: "Lentetornooi U13",
          date: "2026-04-27",
          startTime: "10:00",
          endTime: "17:00",
          location: "Sportpark Elewijt",
          ageGroup: "U13",
        }}
      />,
    );
    expect(screen.getByTestId("event-overview-title")).toHaveTextContent(
      "Lentetornooi U13",
    );
    const meta = screen.getByTestId("event-overview-meta");
    expect(meta.textContent).toMatch(/10:00 - 17:00/);
    expect(meta.textContent).toMatch(/Sportpark Elewijt/i);
    expect(meta.textContent).toMatch(/U13/);
  });

  it("falls back to `competitionTag` when `ageGroup` is missing", () => {
    render(
      <EventFactOverview
        value={{
          title: "Clubfeest",
          date: "2026-04-27",
          competitionTag: "Clubfeest",
        }}
      />,
    );
    const meta = screen.getByTestId("event-overview-meta");
    expect(meta.textContent).toMatch(/Clubfeest/i);
  });

  it("renders the CTA link with the default label when `ticketLabel` is unset", () => {
    render(
      <EventFactOverview
        value={{
          title: "Lentetornooi",
          date: "2026-04-27",
          ticketUrl: "https://kcvvelewijt.be/inschrijven",
        }}
      />,
    );
    const cta = screen.getByTestId("event-overview-cta");
    expect(cta).toHaveTextContent(/Inschrijven/i);
    expect(cta).toHaveAttribute("href", "https://kcvvelewijt.be/inschrijven");
    expect(cta).toHaveAttribute("target", "_blank");
  });

  it("uses the editor-authored `ticketLabel` when provided", () => {
    render(
      <EventFactOverview
        value={{
          title: "Lentetornooi",
          date: "2026-04-27",
          ticketUrl: "https://kcvvelewijt.be/inschrijven",
          ticketLabel: "Boek je plek",
        }}
      />,
    );
    expect(screen.getByTestId("event-overview-cta")).toHaveTextContent(
      /Boek je plek/,
    );
  });

  it("hides the CTA when `ticketUrl` is unset", () => {
    render(
      <EventFactOverview
        value={{
          title: "Lentetornooi",
          date: "2026-04-27",
        }}
      />,
    );
    expect(screen.queryByTestId("event-overview-cta")).toBeNull();
  });

  it("renders `tbd` in the date column when the date is missing or malformed", () => {
    render(
      <EventFactOverview
        value={{
          title: "Datum volgt",
          date: "",
        }}
      />,
    );
    const dateCell = screen.getByTestId("event-overview-date");
    expect(dateCell.textContent).toMatch(/tbd/i);
  });
});
