import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MockBackdrop } from "../storybook-mocks";
import { SectionStack } from "./SectionStack";
import type { SectionConfig } from "./SectionStack";

const meta = {
  title: "UI/SectionStack",
  component: SectionStack,
  // `vr` opts this file into VR — see apps/web/.storybook/test-runner.ts.
  tags: ["autodocs", "vr"],
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
      className={`mx-auto flex max-w-[var(--container-index)] items-center px-4 md:px-8 ${height}`}
    >
      <span className="text-sm font-bold tracking-widest uppercase opacity-50">
        {label}
      </span>
    </div>
  );
}

// ─── Shared section configs ───────────────────────────────────────────────────

const heroSection: SectionConfig = {
  bg: "jersey-deep",
  content: (
    <MockSection label="FeaturedArticles — Hero (jersey-deep)" height="h-48" />
  ),
  paddingTop: "pt-0",
  paddingBottom: "pb-0",
  transition: {
    type: "striped-seam",
    height: "xl",
    colorPair: "cream-jersey-deep",
  },
};
const matchWidgetSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="MatchWidget (gray-100)" />,
  paddingTop: "pt-12",
  transition: { type: "striped-seam", height: "md", colorPair: "ink-cream" },
};
const latestNewsSection: SectionConfig = {
  bg: "white",
  content: <MockSection label="LatestNews (white)" />,
  transition: { type: "striped-seam", height: "md", colorPair: "ink-cream" },
};
const bannerSlotBSection: SectionConfig = {
  bg: "white",
  content: <MockSection label="BannerSlot B (white)" />,
  transition: { type: "striped-seam", height: "md", colorPair: "ink-cream" },
};
const matchesSliderSection: SectionConfig = {
  bg: "jersey-deep",
  content: <MockSection label="MatchesSlider (jersey-deep)" />,
  paddingTop: "pt-10",
  transition: {
    type: "striped-seam",
    height: "lg",
    colorPair: "cream-jersey-deep",
  },
};
const youthSection: SectionConfig = {
  bg: "gray-100",
  content: <MockSection label="YouthSection (gray-100)" />,
  paddingTop: "pt-10",
  transition: { type: "striped-seam", height: "md", colorPair: "ink-cream" },
};
const sponsorsSection: SectionConfig = {
  bg: "white",
  content: <MockSection label="SponsorsSection (white)" />,
};

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    sections: [
      heroSection,
      matchWidgetSection,
      latestNewsSection,
      matchesSliderSection,
      youthSection,
      sponsorsSection,
    ],
  },
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
      bannerSlotBSection, // same-bg white: skip fires between LatestNews and BannerSlot B
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
        bg: "jersey-deep",
        content: <MockSection label="Section 1 (jersey-deep)" />,
      },
      { bg: "gray-100", content: <MockSection label="Section 2 (gray-100)" /> },
      {
        bg: "white",
        content: <MockSection label="Section 3 (white)" />,
      },
    ],
  },
};

export const AlternatingColorPairs: Story = {
  name: "Alternating seam colour pairs",
  args: {
    sections: [
      {
        bg: "jersey-deep",
        content: <MockSection label="A (jersey-deep)" />,
        transition: {
          type: "striped-seam",
          height: "lg",
          colorPair: "cream-jersey-deep",
        },
      },
      {
        bg: "gray-100",
        content: <MockSection label="B (gray-100)" />,
        transition: {
          type: "striped-seam",
          height: "md",
          colorPair: "ink-cream",
        },
      },
      {
        bg: "white",
        content: <MockSection label="C (white)" />,
        transition: {
          type: "striped-seam",
          height: "md",
          colorPair: "jersey-cream",
        },
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
// verify the backdrop extends into both adjacent striped-seam strips. The mock
// visual is shared with `UI/SectionTransition` via `../storybook-mocks`.

export const BackdroppedSection: Story = {
  name: "Backdrop — single section flanked by plain siblings",
  args: {
    sections: [
      {
        bg: "gray-100",
        content: <MockSection label="Plain section (gray-100)" />,
        transition: {
          type: "striped-seam",
          height: "lg",
          colorPair: "ink-cream",
        },
      },
      {
        bg: "jersey-deep",
        backdrop: <MockBackdrop />,
        content: (
          <div className="mx-auto flex max-w-[var(--container-index)] flex-col gap-2 px-4 py-8 text-white md:px-8">
            <span className="text-xs font-bold tracking-widest uppercase opacity-70">
              Backdropped section
            </span>
            <span className="text-2xl font-bold">
              Content sits at z-10 above the backdrop
            </span>
            <span className="text-sm opacity-80">
              The backdrop extends past its own wrapper into the adjacent
              <code> StripedSeam</code> strips above and below, bleeding through
              the transparent seam SVG.
            </span>
          </div>
        ),
        transition: {
          type: "striped-seam",
          height: "lg",
          colorPair: "cream-jersey-deep",
        },
      },
      {
        bg: "gray-100",
        content: <MockSection label="Plain section (gray-100)" />,
      },
    ],
  },
};
