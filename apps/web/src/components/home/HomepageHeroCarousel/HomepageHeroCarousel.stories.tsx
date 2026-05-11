import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomepageHeroCarousel } from "./HomepageHeroCarousel";
import {
  mockArticles,
  mockSingleArticle,
  mockTwoArticles,
} from "./HomepageHeroCarousel.mocks";

const meta = {
  title: "Features/Homepage/HomepageHeroCarousel",
  component: HomepageHeroCarousel,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Homepage hero carousel (Phase 4.C.1, Round 1b D.1 lock). Client wrapper around `<EditorialHero placement="homepage">` rendering up to 3 articles with a strip-below thumbnails row. Auto-rotates every 5s; pauses on hover, focus-within, when the user toggles pause, or when `prefers-reduced-motion: reduce` is set. Active thumb has a `#f0c264` outline + full opacity; inactives sit at 60% opacity. Arrow keys advance.',
      },
    },
  },
} satisfies Meta<typeof HomepageHeroCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { articles: mockArticles, initialPaused: true },
  parameters: {
    docs: {
      description: {
        story:
          "3 articles, paused initial state so the VR baseline captures the first slide deterministically. Hover or use the pause button to test auto-rotation interactively.",
      },
    },
  },
};

export const ActiveSlide2: Story = {
  args: { articles: mockArticles, initialPaused: true, initialIndex: 1 },
  parameters: {
    docs: {
      description: {
        story:
          "Same 3 articles, slide 2 active — verifies the thumb-strip active-outline jumps with `aria-pressed`.",
      },
    },
  },
};

export const ActiveSlide3: Story = {
  args: { articles: mockArticles, initialPaused: true, initialIndex: 2 },
  parameters: {
    docs: {
      description: {
        story:
          "Same 3 articles, slide 3 active — last position, baseline for wrap-around behaviour.",
      },
    },
  },
};

export const TwoArticles: Story = {
  args: { articles: mockTwoArticles, initialPaused: true },
  parameters: {
    docs: {
      description: {
        story:
          "Only 2 thumbnails appear in the strip (the locked spec keeps the grid at 3 cols; the third column collapses).",
      },
    },
  },
};

export const SingleArticle: Story = {
  args: { articles: mockSingleArticle },
  parameters: {
    docs: {
      description: {
        story:
          "Single article — no carousel chrome, no thumb strip, no auto-rotation. Just the hero.",
      },
    },
  },
};

export const Paused: Story = {
  args: { articles: mockArticles, initialPaused: true },
  parameters: {
    docs: {
      description: {
        story:
          "Initial paused state — pause button shows the play glyph; progress bar stays static at the active slide.",
      },
    },
  },
};

export const Empty: Story = {
  args: { articles: [] },
  parameters: {
    docs: {
      description: {
        story: "Zero articles — entire component returns null.",
      },
    },
  },
};
