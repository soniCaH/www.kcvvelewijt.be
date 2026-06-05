import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent } from "storybook/test";
import { CalendarWidget } from "./CalendarWidget";
import type {
  CalendarMatch,
  CalendarTeamInfo,
} from "@/app/(main)/kalender/utils";
import { buildCalendarFeed } from "@/app/(main)/kalender/utils";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import CalendarLoading from "@/app/(main)/kalender/loading";
import { fixtureImage } from "@test-fixtures/images";

const kcvv = {
  id: 1,
  name: "KCVV Elewijt A",
  logo: fixtureImage("sponsor-logo", 0),
};
const opponent = {
  id: 2,
  name: "Racing Mechelen",
  logo: fixtureImage("sponsor-logo", 1),
};

const matches: CalendarMatch[] = [
  {
    id: 1,
    date: "2026-03-15T15:00:00",
    time: "15:00",
    homeTeam: kcvv,
    awayTeam: opponent,
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
  {
    id: 2,
    date: "2026-03-22T14:30:00",
    time: "14:30",
    homeTeam: opponent,
    awayTeam: kcvv,
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Nationale 1",
    team: "A-ploeg",
  },
  {
    id: 3,
    date: "2026-03-15T10:00:00",
    time: "10:00",
    homeTeam: kcvv,
    awayTeam: { id: 3, name: "KFC Diest" },
    scoreDisplay: { type: "vs" },
    status: "scheduled",
    competition: "Jeugd",
    team: "U15 A",
  },
];

const events: EventListItemVM[] = [
  {
    id: "e1",
    title: "Paastoernooi",
    href: "/evenementen/paastoernooi",
    dateStart: "2026-03-20T10:00:00",
    dateEnd: null,
    eventType: "Clubevent",
    location: "Sportpark Driesput, Elewijt",
    source: "event",
  },
];

const teams: CalendarTeamInfo[] = [
  { id: "t1", name: "A-ploeg", psdId: 101, label: "A-ploeg" },
  { id: "t2", name: "U15 A", psdId: 103, label: "U15 A" },
];

const feed = buildCalendarFeed(matches, events);

const meta = {
  title: "Features/Calendar/CalendarWidget",
  component: CalendarWidget,
  parameters: {
    layout: "padded",
    nextjs: {
      navigation: { pathname: "/kalender", query: {} },
    },
  },
  tags: ["autodocs", "vr"],
  args: {
    feed,
    teams,
    // Seed the opening window to the fixtures' month so VR baselines render
    // content regardless of the runner's pinned clock (see the `today` prop).
    today: "2026-03-15",
  },
} satisfies Meta<typeof CalendarWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ────────────────────────────────────────────────────────────────

export const MonthView: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "month" } },
    },
  },
};

export const WeekView: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "week" } },
    },
  },
};

export const AgendaView: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "agenda" } },
    },
  },
};

/** By-type filter applied — only `Wedstrijden` (matches) survive the filter. */
export const FilteredToWedstrijden: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/kalender",
        query: { view: "month", type: "Wedstrijden" },
      },
    },
  },
};

/** Filtered-to-zero — a category with no upcoming items shows the reset state. */
export const FilteredToZero: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/kalender",
        query: { view: "month", type: "Supportersactiviteit" },
      },
    },
  },
};

export const SubscribePanelOpen: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: "/kalender", query: { view: "month" } },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Abonneer/i }));
  },
};

export const RouteSkeleton: Story = {
  render: () => <CalendarLoading />,
  parameters: { layout: "fullscreen" },
};
