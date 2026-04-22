import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageFooter } from "./PageFooter";
import {
  BG_COLOR,
  type SectionBg,
} from "@/components/design-system/SectionTransition/SectionTransition";

const meta = {
  title: "Layout/PageFooter",
  component: PageFooter,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Surface-color variants: the self-owning diagonal must cut cleanly against
// every common surface color the site paints underneath the footer, with no
// gray wedge, anti-aliasing fringe, or horizontal seam. Chromatic snapshots
// these four variants as the visual-regression gate. Surface hex values come
// from `BG_COLOR` (SectionTransition) so stories stay in sync if design
// tokens are ever retuned.
const SurfaceTemplate = ({ surface }: { surface: SectionBg }) => (
  <div
    className="flex min-h-screen flex-col"
    style={{ backgroundColor: BG_COLOR[surface] }}
    data-testid={`surface-${surface}`}
  >
    <div className="min-h-[240px] flex-1" />
    <PageFooter />
  </div>
);

export const OverWhite: Story = {
  render: () => <SurfaceTemplate surface="white" />,
};

export const OverGray100: Story = {
  render: () => <SurfaceTemplate surface="gray-100" />,
};

export const OverKcvvBlack: Story = {
  render: () => <SurfaceTemplate surface="kcvv-black" />,
};

export const OverKcvvGreenDark: Story = {
  render: () => <SurfaceTemplate surface="kcvv-green-dark" />,
};

export const Standalone: Story = {
  args: {},
};
