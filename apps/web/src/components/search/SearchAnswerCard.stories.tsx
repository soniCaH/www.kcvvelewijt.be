/**
 * SearchAnswerCard Storybook Stories
 *
 * The `/zoeken` "Slim antwoord" card (8s5 variant C LOCKED): a taped fanzine
 * memo with a decorative `✦ SLIM` postmark, the LLM answer as a Fraunces-italic
 * pull-quote, footnote source links, and a brick AI disclaimer.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchAnswerCard } from "./SearchAnswerCard";

const meta = {
  title: "Features/Search/SearchAnswerCard",
  component: SearchAnswerCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SearchAnswerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The canonical case — a confident answer with three source links.
 */
export const Default: Story = {
  args: {
    answer:
      "Laat je interesse achter via het inschrijvingsformulier — daarna nemen we contact op om samen een plek in de juiste leeftijdsploeg te zoeken. Een definitieve plaats hangt af van de beschikbaarheid per ploeg.",
    sources: [
      { title: "Word lid", href: "/club/inschrijven" },
      { title: "Jeugdwerking", href: "/club/jeugd" },
      { title: "Contact", href: "/club/contact" },
    ],
  },
};

/**
 * A long answer — verifies the length clamp keeps the rotated card from
 * clipping and the prose wrapping gracefully.
 */
export const LongAnswer: Story = {
  args: {
    answer:
      "Iedereen is welkom bij KCVV Elewijt, van de allerkleinste U6-tjes tot onze eerste ploegen en de recreatieve reeksen. Je laat je interesse achter via het inschrijvingsformulier, waarna een van onze jeugdcoördinatoren contact opneemt om samen de juiste leeftijdsploeg en trainingsdagen te bekijken. De definitieve plaats hangt af van de beschikbaarheid en de samenstelling van de ploegen voor het komende seizoen.",
    sources: [
      { title: "Word lid", href: "/club/inschrijven" },
      { title: "Jeugdwerking", href: "/club/jeugd" },
    ],
  },
};

/**
 * No sources behind the answer — the footnote row is omitted.
 */
export const NoSources: Story = {
  args: {
    answer:
      "De kantine is open op wedstrijddagen en tijdens de trainingen — kom gerust langs voor een drankje.",
    sources: [],
  },
};
