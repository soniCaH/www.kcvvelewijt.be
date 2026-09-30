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
 * the primary top node (11 children) — at the dedicated 1024px
 * `kcvvExplorerStage` viewport (review finding 7 — the addon's own
 * `setViewport()` from story `globals`, not a manual `vitest/browser` +
 * `page.viewport()`) it fits unzoomed and overflows once scaled to A++, so
 * the precondition (review finding 3) is asserted outright rather than
 * branched on: a real regression that made the stage overflow already at
 * rest, or never overflow even at A++, both fail this test now, where the
 * old before/after-only version would have silently passed the first case
 * and only caught the second. `!vr`.
 *
 * This story's `globals.viewport` is honoured by BOTH runners now (#3188,
 * review round 2): `@storybook/addon-vitest`'s own `setViewport()` for
 * `pnpm test:storybook`, and `.storybook/test-runner.ts`'s `preVisit` (a
 * `page.setViewportSize` from the same `globals.viewport.value`) for
 * `test-storybook` — so this needs no runner-specific opt-out tag.
 */
export const ZoomOverflowsTheStage: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvExplorerStage" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stage = canvas.getByLabelText("Organigram-verkenner");

    // Precondition, asserted unconditionally: no overflow, no arrow, at
    // rest (scale A). A component regression that overflows already here
    // must fail this test, not silently take the "already overflowing"
    // branch a conditional read would have.
    expect(stage.scrollWidth - stage.clientWidth).toBeLessThanOrEqual(10);
    expect(canvas.queryByLabelText("Scroll right")).not.toBeInTheDocument();

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
    // immediate `remeasureOn` check) is what re-checks correctly here, and
    // the original E2E case's identical `waitForTimeout(500)`.
    await new Promise((resolve) => setTimeout(resolve, 600));
    await waitFor(
      () => {
        expect(stage.scrollWidth - stage.clientWidth).toBeGreaterThan(10);
      },
      { timeout: 3000 },
    );
    await expect(canvas.getByLabelText("Scroll right")).toBeVisible();
  },
};

/**
 * #3310 — the stage is a flex item of the `fixed inset-0` dialog, so its
 * bottom edge must never pass the dialog's. `<ScrollOverlay>`'s outer
 * wrapper is the flex item (only `className` reaches it), so a stage that
 * sizes only its track lets the wrapper grow to the content's height: the
 * track never overflows and the tree runs off the screen, unreachable.
 */
function stageBounds(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const dialog = canvas.getByRole("dialog").getBoundingClientRect();
  const track = canvas.getByLabelText("Organigram-verkenner");
  const stage = (track.parentElement as HTMLElement).getBoundingClientRect();
  return { canvas, dialog, track, stage };
}

/** 320x568 — the tree is taller than the stage, so the track scrolls to reach every control. `!vr`. */
export const StageIsBoundedOnAShortPhone: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvExplorerPhone" } },
  play: async ({ canvasElement }) => {
    const { canvas, dialog, track, stage } = stageBounds(canvasElement);
    expect(stage.bottom).toBeLessThanOrEqual(dialog.bottom);
    expect(track.scrollHeight).toBeGreaterThan(track.clientHeight);

    track.scrollTop = track.scrollHeight;
    const viewportHeight = window.innerHeight;
    for (const control of canvas.getAllByRole("button")) {
      const box = control.getBoundingClientRect();
      // Scrolled to the end, nothing hangs below the screen (the top of the
      // tree has scrolled up out of the track by then — that is the point).
      expect(box.bottom).toBeLessThanOrEqual(viewportHeight);
    }
  },
};

/** 375x667 — the stage used to run 23px past the dialog. `!vr`. */
export const StageIsBoundedOnAPhone: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvMobile" } },
  play: async ({ canvasElement }) => {
    const { dialog, stage } = stageBounds(canvasElement);
    expect(stage.bottom).toBeLessThanOrEqual(dialog.bottom);
  },
};

/** 1440x900 at A++ — the stage still reaches the dialog's bottom, leaving no empty band (the `Opening` fixture's scaled tree fits 810px, so this asserts the bounds, not a vertical scroll — the 320x568 story owns that). `!vr`. */
export const StageFillsTheDialogAtTheLargestZoom: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvExplorerDesktop" } },
  play: async ({ canvasElement }) => {
    const { canvas, dialog, stage } = stageBounds(canvasElement);
    expect(stage.bottom).toBeLessThanOrEqual(dialog.bottom);

    await userEvent.click(canvas.getByRole("button", { name: "A++" }));
    await new Promise((resolve) => setTimeout(resolve, 600));

    const scaled = stageBounds(canvasElement);
    // Stage reaches the dialog's bottom edge (border-2 = 2px) — no empty band.
    expect(scaled.dialog.bottom - scaled.stage.bottom).toBeLessThanOrEqual(2);
  },
};
