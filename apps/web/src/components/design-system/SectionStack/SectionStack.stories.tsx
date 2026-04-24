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
      className={`mx-auto flex max-w-7xl items-center px-4 md:px-8 ${height}`}
    >
      <span className="text-sm font-bold tracking-widest uppercase opacity-50">
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

// ─── Backdrop story ───────────────────────────────────────────────────────────
//
// A single backdropped section flanked by plain siblings, so reviewers can
// verify the backdrop extends into both adjacent diagonal strips. The CSS
// gradient stands in for a real photo to keep the story deterministic.

function MockPhotoBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,215,0,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(0,135,85,0.55), transparent 60%), linear-gradient(135deg, #0a1a14 0%, #1e2024 50%, #0a1a14 100%)",
      }}
    />
  );
}

export const BackdroppedSection: Story = {
  name: "Backdrop — single section flanked by plain siblings (§5.1, §5.6)",
  args: {
    sections: [
      {
        bg: "gray-100",
        content: <MockSection label="Plain section (gray-100)" />,
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "kcvv-green-dark",
        backdrop: <MockPhotoBackdrop />,
        content: (
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-white md:px-8">
            <span className="text-xs font-bold tracking-widest uppercase opacity-70">
              Backdropped section
            </span>
            <span className="text-2xl font-bold">
              Content sits at z-10 above the backdrop
            </span>
            <span className="text-sm opacity-80">
              The gradient visible in the diagonal strips above and below this
              section is the <code>backdrop</code> extending past its own
              wrapper into adjacent <code>SectionTransition</code> areas via
              auto-propagated <code>revealFrom</code> / <code>revealTo</code>.
            </span>
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      {
        bg: "gray-100",
        content: <MockSection label="Plain section (gray-100)" />,
      },
    ],
  },
};
