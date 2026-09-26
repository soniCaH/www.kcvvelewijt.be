import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import HulpLoading from "./loading";

/**
 * `/hulp`'s skeleton composes a bespoke shell (sticky two-door nav · dark
 * hero band · finder) beyond what `<PageHeroSkeleton>`/`<Skeleton>` alone
 * express, so it earns its own story per #2432 §8.
 *
 * Correcting the decision text against the repo as found: eight
 * `*.loading.stories.tsx` files already existed before this ticket —
 * `/club`, `/jeugd`, `/ploegen`, `/zoeken`, `/club/[slug]`, `/nieuws/[slug]`,
 * `/tegenstander/[clubId]`, `/staf/[slug]` — not the four #2432 §8 names
 * (`/wedstrijd/[matchId]`, `/tegenstander/[clubId]`, `/kalender`,
 * `/scheurkalender`). Of those four, only `/tegenstander/[clubId]` actually
 * has one; `/wedstrijd/[matchId]`, `/kalender` and `/scheurkalender` have
 * none. This file is the one net-new story #2573 adds.
 */
const meta = {
  title: "Pages/Hulp/HulpSkeleton",
  component: HulpLoading,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HulpLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
