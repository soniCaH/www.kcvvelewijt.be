import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ClubBook } from "./ClubBook";
import { clubBookNodes, clubBookPaths } from "./club-book.fixture";
import { CLUB_BOOK_PRINT_CSS } from "./print-style";

const meta = {
  title: "Features/Organigram/ClubBook",
  component: ClubBook,
  parameters: { layout: "padded" },
  args: { nodes: clubBookNodes, responsibilityPaths: clubBookPaths },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof ClubBook>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * VR captures one viewport from the top, so a story about the ledgers drops the
 * key-figure row (no role codes → no cards, no Raad line) and starts at them.
 */
const ledgersOnly = clubBookNodes.map((node) => {
  const { roleCode, description, ...rest } = node;
  void roleCode;
  void description;
  return rest;
});

/** Just the ledgers of one pillar, so an opened row lands inside the captured viewport. */
const onlyPillar = (pillar: string) =>
  ledgersOnly.filter((node) => node.pillar === pillar);

/** Key-figure cards and the Raad line on top, then the four pillars. */
export const Default: Story = {};

/** The four pillars with every row closed — Jeugd with Organisatie and Opleiding. */
export const PillarsClosed: Story = {
  args: { nodes: ledgersOnly },
};

/** One row open: a single holder, with the questions they answer in this role. */
export const RowOpenSingleHolder: Story = {
  args: { nodes: onlyPillar("jeugd-opleiding") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByText("TVJO · Jeugdcoördinator Onderbouw"),
    );
  },
};

/** A shared box opens one card per holder. */
export const RowOpenSharedBox: Story = {
  args: { nodes: onlyPillar("club") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Kledij"));
  },
};

/** Vacant boxes invite with a link to the contact page; there is nothing to unfold. */
export const VacantRows: Story = {
  args: { nodes: onlyPillar("sportief") },
};

/** Boxes an editor has not placed in a pillar yet still show, last. */
export const WithoutPillars: Story = {
  args: {
    nodes: ledgersOnly.map((node) => {
      const { pillar, ...rest } = node;
      void pillar;
      return rest;
    }),
  },
};

/** A phone: the ledger with a shared box unfolded — one card per holder, full width. */
export const OnAPhone: Story = {
  args: { nodes: onlyPillar("jeugd-organisatie") },
  parameters: { vr: { viewports: ["mobile"] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByText("Lid Jeugdbestuur"));
  },
};

/**
 * 320px: the PDF button sits fully inside the viewport, and the page does not
 * scroll sideways. Geometry, so it lives in this play (not in VR, not in E2E).
 */
export const PdfButtonFitsAt320: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvExplorerPhone" } },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Download als PDF",
    });
    const box = button.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
  },
};

/**
 * What goes on paper: the book under `print` media (the test runner emulates it
 * for `parameters.emulateMedia`) with the real print sheet — the same
 * `CLUB_BOOK_PRINT_CSS` the PDF button injects — applied by a decorator, so
 * everything outside the book is hidden and its ancestors stripped exactly as in
 * the PDF. Three key cards across, rows showing names only, no unfolded cards
 * and no button, even with a row open. The tablet viewport (768px) with the
 * page margin as padding stands in for an A4 column; `@page` itself only
 * applies to a real print, which the Playwright PDF check covers.
 */
export const PrintSheet: Story = {
  parameters: { emulateMedia: "print", vr: { viewports: ["tablet"] } },
  decorators: [
    (Story) => (
      <>
        <style media="print">
          {`${CLUB_BOOK_PRINT_CSS} html { padding-inline: 17mm; }`}
        </style>
        <Story />
      </>
    ),
  ],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByText("Kledij"));
  },
};

/** The printed ledgers: names only, in two columns, an open row staying off the paper. */
export const PrintLedgers: Story = {
  ...PrintSheet,
  args: { nodes: ledgersOnly },
};
