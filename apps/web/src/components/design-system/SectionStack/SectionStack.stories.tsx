import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionStack } from "./SectionStack";
import type { SectionConfig } from "./SectionStack";

const meta = {
  title: "UI/SectionStack",
  component: SectionStack,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SectionStack>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Mock section content helpers ────────────────────────────────────────────

function MockSection({
  label,
  height = "h-32",
}: {
  label: string;
  height?: string;
}) {
  return (
    <div
      className={`max-w-7xl mx-auto px-4 md:px-8 flex items-center ${height}`}
    >
      <span className="text-sm font-bold uppercase tracking-widest opacity-50">
        {label}
      </span>
    </div>
  );
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    sections: [
      {
        bg: "kcvv-black",
        content: <MockSection label="Hero (kcvv-black)" height="h-48" />,
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        transition: {
          type: "double-diagonal",
          direction: "right",
          via: "white",
          overlap: "half",
        },
      },
      {
        bg: "kcvv-green-dark",
        content: <MockSection label="Match Widget (kcvv-green-dark)" />,
        paddingTop: "pt-12",
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="Latest News (gray-100)" />,
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "kcvv-black",
        content: <MockSection label="Matches Slider (kcvv-black)" />,
        paddingTop: "pt-10",
        transition: { type: "diagonal", direction: "right" },
      },
      {
        bg: "kcvv-green-dark",
        content: <MockSection label="Youth (kcvv-green-dark)" />,
        paddingTop: "pt-10",
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="Sponsors (gray-100)" />,
      },
    ],
  },
};

// ─── Shared section configs ───────────────────────────────────────────────────

const heroSection: SectionConfig = {
  bg: "kcvv-black",
  content: (
    <MockSection label="FeaturedArticles — Hero (kcvv-black)" height="h-48" />
  ),
  paddingTop: "pt-0",
  paddingBottom: "pb-0",
  transition: {
    type: "double-diagonal",
    direction: "right",
    via: "white",
    overlap: "half",
  },
};
const matchWidgetSection: SectionConfig = {
  bg: "kcvv-green-dark",
  content: <MockSection label="MatchWidget (kcvv-green-dark)" />,
  paddingTop: "pt-12",
  transition: { type: "diagonal", direction: "left" },
};
const latestNewsSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="LatestNews (gray-100)" />,
  transition: { type: "diagonal", direction: "left" },
};
const bannerSlotBSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="BannerSlot B (gray-100)" />,
  transition: { type: "diagonal", direction: "left" },
};
const matchesSliderSection: SectionConfig = {
  bg: "kcvv-black",
  content: <MockSection label="MatchesSlider (kcvv-black)" />,
  paddingTop: "pt-10",
  transition: { type: "diagonal", direction: "right" },
};
const youthSection: SectionConfig = {
  bg: "kcvv-green-dark",
  content: <MockSection label="YouthSection (kcvv-green-dark)" />,
  paddingTop: "pt-10",
  transition: { type: "diagonal", direction: "left" },
};
const sponsorsSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="SponsorsSection (gray-100)" />,
};

export const HomepageFullStack: Story = {
  name: "Homepage — All sections present",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      bannerSlotBSection,
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const MissingMatchWidget: Story = {
  name: "Resilience — MatchWidget absent",
  args: {
    sections: [
      heroSection,
      null, // MatchWidget missing
      latestNewsSection,
      bannerSlotBSection,
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const MissingMatchesSlider: Story = {
  name: "Resilience — MatchesSlider absent",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      bannerSlotBSection,
      null, // MatchesSlider missing
      youthSection,
      sponsorsSection,
    ],
  },
};

export const MissingBannerSlotB: Story = {
  name: "Resilience — BannerSlot B absent",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      null, // BannerSlot B missing — LatestNews transitions directly to MatchesSlider
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const BannerSlotBPresent: Story = {
  name: "Resilience — BannerSlot B present (same-bg skip fires)",
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      bannerSlotBSection, // same-bg gray-100: skip fires between LatestNews and BannerSlot B
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
};

export const AllDataAbsent: Story = {
  name: "Resilience — Only sponsors remain",
  args: {
    sections: [
      null, // no hero
      null, // no match widget
      null, // no news
      null, // no banner
      null, // no slider
      null, // no youth
      sponsorsSection,
    ],
  },
};

export const StraightEdges: Story = {
  name: "Straight edges (no transition configs)",
  args: {
    sections: [
      {
        bg: "kcvv-black",
        content: <MockSection label="Section 1 (kcvv-black)" />,
      },
      { bg: "gray-100", content: <MockSection label="Section 2 (gray-100)" /> },
      {
        bg: "kcvv-green-dark",
        content: <MockSection label="Section 3 (kcvv-green-dark)" />,
      },
    ],
  },
};

export const AlternatingDirections: Story = {
  name: "Alternating left/right diagonal directions",
  args: {
    sections: [
      {
        bg: "kcvv-black",
        content: <MockSection label="A (kcvv-black)" />,
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="B (gray-100)" />,
        transition: { type: "diagonal", direction: "right" },
      },
      {
        bg: "kcvv-green-dark",
        content: <MockSection label="C (kcvv-green-dark)" />,
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="D (gray-100)" />,
      },
    ],
  },
};
