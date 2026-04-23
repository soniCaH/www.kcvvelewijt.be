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

  it("combines weekday + time range on the `when` row when both are present", () => {
    render(
      <EventStrip
        feature={{
          title: "Lentetornooi",
          date: "2026-04-27",
          startTime: "10:00",
          endTime: "17:00",
        }}
      />,
    );
    const when = screen.getByTestId("event-strip-when");
    expect(when.textContent).toMatch(/maandag/i);
    expect(when.textContent).toMatch(/10:00 - 17:00/);
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
