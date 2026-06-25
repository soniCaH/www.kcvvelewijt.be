import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { EventDetailBlock } from "./EventDetailBlock";

const meta = {
  title: "Features/Articles/Blocks/EventDetailBlock",
  component: EventDetailBlock,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Contained event-fact panel (ART-3 Variant B, locked `go-live-art3-event-hero-strip/locked.md`). Rendered between the event hero and the article body on `articleType="event"`, replacing the old full-bleed `HeroCompressedEventStrip`. A taped index-card: one washi tape, optional tag pill + compact date, title, a 3-column Locatie / Datum / Tijd fact grid, then folded detail (per-day schedule, address, capacity, note) and a CTA row — Reserveer (jersey-deep) + Zet in agenda. Contained to `--container-wide`. Past events keep the card as a historical record but swap the tag pill for a muted `Afgelopen` and hide the CTA row. `isPast` is computed page-level via `deriveIsPast` so this stays a pure renderer.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full py-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventDetailBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const STEAK_NOTE: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "n1",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "n1-c",
        text: "Drie dagen feest, twee dagen vlees, één goede zaak.",
        marks: [],
      },
    ],
    markDefs: [],
  } as PortableTextBlock,
];

// Canonical upcoming event: tag pill + compact date, title, the
// Locatie / Datum / Tijd grid, a folded per-day schedule + capacity +
// note, and both CTAs (Reserveer + Zet in agenda).
export const UpcomingWithSessions: Story = {
  args: {
    isPast: false,
    value: {
      _key: "evt-1",
      _type: "eventFact",
      title: "Steakfestijn 2026",
      date: "2026-09-25",
      endDate: "2026-09-27",
      sessions: [
        {
          _key: "s1",
          date: "2026-09-25",
          startTime: "18:00",
          endTime: "22:00",
        },
        {
          _key: "s2",
          date: "2026-09-26",
          startTime: "17:00",
          endTime: "23:00",
        },
        {
          _key: "s3",
          date: "2026-09-27",
          startTime: "11:30",
          endTime: "15:00",
        },
      ],
      location: "Sportpark Elewijt",
      address: "Driesstraat 14, Elewijt",
      capacity: 250,
      competitionTag: "Clubfeest",
      ticketUrl: "https://kcvvelewijt.be/tickets/steakfestijn",
      ticketLabel: "Bestel je tafel",
      note: STEAK_NOTE,
    },
  },
};

// Single-day event, no extra detail — the panel now carries it on its own
// (this is the case the old hero strip used to handle full-bleed).
export const Minimal: Story = {
  args: {
    isPast: false,
    value: {
      _key: "evt-2",
      _type: "eventFact",
      title: "Eetfestijn & opendeurdag",
      date: "2026-09-19",
      location: "Sportpark Driesput, Elewijt",
      startTime: "10:00",
      endTime: "17:00",
      competitionTag: "Clubfeest",
      ticketUrl: "https://kcvvelewijt.be/tickets/eetfestijn",
      ticketLabel: "Reserveer",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Required fields only (date + location + time). The 3-column grid still scans; both CTAs render.",
      },
    },
  },
};

// Past event — muted `Afgelopen` pill, greyscaled card, CTA row hidden.
export const Past: Story = {
  args: {
    ...(UpcomingWithSessions.args ?? {}),
    isPast: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Past event with `isPast={true}`. Tag pill swaps to a muted `Afgelopen`; the card greyscales; the CTA row disappears; the rest stays readable as a historical record.",
      },
    },
  },
};

// No ticket link and no resolvable date → no CTA row at all (an event
// whose date is still to be announced).
export const CtaLess: Story = {
  args: {
    isPast: false,
    value: {
      _key: "evt-3",
      _type: "eventFact",
      title: "Quiz van het jaar",
      location: "Sportpark Elewijt — Kantine",
      competitionTag: "Clubfeest",
      note: STEAK_NOTE,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "No `ticketUrl` and no date → `Datum volgt`, no calendar link, so the CTA row is omitted entirely.",
      },
    },
  },
};

// Mobile — the 3-column fact grid stacks to a single column under `sm`.
export const Mobile: Story = {
  args: { ...(UpcomingWithSessions.args ?? {}) },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-[390px] py-10">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Narrow viewport — the Locatie / Datum / Tijd grid collapses to one column and the CTAs wrap.",
      },
    },
  },
};
