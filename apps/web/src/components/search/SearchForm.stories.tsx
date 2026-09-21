/**
 * SearchForm Storybook Stories
 *
 * The 8s1 hard-shadow search field. Rendered on a `jersey-deep-dark` ground
 * (its real context inside `<SearchMasthead>`); the cream input + warm-gold
 * magnifier cell read against the dark band.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SearchForm } from "./SearchForm";
import { forceSearchFocusRing } from "./search-form-vr-focus";

const meta = {
  title: "Features/Search/SearchForm",
  component: SearchForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  args: {
    onSearch: fn(),
  },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark p-8">
        <Story />
      </div>
    ),
  ],
  // VR determinism (#3033): force the focus-ring to a state the story
  // declares rather than one dependent on the runner's real frame focus —
  // see search-form-vr-focus.ts.
  play: async ({ canvasElement }) => {
    forceSearchFocusRing(canvasElement);
  },
} satisfies Meta<typeof SearchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty search form
 */
export const Default: Story = {
  args: {
    initialValue: "",
    isLoading: false,
  },
};

/**
 * With initial value (clear affordance visible)
 */
export const WithInitialValue: Story = {
  args: {
    initialValue: "goalkeeper",
    isLoading: false,
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    initialValue: "searching...",
    isLoading: true,
  },
};

/**
 * Custom placeholder
 */
export const CustomPlaceholder: Story = {
  args: {
    initialValue: "",
    placeholder: "Zoek naar spelers...",
    isLoading: false,
  },
};
