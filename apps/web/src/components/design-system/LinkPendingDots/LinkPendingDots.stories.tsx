/**
 * LinkPendingDots Stories
 *
 * The pending state of a tapped link (#3386). Storybook's `next/link` mock
 * reports `pending: false`, so each story flips `useLinkStatus` to pending in
 * `beforeEach` (storybook/test restores the spy between stories). Resting
 * links render nothing extra — that half needs no story.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link, { useLinkStatus } from "next/link";
import { mocked } from "storybook/test";
import { LinkPendingDots } from "./LinkPendingDots";

const meta = {
  title: "UI/LinkPendingDots",
  component: LinkPendingDots,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "vr"],
  beforeEach: () => {
    mocked(useLinkStatus).mockReturnValue({ pending: true });
  },
} satisfies Meta<typeof LinkPendingDots>;

export default meta;
type Story = StoryObj<typeof meta>;

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
