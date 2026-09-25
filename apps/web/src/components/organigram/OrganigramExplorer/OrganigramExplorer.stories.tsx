import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, within, userEvent, expect, waitFor } from "storybook/test";
import { OrganigramExplorer } from "./OrganigramExplorer";
import { explorerFixture } from "./organigram-explorer.fixture";

const meta = {
  title: "Features/Organigram/OrganigramExplorer",
  component: OrganigramExplorer,
  parameters: { layout: "fullscreen" },
  args: { nodes: explorerFixture, open: true, onClose: fn() },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof OrganigramExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default opening view — lands on the primary top node (Voorzitter, 11 children). */
export const Opening: Story = {};

/** The synthetic club root — reachable via the breadcrumb; shows both top lines (GC + Voorzitter). */
export const ClubRoot: Story = {
  args: { initialFocusId: "club" },
};

/** A deep + wide node (TVJO, 12 children at level 4) — count-then-expand fan + breadcrumb. */
export const DeepWideNode: Story = {
  args: { initialFocusId: "tvjo" },
};

/** A node with many siblings — the sibling cycler + "n / N" indicator. */
export const ManySiblings: Story = {
  args: { initialFocusId: "secretaris" },
};

/** A vacant position centred — warm recruit chrome, no profile link. */
export const VacantNode: Story = {
  args: { initialFocusId: "ouderraad" },
};

/** A shared position centred — "N personen". */
export const SharedNode: Story = {
  args: { initialFocusId: "kledij" },
};

/**
 * Phase 4 (#2055) "trigger + consolidate": with `onOpenMember` wired, the centred
 * node shows a "Contactgegevens" trigger (opens the `<MemberDetailPanel>` over the
 * verkenner) instead of the inline profile link + shared-member list.
 */
export const WithContactTrigger: Story = {
  args: { onOpenMember: fn() },
};

/**
 * Re-homed from `apps/web/test/e2e/scroll-arrows.spec.ts`'s "organigram
 * explorer stage" case (#3146, deleted by this ticket) — review finding
 * #2577 part 6: the zoom control applies a CSS `transform: scale()` to the
 * stage's tree, which never changes the stage's own border box, so
 * `<ScrollOverlay>`'s `remeasureOn={[scaleStep]}` (a `transitionend`-driven
 * re-check, not a `ResizeObserver` one — a transform fires neither) is what
 * makes the arrow track a zoom-driven overflow at all. `Opening` lands on
 * the primary top node (11 children) — wide enough that zooming to A++
 * (scale 1.3) overflows a 1024px stage; asserted as a before/after change
 * rather than an absolute "not overflowing at A" reading, so this does not
 * depend on the exact default browser-project viewport. `!vr`: dynamically
 * imports `vitest/browser` to force the 1024px width the original E2E case
 * used — a top-level import would break every `vr`-tagged story in this
 * file under `test-storybook`/`storybook dev` (see the identical note on
 * `StandingsTable.stories.tsx`).
 */
export const ZoomOverflowsTheStage: Story = {
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    await page.viewport(1024, 800);

    try {
      const canvas = within(canvasElement);
      const stage = canvas.getByLabelText("Organigram-verkenner");

      const overflowsAtRest = stage.scrollWidth - stage.clientWidth > 10;
      if (overflowsAtRest) {
        await expect(canvas.getByLabelText("Scroll right")).toBeVisible();
      } else {
        expect(canvas.queryByLabelText("Scroll right")).not.toBeInTheDocument();
      }

      await userEvent.click(
        // `exact` defaults to `true` already — "A++" would otherwise also
        // substring-match "A"/"A+", but the default string comparison is
        // exact, so no explicit option is needed (and `storybook/test`'s
        // `ByRoleOptions` type doesn't carry the `exact` field at all).
        canvas.getByRole("button", { name: "A++" }),
      );

      // The 300ms `transition-transform` must settle before `scrollWidth`
      // reflects the target scale — mirrors `OrganigramExplorer.tsx`'s own
      // comment on why `useScrollHint`'s `transitionend` listener (not its
      // immediate `remeasureOn` check) is what re-checks correctly here,
      // and the original E2E case's identical `waitForTimeout(500)`.
      await new Promise((resolve) => setTimeout(resolve, 600));
      await waitFor(
        () => {
          expect(stage.scrollWidth - stage.clientWidth).toBeGreaterThan(10);
        },
        { timeout: 3000 },
      );
      await expect(canvas.getByLabelText("Scroll right")).toBeVisible();
    } finally {
      await page.viewport(originalWidth, originalHeight);
    }
  },
};
