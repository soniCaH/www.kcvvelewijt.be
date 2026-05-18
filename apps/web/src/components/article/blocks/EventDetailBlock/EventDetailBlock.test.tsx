import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import type { EventFactValue } from "../EventFact/types";
import {
  EventDetailBlock,
  deriveIsPast,
  shouldRenderEventDetailBlock,
} from "./EventDetailBlock";

const note: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "n1",
    style: "normal",
    children: [
      { _type: "span", _key: "n1-c", text: "Drie dagen feest.", marks: [] },
    ],
    markDefs: [],
  } as PortableTextBlock,
];

function eventFact(overrides: Partial<EventFactValue> = {}): EventFactValue {
  return {
    _key: "ef1",
    _type: "eventFact",
    title: "Steakfestijn 2026",
    date: "2026-09-25",
    endDate: "2026-09-27",
    location: "Sportpark Elewijt",
    address: "Driesstraat 14, Elewijt",
    capacity: 250,
    competitionTag: "Clubfeest",
    ticketUrl: "https://example.com/tickets",
    ticketLabel: "Bestel je tafel",
    sessions: [
      { _key: "s1", date: "2026-09-25", startTime: "18:00", endTime: "22:00" },
      { _key: "s2", date: "2026-09-26", startTime: "17:00", endTime: "23:00" },
      { _key: "s3", date: "2026-09-27", startTime: "11:30", endTime: "15:00" },
    ],
    note,
    ...overrides,
  };
}

describe("shouldRenderEventDetailBlock", () => {
  it("returns true when sessions[] has at least one dated entry", () => {
    expect(
      shouldRenderEventDetailBlock({
        sessions: [{ date: "2026-09-25" }],
      }),
    ).toBe(true);
  });

  it("returns true when address is populated", () => {
    expect(shouldRenderEventDetailBlock({ address: "Driesstraat 14" })).toBe(
      true,
    );
  });

  it("returns true when capacity > 0", () => {
    expect(shouldRenderEventDetailBlock({ capacity: 50 })).toBe(true);
  });

  it("returns true when note has at least one block", () => {
    expect(shouldRenderEventDetailBlock({ note })).toBe(true);
  });

  it("returns false for an eventFact with only date + location (covered by strip)", () => {
    expect(
      shouldRenderEventDetailBlock({
        title: "Wafelverkoop",
        date: "2026-04-12",
        location: "Sportpark Elewijt",
      }),
    ).toBe(false);
  });

  it("returns false when sessions[] is present but has no dated entries", () => {
    expect(
      shouldRenderEventDetailBlock({
        sessions: [{ startTime: "10:00" }],
      }),
    ).toBe(false);
  });

  it("returns false when capacity is 0", () => {
    expect(shouldRenderEventDetailBlock({ capacity: 0 })).toBe(false);
  });
});

describe("deriveIsPast", () => {
  // Mid-day Z reference proves the function strips the time component
  // and compares date-only — the same Z-noon would otherwise drift
  // around midnight in non-UTC zones.
  const reference = new Date("2026-09-26T12:00:00Z");

  it("returns false when date is in the future relative to `now`", () => {
    expect(deriveIsPast({ date: "2027-01-01" }, reference)).toBe(false);
  });

  it("returns true when endDate has passed relative to `now`", () => {
    expect(
      deriveIsPast({ date: "2026-09-24", endDate: "2026-09-25" }, reference),
    ).toBe(true);
  });

  it("returns false when endDate is today or later", () => {
    expect(
      deriveIsPast({ date: "2026-09-25", endDate: "2026-09-27" }, reference),
    ).toBe(false);
  });

  it("uses the latest session date when sessions[] exists and endDate is absent", () => {
    expect(
      deriveIsPast(
        {
          date: "2026-09-24",
          sessions: [{ date: "2026-09-24" }, { date: "2026-09-25" }],
        },
        reference,
      ),
    ).toBe(true);
  });

  it("returns false when no reference date is present (draft state)", () => {
    expect(deriveIsPast({}, reference)).toBe(false);
  });
});

describe("<EventDetailBlock>", () => {
  it("returns null when the skip-condition is met (no sessions/address/capacity/note)", () => {
    const { container } = render(
      <EventDetailBlock
        value={{ title: "Wafelverkoop", date: "2026-04-12" }}
        isPast={false}
      />,
    );
    expect(container.firstElementChild).toBeNull();
  });

  it("renders the title and the competitionTag pill for upcoming events", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    expect(
      container.querySelector('[data-event-detail-title="true"]')?.textContent,
    ).toBe("Steakfestijn 2026");
    const pill = container.querySelector("[data-event-detail-pill]");
    expect(pill?.getAttribute("data-event-detail-pill")).toBe("active");
    expect(pill?.textContent).toBe("Clubfeest");
  });

  it("replaces the tag pill with an 'Afgelopen' muted pill on past events", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={true} />,
    );
    const pill = container.querySelector("[data-event-detail-pill]");
    expect(pill?.getAttribute("data-event-detail-pill")).toBe("muted");
    expect(pill?.textContent).toBe("Afgelopen");
  });

  it("hides the CTA on past events even when ticketUrl is populated", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={true} />,
    );
    expect(
      container.querySelector('[data-event-detail-cta="true"]'),
    ).toBeNull();
  });

  it("renders the CTA with the configured ticketLabel on upcoming events", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    const cta = container.querySelector('[data-event-detail-cta="true"]');
    expect(cta).not.toBeNull();
    expect(cta?.textContent).toContain("Bestel je tafel");
    expect(cta?.getAttribute("href")).toBe("https://example.com/tickets");
  });

  it("falls back to DEFAULT_TICKET_LABEL when ticketLabel is empty", () => {
    const { container } = render(
      <EventDetailBlock
        value={eventFact({ ticketLabel: "" })}
        isPast={false}
      />,
    );
    expect(
      container.querySelector('[data-event-detail-cta="true"]')?.textContent,
    ).toContain("Inschrijven");
  });

  it("renders the sessions 3-col grid when sessions[] is populated", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    const grid = container.querySelector('[data-event-detail-sessions="true"]');
    expect(grid).not.toBeNull();
    // Each session is a `display: contents` div wrapping 3 cells (key /
    // val / hours), so 3 sessions render as 3 wrapper divs.
    const wrappers = grid?.querySelectorAll(":scope > div");
    expect(wrappers?.length).toBe(3);
  });

  it("omits the sessions grid when sessions[] is empty (single-day event)", () => {
    const { container } = render(
      <EventDetailBlock
        value={eventFact({ sessions: undefined, endDate: undefined })}
        isPast={false}
      />,
    );
    expect(
      container.querySelector('[data-event-detail-sessions="true"]'),
    ).toBeNull();
  });

  it("renders meta rows only for fields that are populated", () => {
    const { container } = render(
      <EventDetailBlock
        value={eventFact({ address: undefined, capacity: undefined })}
        isPast={false}
      />,
    );
    const meta = container.querySelector('[data-event-detail-meta="true"]');
    // location is still populated → 1 row.
    const rows = meta?.querySelectorAll(":scope > div");
    expect(rows?.length).toBe(1);
    expect(meta?.textContent).toContain("Locatie");
    expect(meta?.textContent).toContain("Sportpark Elewijt");
  });

  it("renders the note PortableText when populated", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    expect(
      container.querySelector('[data-event-detail-note="true"]')?.textContent,
    ).toContain("Drie dagen feest");
  });

  it("hides the head pill entirely when neither tag nor past flag yields a label", () => {
    const { container } = render(
      <EventDetailBlock
        value={eventFact({ competitionTag: undefined })}
        isPast={false}
      />,
    );
    expect(container.querySelector("[data-event-detail-pill]")).toBeNull();
  });

  it("shows the 'Afgelopen' pill on past events even when competitionTag is absent", () => {
    const { container } = render(
      <EventDetailBlock
        value={eventFact({ competitionTag: undefined })}
        isPast={true}
      />,
    );
    const pill = container.querySelector("[data-event-detail-pill]");
    expect(pill?.getAttribute("data-event-detail-pill")).toBe("muted");
    expect(pill?.textContent).toBe("Afgelopen");
  });
});
