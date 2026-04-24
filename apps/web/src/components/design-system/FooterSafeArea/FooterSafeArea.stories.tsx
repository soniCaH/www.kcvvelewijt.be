import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FooterSafeArea } from "./FooterSafeArea";
import type { SectionBg } from "@/components/design-system/SectionTransition/SectionTransition";

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
} satisfies Meta<typeof FooterSafeArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Outline on top of each variant so the reserved DIAGONAL_HEIGHT is visible
 *  (the component itself is intentionally "invisible" when bg matches the
 *  surrounding surface). */
function Outlined({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ outline: "2px dashed #cc4b37", outlineOffset: "-2px" }}>
      {children}
    </div>
  );
}

export const Playground: Story = {
  args: { bg: "transparent" },
  render: (args) => (
    <Outlined>
      <FooterSafeArea {...args} />
    </Outlined>
  ),
};

const VARIANTS: SectionBg[] = [
  "transparent",
  "white",
  "gray-100",
  "kcvv-black",
  "kcvv-green-dark",
];

export const Transparent: Story = {
  args: { bg: "transparent" },
  render: (args) => (
    <Outlined>
      <FooterSafeArea {...args} />
    </Outlined>
  ),
};

export const White: Story = {
  args: { bg: "white" },
  render: (args) => (
    <Outlined>
      <FooterSafeArea {...args} />
    </Outlined>
  ),
};

export const Gray100: Story = {
  args: { bg: "gray-100" },
  render: (args) => (
    <Outlined>
      <FooterSafeArea {...args} />
    </Outlined>
  ),
};

export const KcvvBlack: Story = {
  args: { bg: "kcvv-black" },
  render: (args) => (
    <Outlined>
      <FooterSafeArea {...args} />
    </Outlined>
  ),
};

export const KcvvGreenDark: Story = {
  args: { bg: "kcvv-green-dark" },
  render: (args) => (
    <Outlined>
      <FooterSafeArea {...args} />
    </Outlined>
  ),
};

/** All variants stacked so reviewers can compare color continuity at a glance. */
export const AllVariants: Story = {
  args: {},
  render: () => (
    <div>
      {VARIANTS.map((bg) => (
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
