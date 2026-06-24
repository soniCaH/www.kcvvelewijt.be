import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import type { EventFactValue } from "../EventFact/types";
import {
  EventDetailBlock,
  deriveIsPast,
  hasEventFactContent,
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

// A plain single-day event whose facts the panel must surface on its own
// (it now replaces the old always-present hero strip).
function singleDay(overrides: Partial<EventFactValue> = {}): EventFactValue {
  return {
    _key: "ef2",
    _type: "eventFact",
    title: "Eetfestijn & opendeurdag",
    date: "2026-09-25",
    location: "Sportpark Driesput, Elewijt",
    startTime: "10:00",
    endTime: "17:00",
    competitionTag: "Clubfeest",
    ...overrides,
  };
}

describe("hasEventFactContent", () => {
  it.each([
    ["location only", { location: "Sportpark Elewijt" }],
    ["date only", { date: "2026-04-12" }],
    ["startTime only", { startTime: "10:00" }],
    ["address only", { address: "Driesstraat 14" }],
    ["capacity > 0", { capacity: 50 }],
    ["a note block", { note }],
    ["a dated session", { sessions: [{ date: "2026-09-25" }] }],
    ["a title only", { title: "Wafelverkoop" }],
  ])("returns true for %s", (_label, value) => {
    expect(hasEventFactContent(value as EventFactValue)).toBe(true);
  });

  it("returns false for an empty eventFact", () => {
    expect(hasEventFactContent({})).toBe(false);
  });

  it("returns false when capacity is 0 and nothing else is set", () => {
    expect(hasEventFactContent({ capacity: 0 })).toBe(false);
  });

  it("returns false when sessions[] has no dated entries", () => {
    expect(hasEventFactContent({ sessions: [{ startTime: "10:00" }] })).toBe(
      false,
    );
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
  it("returns null when the eventFact has no content", () => {
    const { container } = render(
      <EventDetailBlock value={{}} isPast={false} />,
    );
    expect(container.firstElementChild).toBeNull();
  });

  it("is contained to the wide container, never full-bleed", () => {
    const { container } = render(
      <EventDetailBlock value={singleDay()} isPast={false} />,
    );
    expect(
      container.querySelector('[style*="--container-wide"]'),
    ).not.toBeNull();
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

  it("renders the Locatie / Datum / Tijd fact grid", () => {
    const { container } = render(
      <EventDetailBlock value={singleDay()} isPast={false} />,
    );
    expect(
      container.querySelector('[data-event-detail-fact="locatie"]')
        ?.textContent,
    ).toContain("Sportpark Driesput");
    const datum = container.querySelector(
      '[data-event-detail-fact="datum"]',
    )?.textContent;
    expect(datum).toContain("25");
    expect(datum).toContain("september");
    expect(datum).toContain("2026");
    expect(
      container.querySelector('[data-event-detail-fact="tijd"]')?.textContent,
    ).toContain("10:00 - 17:00");
  });

  it("summarises Tijd as 'Zie schema' when per-day sessions exist", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    expect(
      container.querySelector('[data-event-detail-fact="tijd"]')?.textContent,
    ).toContain("Zie schema");
  });

  it("shows 'Datum volgt' and no calendar CTA when no date is set", () => {
    const { container } = render(
      <EventDetailBlock
        value={{ title: "Nog te plannen", location: "Sportpark Elewijt" }}
        isPast={false}
      />,
    );
    expect(
      container.querySelector('[data-event-detail-fact="datum"]')?.textContent,
    ).toContain("Datum volgt");
    expect(
      container.querySelector('[data-event-detail-cta="calendar"]'),
    ).toBeNull();
  });

  it("renders the Reserveer CTA with the configured ticketLabel on upcoming events", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    const cta = container.querySelector('[data-event-detail-cta="ticket"]');
    expect(cta).not.toBeNull();
    expect(cta?.textContent).toContain("Bestel je tafel");
    expect(cta?.getAttribute("href")).toBe("https://example.com/tickets");
    expect(cta?.getAttribute("target")).toBe("_blank");
    expect(cta?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders a 'Zet in agenda' Google Calendar CTA on upcoming dated events", () => {
    const { container } = render(
      <EventDetailBlock value={singleDay()} isPast={false} />,
    );
    const cta = container.querySelector('[data-event-detail-cta="calendar"]');
    expect(cta).not.toBeNull();
    expect(cta?.textContent).toContain("Zet in agenda");
    expect(cta?.getAttribute("href")).toContain(
      "calendar.google.com/calendar/render",
    );
    expect(cta?.getAttribute("href")).toContain("action=TEMPLATE");
  });

  const calendarDates = (container: HTMLElement): string | null => {
    const href = container
      .querySelector('[data-event-detail-cta="calendar"]')
      ?.getAttribute("href");
    return href ? new URL(href).searchParams.get("dates") : null;
  };

  it("encodes a timed single-day event as a UTC range (Europe/Brussels → UTC)", () => {
    // singleDay() is 25 Sep 2026, CEST (UTC+2): 10:00→08:00Z, 17:00→15:00Z.
    const { container } = render(
      <EventDetailBlock value={singleDay()} isPast={false} />,
    );
    expect(calendarDates(container)).toBe("20260925T080000Z/20260925T150000Z");
  });

  it("defaults to a 2h block when only a start time is set", () => {
    const { container } = render(
      <EventDetailBlock
        value={singleDay({ endTime: undefined })}
        isPast={false}
      />,
    );
    // 10:00 CEST (08:00Z) + 2h → 12:00 CEST (10:00Z).
    expect(calendarDates(container)).toBe("20260925T080000Z/20260925T100000Z");
  });

  it("encodes a timeless event as an all-day entry (end date exclusive)", () => {
    const { container } = render(
      <EventDetailBlock
        value={{ title: "Opendeur", date: "2026-09-19", location: "Elewijt" }}
        isPast={false}
      />,
    );
    expect(calendarDates(container)).toBe("20260919/20260920");
  });

  it("encodes a per-day sessions event as an all-day span (ignores top-level times)", () => {
    const { container } = render(
      <EventDetailBlock
        value={eventFact({ startTime: "18:00", endTime: "22:00" })}
        isPast={false}
      />,
    );
    // sessions span 25→27 Sep; all-day end is exclusive (28th).
    expect(calendarDates(container)).toBe("20260925/20260928");
  });

  it("replaces the tag pill with an 'Afgelopen' muted pill on past events", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={true} />,
    );
    const pill = container.querySelector("[data-event-detail-pill]");
    expect(pill?.getAttribute("data-event-detail-pill")).toBe("muted");
    expect(pill?.textContent).toBe("Afgelopen");
  });

  it("hides the whole CTA row on past events even when ticketUrl is populated", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={true} />,
    );
    expect(
      container.querySelector('[data-event-detail-cta-row="true"]'),
    ).toBeNull();
    expect(container.querySelector("[data-event-detail-cta]")).toBeNull();
  });

  it("drops the Reserveer CTA when ticketUrl uses a non-http(s) scheme (calendar stays)", () => {
    const { container } = render(
      <EventDetailBlock
        value={singleDay({ ticketUrl: "javascript:alert(1)" })}
        isPast={false}
      />,
    );
    expect(
      container.querySelector('[data-event-detail-cta="ticket"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-event-detail-cta="calendar"]'),
    ).not.toBeNull();
  });

  it("drops the Reserveer CTA when ticketUrl is malformed (URL constructor throws)", () => {
    const { container } = render(
      <EventDetailBlock
        value={singleDay({ ticketUrl: "not a url" })}
        isPast={false}
      />,
    );
    expect(
      container.querySelector('[data-event-detail-cta="ticket"]'),
    ).toBeNull();
  });

  it("falls back to DEFAULT_TICKET_LABEL when ticketLabel is empty", () => {
    const { container } = render(
      <EventDetailBlock
        value={singleDay({ ticketUrl: "https://x.test/t", ticketLabel: "" })}
        isPast={false}
      />,
    );
    expect(
      container.querySelector('[data-event-detail-cta="ticket"]')?.textContent,
    ).toContain("Inschrijven");
  });

  it("renders the sessions schedule when sessions[] is populated", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    const grid = container.querySelector('[data-event-detail-sessions="true"]');
    expect(grid).not.toBeNull();
    const wrappers = grid?.querySelectorAll(":scope > div");
    expect(wrappers?.length).toBe(3);
  });

  it("omits the sessions schedule for a single-day event", () => {
    const { container } = render(
      <EventDetailBlock value={singleDay()} isPast={false} />,
    );
    expect(
      container.querySelector('[data-event-detail-sessions="true"]'),
    ).toBeNull();
  });

  it("renders an Adres extra row only when both location and address are set", () => {
    const withBoth = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    expect(
      withBoth.container.querySelector('[data-event-detail-meta="true"]')
        ?.textContent,
    ).toContain("Adres");

    const addressOnly = render(
      <EventDetailBlock
        value={singleDay({ location: undefined, address: "Driesstraat 14" })}
        isPast={false}
      />,
    );
    // address stands in as the Locatie cell, so no duplicate Adres row.
    const meta = addressOnly.container.querySelector(
      '[data-event-detail-meta="true"]',
    );
    expect(meta?.textContent ?? "").not.toContain("Adres");
  });

  it("renders a Capaciteit extra row when capacity > 0", () => {
    const { container } = render(
      <EventDetailBlock value={eventFact()} isPast={false} />,
    );
    const meta = container.querySelector('[data-event-detail-meta="true"]');
    expect(meta?.textContent).toContain("Capaciteit");
    expect(meta?.textContent).toContain("Max 250 plaatsen");
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
        value={singleDay({ competitionTag: undefined })}
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
