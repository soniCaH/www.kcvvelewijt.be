/**
 * LinkPendingDots Stories
 *
 * The pending state of a tapped link (#3386). Storybook's `next/link` mock
 * reports `pending: false`, so each story flips `useLinkStatus` to pending in
 * `beforeEach` (storybook/test restores the spy between stories), then `play`
 * waits out the 150 ms delay so the capture always has the dots in it.
 * Resting links render nothing extra — that half needs no story.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link, { useLinkStatus } from "next/link";
import { expect, mocked, within } from "storybook/test";
import { LinkPendingDots } from "./LinkPendingDots";

const meta = {
  title: "UI/LinkPendingDots",
  component: LinkPendingDots,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    placement: {
      control: "select",
      options: ["inline", "corner"],
      description: "After the label, or absolutely positioned in a corner",
    },
    tone: {
      control: "select",
      options: ["default", "light"],
      description: "`light` for a dark ground",
    },
    spaced: {
      control: "boolean",
      description: "Inline only: the gap before the dots",
    },
  },
  beforeEach: () => {
    mocked(useLinkStatus).mockReturnValue({ pending: true });
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("status", { hidden: true }),
    ).toBeInTheDocument();
  },
} satisfies Meta<typeof LinkPendingDots>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground — the dots on a text link. Switch placement and tone in the
 * controls (a `corner` needs a `relative` link; this one is).
 */
export const Playground: Story = {
  args: { placement: "inline", tone: "default", spaced: true },
  render: (args) => (
    <Link
      href="/nieuws/voorbeeld"
      className="prose-link relative inline-block px-8 py-4"
    >
      Lees verder
      <LinkPendingDots {...args} />
    </Link>
  ),
};

/**
 * Inline — after the label of a text link, nav row or button. Shown here in
 * running prose, the case that needs a `span` root.
 */
export const Inline: Story = {
  render: () => (
    <p className="text-body-md max-w-sm">
      Lees het volledige{" "}
      <Link href="/nieuws/voorbeeld" className="prose-link">
        verslag van de wedstrijd
        <LinkPendingDots />
      </Link>{" "}
      op onze site.
    </p>
  ),
};

/**
 * Corner — absolutely positioned inside a `relative` whole-card link, so the
 * card never shifts. Top-right here; each card picks the corner that keeps
 * its title clear.
 */
export const Corner: Story = {
  render: () => (
    <Link
      href="/nieuws/voorbeeld"
      className="border-ink bg-cream relative block w-72 border-2 p-4 no-underline"
    >
      <span className="font-display text-display-sm block font-bold italic">
        Zege in de laatste minuut
      </span>
      <span className="text-ink-muted text-body-sm block">
        Een kaartlink: de puntjes liggen in de hoek, de layout blijft staan.
      </span>
      <LinkPendingDots placement="corner" />
    </Link>
  ),
};

/**
 * On a dark ground — `tone="light"` recolours the dots cream. The default
 * jersey-deep dots all but vanish on `bg-jersey-deep-dark`.
 */
export const OnDarkGround: Story = {
  render: () => (
    <Link
      href="/kalender"
      className="bg-jersey-deep-dark text-cream relative block w-72 p-4 font-mono text-xs font-semibold uppercase no-underline"
    >
      Volledige kalender →
      <LinkPendingDots tone="light" />
    </Link>
  ),
};
