import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ErrorState } from "./ErrorState";

/**
 * Phase 8.4 — 404 / 500 error pages. The "centered" layout was chosen over the
 * "scoreboard" candidate in the Storybook A/B and is the shipped composition;
 * the loser was removed before route wire-in (`8e1-composition-locked.md`).
 * `vr`-tagged so the surviving layout acquires VR baselines per the
 * master-design VR contract.
 */
const meta = {
  title: "UI/ErrorState",
  component: ErrorState,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFound404: Story = {
  name: "404 — Buiten de lijnen",
  args: {
    code: "404",
    codeLine: "Fout 404 · pagina niet gevonden",
    pun: "Buiten de lijnen",
    body: "Deze pagina staat niet (meer) op het veld. Misschien is de link verplaatst of bestaat ze niet meer.",
    actions: [
      { label: "Naar de homepage", href: "/", variant: "primary" },
      { label: "Zoeken", href: "/zoeken", variant: "ghost" },
    ],
  },
};

export const ServerError500: Story = {
  name: "500 — Technische panne",
  args: {
    code: "500",
    codeLine: "Fout 500 · er ging iets mis",
    pun: "Technische panne",
    body: "Er ging iets mis aan onze kant. Probeer het zo dadelijk opnieuw.",
    actions: [
      { label: "Probeer opnieuw", onClick: fn(), variant: "primary" },
      { label: "Naar de homepage", href: "/", variant: "ghost" },
    ],
  },
};
