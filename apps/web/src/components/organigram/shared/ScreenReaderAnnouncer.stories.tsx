import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScreenReaderAnnouncer } from "./ScreenReaderAnnouncer";

const meta = {
  title: "Features/Organigram/ScreenReaderAnnouncer",
  component: ScreenReaderAnnouncer,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Invisible `aria-live` region that announces dynamic messages to screen readers. Renders no visible UI — check the DOM for the `aria-live` attribute.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScreenReaderAnnouncer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Polite announcement — waits for screen reader to finish current speech. */
export const Polite: Story = {
  args: {
    message: "Zoekresultaten bijgewerkt: 3 personen gevonden.",
    politeness: "polite",
  },
};

/** Assertive announcement — interrupts current speech immediately. */
export const Assertive: Story = {
  args: {
    message: "Fout: kon organogram niet laden.",
    politeness: "assertive",
  },
};

/** No message — aria-live region present but empty. */
export const Empty: Story = {
  args: {
    message: "",
    politeness: "polite",
  },
};
