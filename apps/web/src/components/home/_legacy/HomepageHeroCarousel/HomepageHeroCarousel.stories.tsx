import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomepageHeroCarousel } from "./HomepageHeroCarousel";
import {
  mockArticles,
  mockSingleArticle,
  mockTwoArticles,
} from "./HomepageHeroCarousel.mocks";

const meta = {
  title: "Features/Homepage/_legacy/HomepageHeroCarousel",
  component: HomepageHeroCarousel,
  // Keep the `vr` tag so discovery still picks the story up; the
  // `parameters.vr.disable = true` below suppresses screenshot
  // capture per the "Defer consumer baselines via vr.disable" rule
  // in `apps/web/CLAUDE.md`.
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Homepage hero carousel — **retired Phase 4.5.C.1 (#1754)**. Moved to `_legacy/` for blame trace; replaced on `/` by a static `<EditorialHero placement="homepage">` + `<FeaturedUitgelichtRow>` per the R1.B hero-locked spec. Kept buildable so the existing tests / story remain explorable; deletion is deferred to a future cleanup phase.',
      },
    },
    // vr.disable: legacy component, retired from homepage spine (#1754).
    // The static <EditorialHero> + <FeaturedUitgelichtRow> replacement
    // owns the regenerated baselines; the carousel will be deleted in a
    // future cleanup phase, so its baselines no longer add coverage.
    // Repro: stories render fine but capturing baselines doubles the
    // VR matrix for a component no consumer renders.
    // Approved by: @climacon / https://github.com/soniCaH/www.kcvvelewijt.be/issues/1754
    // Re-evaluate: 2026-08-01 (Phase 9 cleanup window)
    vr: { disable: true },
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
  // vr-skip — story renders null; capturing blank frames adds 3 baselines
  // (desktop/tablet/mobile) with no visual signal.
  tags: ["vr-skip"],
  parameters: {
    docs: {
      description: {
        story: "Zero articles — entire component returns null.",
      },
    },
  },
};
