import { type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FooterSafeArea } from "./FooterSafeArea";
import {
  BG_CLASS,
  type SectionBg,
} from "@/components/design-system/SectionTransition/SectionTransition";

/** Outline on top of each variant so the reserved DIAGONAL_HEIGHT is visible
 *  — the component itself is intentionally "invisible" when `bg` matches the
 *  surrounding surface. */
function Outlined({ children }: { children: ReactNode }) {
  return (
    <div style={{ outline: "2px dashed #cc4b37", outlineOffset: "-2px" }}>
      {children}
    </div>
  );
}

const meta = {
  title: "UI/FooterSafeArea",
  component: FooterSafeArea,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Reserves the footer-diagonal-sized safe area at the end of a page so the `PageFooter`'s overlap-full diagonal has room to sit without clipping content. Pair `bg` with the page's final section color so the diagonal's transparent upper triangle reveals the right color. See #1360.",
      },
    },
  },
  argTypes: {
    bg: {
      control: { type: "select" },
      options: Object.keys(BG_CLASS) as SectionBg[],
    },
  },
  decorators: [
    (StoryEl) => (
      <Outlined>
        <StoryEl />
      </Outlined>
    ),
  ],
} satisfies Meta<typeof FooterSafeArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive — flip `bg` in Storybook controls. */
export const Playground: Story = {
  args: { bg: "transparent" },
};

export const White: Story = { args: { bg: "white" } };
export const Gray100: Story = { args: { bg: "gray-100" } };
export const KcvvBlack: Story = { args: { bg: "kcvv-black" } };
export const KcvvGreenDark: Story = { args: { bg: "kcvv-green-dark" } };

/** All variants stacked so reviewers can compare color continuity at a glance.
 *  Opts out of the default decorator since it renders its own labelled rows. */
export const AllVariants: Story = {
  args: {},
  decorators: [(StoryEl) => <StoryEl />],
  render: () => (
    <div>
      {(Object.keys(BG_CLASS) as SectionBg[]).map((bg) => (
        <div key={bg}>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#9a9da2",
              padding: "4px 8px",
            }}
          >
            bg=&quot;{bg}&quot;
          </div>
          <Outlined>
            <FooterSafeArea bg={bg} />
          </Outlined>
        </div>
      ))}
    </div>
  ),
};
