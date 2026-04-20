import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchesSliderEmptyState } from "./MatchesSliderEmptyState";

const meta = {
  title: "Features/Homepage/MatchesSliderEmptyState",
  component: MatchesSliderEmptyState,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <section className="bg-kcvv-black py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Story />
        </div>
      </section>
    ),
  ],
} satisfies Meta<typeof MatchesSliderEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const inDays = (n: number) =>
  new Date(new Date().setUTCHours(0, 0, 0, 0) + n * MS_PER_DAY);

export const Baseline: Story = {};

export const Countdown: Story = {
  args: {
    placeholder: {
      nextSeasonKickoff: inDays(70),
    },
  },
};

export const CountdownOneDay: Story = {
  args: {
    placeholder: {
      nextSeasonKickoff: inDays(1),
    },
  },
};

export const CountdownToday: Story = {
  args: {
    placeholder: {
      nextSeasonKickoff: inDays(0),
    },
  },
};

export const Announcement: Story = {
  args: {
    placeholder: {
      announcementText: "Kalender 25-26 volgende week online",
    },
  },
};

export const AnnouncementWithLink: Story = {
  args: {
    placeholder: {
      announcementText: "Kalender 25-26 volgende week online",
      announcementHref: "https://www.kcvvelewijt.be/kalender",
    },
  },
};

export const CountdownAndAnnouncement: Story = {
  args: {
    placeholder: {
      nextSeasonKickoff: inDays(70),
      announcementText: "Abonnementen nu verkrijgbaar in het secretariaat",
    },
  },
};

export const CustomImage: Story = {
  args: {
    placeholder: {
      nextSeasonKickoff: inDays(45),
      highlightImage: {
        alt: "Supporters juichen langs de lijn",
        url: "/images/youth-trainers.jpg",
      },
    },
  },
};

export const AllFieldsPopulated: Story = {
  args: {
    placeholder: {
      nextSeasonKickoff: inDays(45),
      announcementText: "Abonnementen nu verkrijgbaar in het secretariaat",
      announcementHref: "https://www.kcvvelewijt.be/tickets",
      highlightImage: {
        alt: "Supporters juichen langs de lijn",
        url: "/images/youth-trainers.jpg",
      },
    },
  },
};
