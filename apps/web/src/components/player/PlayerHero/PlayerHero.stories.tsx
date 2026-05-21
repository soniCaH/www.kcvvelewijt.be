/**
 * <PlayerHero> stories.
 *
 * Covers the Phase 6.A lock matrix:
 *  - A-team adult with photo (`AdultWithPhoto`)
 *  - A-team adult without photo → illustration fallback (`AdultIllustrationFallback`)
 *  - U17 minor with photo → age-graded meta row (`MinorU17WithPhoto`)
 *  - U8 minor without photo → minor + illustration combined (`MinorU8Illustration`)
 *  - Long Dutch surname stress (`LongSurname`)
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerHero } from "./PlayerHero";

/**
 * Deterministic VR fixtures — real `psdImage` JPGs pulled from the Sanity
 * staging dataset (project `vhb33jaz`, dataset `staging`). Checked into
 * `apps/web/public/player-fixtures/` so the VR-tagged stories don't depend
 * on the legacy Drupal cutouts (transparent PNGs, ~10% of production
 * players) — production reality is bounded-box opaque JPGs, see
 * `[[feedback_subject_photo_fallback]]`.
 */
const REAL_PLAYER_PHOTOS = {
  mendesMouro: "/player-fixtures/player-mendes-mouro.jpg",
  schulz: "/player-fixtures/player-schulz.jpg",
  vartolomaios: "/player-fixtures/player-vartolomaios.jpg",
};

const meta = {
  title: "Features/Players/PlayerHero",
  component: PlayerHero,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 6.A hero band for `/spelers/[slug]`. Composes `<TapedFigure>` + `<NumberDisplay>` + a 2-line name rhythm (first name in upright Black display, last name in italic). Age-graded meta row hides full DOB for minors.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    firstName: { control: "text" },
    lastName: { control: "text" },
    position: {
      control: "select",
      options: ["Keeper", "Verdediger", "Middenvelder", "Aanvaller"],
    },
    photoUrl: { control: "text" },
    birthDate: { control: "text" },
    jerseyNumber: { control: "number" },
    teamLabel: { control: "text" },
    season: { control: "text" },
  },
} satisfies Meta<typeof PlayerHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A-team adult with a photo — canonical hero composition. */
export const AdultWithPhoto: Story = {
  args: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    position: "Middenvelder",
    photoUrl: REAL_PLAYER_PHOTOS.mendesMouro,
    birthDate: "1999-03-14",
    jerseyNumber: 8,
    teamLabel: "A-Ploeg",
    season: "26/27",
  },
};

/** A-team adult without a psdImage — illustration fallback (6.d2). */
export const AdultIllustrationFallback: Story = {
  args: {
    firstName: "Joris",
    lastName: "Vermeiren",
    position: "Verdediger",
    birthDate: "1996-11-02",
    jerseyNumber: 4,
    teamLabel: "A-Ploeg",
    season: "26/27",
  },
};

/** U17 minor with a photo — age-graded meta (6.d9). Full DOB suppressed. */
export const MinorU17WithPhoto: Story = {
  args: {
    firstName: "Sem",
    lastName: "De Witte",
    position: "Aanvaller",
    photoUrl: REAL_PLAYER_PHOTOS.schulz,
    birthDate: "2009-09-12",
    jerseyNumber: 11,
    teamLabel: "U17",
    season: "26/27",
  },
};

/** U8 minor without a photo — minor + illustration; covers youngest profile. */
export const MinorU8Illustration: Story = {
  args: {
    firstName: "Lars",
    lastName: "Peeters",
    position: "Middenvelder",
    birthDate: "2018-04-08",
    jerseyNumber: 7,
    teamLabel: "U8",
    season: "26/27",
  },
};

/** Long Dutch family name stress — verifies the italic last name does not break layout (6.d1). */
export const LongSurname: Story = {
  args: {
    firstName: "Joachim",
    lastName: "Van den Broeck",
    position: "Verdediger",
    photoUrl: REAL_PLAYER_PHOTOS.vartolomaios,
    birthDate: "1998-07-22",
    jerseyNumber: 17,
    teamLabel: "A-Ploeg",
    season: "26/27",
  },
};
