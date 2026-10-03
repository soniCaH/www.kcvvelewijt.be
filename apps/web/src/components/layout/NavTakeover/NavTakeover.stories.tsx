import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { NavTakeover } from "./NavTakeover";
import { NavTakeoverItem } from "./NavTakeoverItem";
import { Button } from "@/components/design-system/Button";

const meta = {
  title: "Layout/NavTakeover",
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

/**
 * The production nav, flat (#2415) — no submenu rows exist any more. `Home` is
 * absent because the wordmark above is the home link.
 */
const rows = [
  { label: "Nieuws", href: "/nieuws", active: true },
  { label: "Wedstrijden", href: "/kalender" },
  { label: "Evenementen", href: "/evenementen" },
  { label: "A-ploeg", href: "/ploegen/eerste-elftallen-a" },
  { label: "B-ploeg", href: "/ploegen/eerste-elftallen-b" },
  { label: "Jeugd", href: "/jeugd" },
  { label: "Sponsors", href: "/sponsors" },
  { label: "Hulp", href: "/hulp" },
  { label: "De club", href: "/club" },
];

const navItems = (
  <>
    {rows.map((row, index) => (
      <NavTakeoverItem key={row.href} index={index} {...row} />
    ))}
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
    rowCount: rows.length,
    children: navItems,
  },
  /**
   * The row rules' draw (#3392). VR cannot see a transition that does not run —
   * the runner zeroes every duration — so this reads the computed style of a
   * rule (`::after`) in a real browser: Tailwind v4's `scale-x-*` sets the CSS
   * `scale` property, so a `transform`-only list would snap it unnoticed.
   */
  play: async ({ canvasElement }) => {
    if (navigator.userAgent.includes("StorybookTestRunner")) return;
    const panel = getComputedStyle(within(canvasElement).getByRole("dialog"));
    const rule = (name: string) =>
      getComputedStyle(
        within(canvasElement).getByRole("link", { name }),
        "::after",
      );
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(panel.transitionProperty).toBe("none");
      await expect(rule("Nieuws").transitionProperty).toBe("none");
      return;
    }
    // The panel itself fades in (and out) at the Chrome speed, words included.
    await expect(panel.transitionProperty).toContain("opacity");
    await expect(panel.transitionDuration).toBe("0.15s");
    await expect(rule("Nieuws").transitionProperty).toBe("scale");
    await expect(rule("Nieuws").transitionDuration).toBe("0.5s");
    await expect(rule("Nieuws").transitionDelay).toBe("0s");
    // 9 rows: 30ms a row, the last (index 8) starts at 240ms — under the cap.
    await expect(rule("Wedstrijden").transitionDelay).toBe("0.03s");
    await expect(rule("De club").transitionDelay).toBe("0.24s");
  },
};
