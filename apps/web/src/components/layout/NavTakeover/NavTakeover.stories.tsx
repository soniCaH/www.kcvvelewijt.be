import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NavTakeover } from "./NavTakeover";
import { NavTakeoverItem } from "./NavTakeoverItem";
import { Button } from "@/components/design-system/Button";

const meta = {
  title: "UI/NavTakeover",
  component: NavTakeover,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NavTakeover>;

export default meta;
type Story = StoryObj<typeof meta>;

const wordmark = (
  <span className="font-display text-[20px] font-black italic">
    KCVV <span className="text-jersey-deep">Elewijt</span>
  </span>
);

const navItems = (
  <>
    <NavTakeoverItem label="Home" href="/" />
    <NavTakeoverItem label="Nieuws" href="/nieuws" active />
    <NavTakeoverItem label="Evenementen" href="/events" />
    <NavTakeoverItem label="Teams" hasSubmenu>
      <NavTakeoverItem label="A-Ploeg" href="/ploegen/a" />
      <NavTakeoverItem label="B-Ploeg" href="/ploegen/b" />
    </NavTakeoverItem>
    <NavTakeoverItem label="Jeugd" hasSubmenu />
    <NavTakeoverItem label="Sponsors" href="/sponsors" />
    <NavTakeoverItem label="Hulp" href="/hulp" />
    <NavTakeoverItem label="De club" hasSubmenu />
    <div className="mt-6">
      <Button variant="primary" size="md" fullWidth>
        Word lid
      </Button>
    </div>
  </>
);

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    wordmark,
    children: navItems,
  },
};

export const OpenWithSubmenuExpanded: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    wordmark,
    children: (
      <>
        <NavTakeoverItem label="Home" href="/" />
        <NavTakeoverItem label="Nieuws" href="/nieuws" />
        <NavTakeoverItem label="Teams" hasSubmenu defaultExpanded>
          <NavTakeoverItem label="A-Ploeg" href="/ploegen/a" />
          <NavTakeoverItem label="B-Ploeg" href="/ploegen/b" />
          <NavTakeoverItem label="C-Ploeg" href="/ploegen/c" />
        </NavTakeoverItem>
        <div className="mt-6">
          <Button variant="primary" size="md" fullWidth>
            Word lid
          </Button>
        </div>
      </>
    ),
  },
};
