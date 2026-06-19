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
          "Full event-detail card placed between `<EndMark>` and `<ArticleCredits>` per the 5.d-evt lock (Option A). Renders only when the eventFact carries detail beyond what the hero `<EventStrip>` already shows: a multi-day schedule, an address, a capacity ceiling, or an editor-authored note. Past events keep the card visible as a historical record but swap the tag pill for `Afgelopen` and hide the CTA. `isPast` is computed at the page-level Server Component via `deriveIsPast` so this component stays a pure renderer.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full px-6 py-12">
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

const TORNOOI_NOTE: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "n2",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "n2-c",
        text: "Inschrijvingen sluiten 15 mei. Maximaal twee teams per club.",
        marks: [],
      },
    ],
    markDefs: [],
  } as PortableTextBlock,
];

// Upcoming multi-day event with sessions — the canonical Option A
// rendering: head with date-block + tag pill + title, sessions grid,
// meta dl (Locatie / Adres / Capaciteit), note, jersey-deep CTA.
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

// Past event — same data shape as `UpcomingWithSessions` but `isPast`
// flips the tag pill to a muted `Afgelopen` and hides the CTA. Sessions
// + meta + note remain visible (historical record).
export const Past: Story = {
  args: {
    ...(UpcomingWithSessions.args ?? {}),
    isPast: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Past event with `isPast={true}`. Tag pill swaps to a muted `Afgelopen`; CTA disappears; rest of the card stays readable so the page works as a historical record.",
      },
    },
  },
};

// Single-day event with capacity + note but no sessions. The sessions
// grid is omitted; meta dl + note + CTA still render.
export const SingleDayWithCapacity: Story = {
  args: {
    isPast: false,
    value: {
      _key: "evt-2",
      _type: "eventFact",
      title: "Algemene vergadering",
      date: "2026-06-12",
      location: "Sportpark Elewijt — Kantine",
      address: "Driesstraat 14, Elewijt",
      capacity: 80,
      competitionTag: "Bestuur",
      note: [
        {
          _type: "block",
          _key: "n3",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "n3-c",
              text: "Stemrecht voor alle aangesloten leden. Aanmelden vooraf niet vereist.",
              marks: [],
            },
          ],
          markDefs: [],
        } as PortableTextBlock,
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Single-day event — no sessions grid. The body card still adds value over the strip via address + capacity + note. No `ticketUrl` set → no CTA.",
      },
    },
  },
};

// Multi-day continuous range (endDate set, no sessions). The date-block
// shows the start day; the weekday line reads as a span (e.g. "VR–ZO").
// Useful for tournaments without per-day schedules.
export const MultiDayWithNote: Story = {
  args: {
    isPast: false,
    value: {
      _key: "evt-3",
      _type: "eventFact",
      title: "Lentetornooi U13",
      date: "2026-05-09",
      endDate: "2026-05-10",
      location: "Sportpark Elewijt — Veld B",
      address: "Driesstraat 14, Elewijt",
      competitionTag: "Tornooi",
      ticketUrl: "https://kcvvelewijt.be/jeugd/lentetornooi",
      ticketLabel: "Schrijf je team in",
      note: TORNOOI_NOTE,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Continuous multi-day range (`endDate` set, no `sessions[]`). The head's weekday line reads the span via two-letter abbreviations (`ZA–ZO`); no per-day schedule renders.",
      },
    },
  },
};

// Skip-condition: nothing beyond what the strip shows. The component
// returns `null` — Storybook renders an empty frame so the consumer
// can confirm "block doesn't render" is the expected behaviour. Tagged
// `vr-skip` so the null-rendered story doesn't produce noisy
// always-empty VR baselines.
export const SkipConditionMet: Story = {
  tags: ["vr-skip"],
  args: {
    isPast: false,
    value: {
      _key: "evt-4",
      _type: "eventFact",
      title: "Wafelverkoop",
      date: "2026-04-12",
      location: "Sportpark Elewijt",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Minimal eventFact whose strip already covers everything (date + location only). The block returns `null` — the article body ends at `<EndMark>` and goes straight to `<ArticleCredits>`.",
      },
    },
  },
};
