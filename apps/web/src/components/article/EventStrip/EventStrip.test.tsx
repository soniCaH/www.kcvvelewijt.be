import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { EventStrip } from "./EventStrip";

describe("EventStrip", () => {
  it("renders the serif-style date block with day, long month, and year in Dutch", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi U13",
          date: "2026-04-27",
        }}
      />,
    );
    const dateBlock = screen.getByTestId("event-strip-date");
    expect(dateBlock.textContent).toMatch(/27/);
    expect(dateBlock.textContent).toMatch(/april/i);
    expect(dateBlock.textContent).toMatch(/2026/);
  });

  it("renders a same-month range as `25 – 26 APRIL 2026` at display scale", () => {
    render(
      <EventStrip
        feature={{
          title: "Pinksterweekend tornooi",
          date: "2026-04-25",
          endDate: "2026-04-26",
        }}
      />,
    );
    const range = screen.getByTestId("event-strip-date-range");
    expect(range.textContent).toMatch(/25\s*–\s*26/);
    expect(range.textContent).toMatch(/april/i);
    expect(range.textContent).toMatch(/2026/);
    // Weekday line spans both days.
    const weekday = screen.getByTestId("event-strip-date-weekday");
    expect(weekday.textContent).toMatch(/zaterdag\s*–\s*zondag/i);
  });

  it("renders a cross-month range compactly: `25 APR – 2 MEI`", () => {
    render(
      <EventStrip
        feature={{
          title: "Bi-monthly camp",
          date: "2026-04-30",
          endDate: "2026-05-02",
        }}
      />,
    );
    const range = screen.getByTestId("event-strip-date-range");
    expect(range.textContent).toMatch(/30\s*apr/i);
    expect(range.textContent).toMatch(/2\s*mei/i);
    expect(range.textContent).toMatch(/2026/);
  });

  it("renders a sessions list when the feature has multiple per-day schedules", () => {
    render(
      <EventStrip
        feature={{
          title: "Steakfestijn",
          sessions: [
            { date: "2026-11-21", startTime: "17:00", endTime: "23:00" },
            { date: "2026-11-20", startTime: "18:00", endTime: "22:00" },
            { date: "2026-11-22", startTime: "11:30", endTime: "15:00" },
          ],
          location: "Kantine KCVV",
        }}
      />,
    );
    // Date column renders the same same-month range layout as
    // continuous multi-day events.
    expect(screen.getByTestId("event-strip-date-sessions")).toBeInTheDocument();
    expect(screen.queryByTestId("event-strip-date-range")).toBeNull();

    // Three session rows, rendered in chronological order (20 → 21 → 22)
    // even though the editor entered them out of order.
    const rows = screen.getAllByTestId("event-strip-session-row");
    expect(rows).toHaveLength(3);
    const rowTexts = rows.map((r) => r.textContent ?? "");
    expect(rowTexts[0]).toMatch(/20/);
    expect(rowTexts[0]).toMatch(/18:00/);
    expect(rowTexts[1]).toMatch(/21/);
    expect(rowTexts[1]).toMatch(/17:00/);
    expect(rowTexts[2]).toMatch(/22/);
    expect(rowTexts[2]).toMatch(/11:30/);

    // The single display-scale time row is suppressed — each session
    // carries its own hours.
    expect(screen.queryByTestId("event-strip-time")).toBeNull();
  });

  it("treats endDate equal to date as single-day (no range rendering)", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-25",
          endDate: "2026-04-25",
        }}
      />,
    );
    expect(screen.queryByTestId("event-strip-date-range")).toBeNull();
    expect(screen.getByTestId("event-strip-date")).toHaveTextContent(/25/);
    expect(screen.getByTestId("event-strip-date-weekday")).toHaveTextContent(
      /^zaterdag$/i,
    );
  });

  it("renders a 'Datum volgt' placeholder when the date is missing", () => {
    render(
      <EventStrip
        feature={{
          title: "Datum volgt",
        }}
      />,
    );
    expect(screen.getByTestId("event-strip-date-tbd")).toBeInTheDocument();
  });

  it("renders the event title as an h2 on the right side of the strip", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi U13",
          date: "2026-04-27",
        }}
      />,
    );
    expect(screen.getByTestId("event-strip-title")).toHaveTextContent(
      "Lentetornooi U13",
    );
  });

  it("renders the weekday inside the date column", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-25",
        }}
      />,
    );
    expect(screen.getByTestId("event-strip-date-weekday")).toHaveTextContent(
      /zaterdag/i,
    );
  });

  it("renders both start and end time at display scale with a direction arrow", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-25",
          startTime: "10:00",
          endTime: "17:00",
        }}
      />,
    );
    const time = screen.getByTestId("event-strip-time");
    expect(time).toHaveTextContent(/10:00/);
    expect(time).toHaveTextContent(/17:00/);
    // The arrow between them — rendered inline as the Lucide SVG. Find
    // it by looking for an svg child of the time row.
    expect(time.querySelector("svg")).not.toBeNull();
  });

  it("renders only the start time (no arrow) when the end time is missing", () => {
    render(
      <EventStrip
        feature={{
          title: "Training",
          date: "2026-04-25",
          startTime: "18:30",
        }}
      />,
    );
    const time = screen.getByTestId("event-strip-time");
    expect(time).toHaveTextContent(/18:30/);
    // No arrow when there is only one time anchor.
    expect(time.querySelector("svg")).toBeNull();
  });

  it("omits the time row entirely when neither start nor end time is set", () => {
    render(
      <EventStrip
        feature={{
          title: "Jeugd barbecue",
          date: "2026-04-25",
        }}
      />,
    );
    expect(screen.queryByTestId("event-strip-time")).toBeNull();
  });

  it("combines location + address on the `where` row", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-27",
          location: "Sportpark Elewijt",
          address: "Driesstraat 14, Elewijt",
        }}
      />,
    );
    const where = screen.getByTestId("event-strip-where");
    expect(where.textContent).toMatch(/Sportpark Elewijt/i);
    expect(where.textContent).toMatch(/Driesstraat 14/i);
  });

  it("renders the note via PortableText when set", () => {
    const note: PortableTextBlock[] = [
      {
        _type: "block",
        _key: "n1",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "n1-s",
            text: "Open voor spelers geboren in 2013 en 2014.",
            marks: [],
          },
        ],
      } as unknown as PortableTextBlock,
    ];
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-27",
          note,
        }}
      />,
    );
    expect(screen.getByTestId("event-strip-note")).toHaveTextContent(
      /Open voor spelers geboren in 2013 en 2014\./i,
    );
  });

  it("renders the CTA with the default `Inschrijven` label when ticketLabel is blank", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-27",
          ticketUrl: "https://kcvvelewijt.be/inschrijven",
        }}
      />,
    );
    const cta = screen.getByTestId("event-strip-cta");
    expect(cta).toHaveAttribute("href", "https://kcvvelewijt.be/inschrijven");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    expect(cta).toHaveTextContent(/Inschrijven/i);
  });

  it("falls back to `Inschrijven` when `ticketLabel` is whitespace-only — exercises the trim path", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-27",
          ticketUrl: "https://kcvvelewijt.be/inschrijven",
          ticketLabel: "   ",
        }}
      />,
    );
    expect(screen.getByTestId("event-strip-cta")).toHaveTextContent(
      /Inschrijven/i,
    );
  });

  it("uses the editor-authored ticketLabel when set", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-27",
          ticketUrl: "https://kcvvelewijt.be/inschrijven",
          ticketLabel: "Boek je plek",
        }}
      />,
    );
    expect(screen.getByTestId("event-strip-cta")).toHaveTextContent(
      /Boek je plek/,
    );
  });

  it("hides the CTA entirely when ticketUrl is missing", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-27",
        }}
      />,
    );
    expect(screen.queryByTestId("event-strip-cta")).toBeNull();
  });
});
