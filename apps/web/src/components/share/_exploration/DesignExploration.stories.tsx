import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StyleA_StackedType } from "./StyleA_StackedType";
import { StyleB_SplitPanel } from "./StyleB_SplitPanel";
import { StyleC_VintageSportsCard } from "./StyleC_VintageSportsCard";
import { Round2_Ripped } from "./Round2_Ripped";
import { Round2_Burst } from "./Round2_Burst";
import { Round2_Bands } from "./Round2_Bands";
import { Round3_Ripped } from "./Round3_Ripped";
import { Round3_Diagonal } from "./Round3_Diagonal";
import { Round3_Frame } from "./Round3_Frame";
import { Round4_TopBlob } from "./Round4_TopBlob";
import { Round4_SideBlob } from "./Round4_SideBlob";
import { Round4_TornDown } from "./Round4_TornDown";
import { Round5_TornLeft } from "./Round5_TornLeft";

/**
 * Design exploration — style directions for the KCVV match story templates.
 * Each story shows a Goal (KCVV) template as the reference event.
 * Pick a winner, then we apply it across all 9 templates.
 *
 * Round 1: initial directions (Style A/B/C)
 * Round 2: more energy — Ripped / Burst / Bands
 * Round 3: refined — Ripped / Diagonal / Frame
 * Round 4: style.jpg + style2.jpg inspired — TopBlob / SideBlob / TornDown
 * Round 5: convergence — TornLeft (TornDown layout + SideBlob left-aligned text)
 */
const meta = {
  title: "Features/Share/_DesignExploration",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const BASE_ARGS = {
  playerName: "Kevin Van Ransbeeck",
  shirtNumber: 10,
  score: "1 - 0",
  matchName: "KCVV Elewijt — FC Opponent",
  minute: "45",
};

const WITH_PHOTO = {
  ...BASE_ARGS,
  celebrationImageUrl:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
};

// ─── Round 5 ────────────────────────────────────────────────────────────────

/** R5 — TORN LEFT: full-bleed photo, left text, torn edge, green zone info (with photo) */
export const R5_TornLeft_WithPhoto: Story = {
  render: () => <Round5_TornLeft {...WITH_PHOTO} />,
};

/** R5 — TORN LEFT: no photo variant */
export const R5_TornLeft_NoPhoto: Story = {
  render: () => <Round5_TornLeft {...BASE_ARGS} />,
};

// ─── Round 4 ────────────────────────────────────────────────────────────────

/** R4 — TOP BLOB: black bg, photo in organic top blob, ink shard explosion (with photo) */
export const R4_TopBlob_WithPhoto: Story = {
  render: () => <Round4_TopBlob {...WITH_PHOTO} />,
};

/** R4 — TOP BLOB: no photo variant */
export const R4_TopBlob_NoPhoto: Story = {
  render: () => <Round4_TopBlob {...BASE_ARGS} />,
};

/** R4 — SIDE BLOB: dark bg, GOAL punches into right photo blob (with photo) */
export const R4_SideBlob_WithPhoto: Story = {
  render: () => <Round4_SideBlob {...WITH_PHOTO} />,
};

/** R4 — SIDE BLOB: no photo variant */
export const R4_SideBlob_NoPhoto: Story = {
  render: () => <Round4_SideBlob {...BASE_ARGS} />,
};

/** R4 — TORN DOWN: photo top 40%, GOAL straddles torn edge into green zone (with photo) */
export const R4_TornDown_WithPhoto: Story = {
  render: () => <Round4_TornDown {...WITH_PHOTO} />,
};

/** R4 — TORN DOWN: no photo variant */
export const R4_TornDown_NoPhoto: Story = {
  render: () => <Round4_TornDown {...BASE_ARGS} />,
};

// ─── Round 3 ────────────────────────────────────────────────────────────────

/** R3 — RIPPED: #008755 bg, black torn panel, Quasimoda, white+green (with photo) */
export const R3_Ripped_WithPhoto: Story = {
  render: () => <Round3_Ripped {...WITH_PHOTO} />,
};

/** R3 — RIPPED: no photo variant */
export const R3_Ripped_NoPhoto: Story = {
  render: () => <Round3_Ripped {...BASE_ARGS} />,
};

/** R3 — DIAGONAL: dark green / black split with bright green cut (with photo) */
export const R3_Diagonal_WithPhoto: Story = {
  render: () => <Round3_Diagonal {...WITH_PHOTO} />,
};

/** R3 — DIAGONAL: no photo variant */
export const R3_Diagonal_NoPhoto: Story = {
  render: () => <Round3_Diagonal {...BASE_ARGS} />,
};

/** R3 — FRAME: player fills frame, dark green bars top+bottom, GOAL bursts through (with photo) */
export const R3_Frame_WithPhoto: Story = {
  render: () => <Round3_Frame {...WITH_PHOTO} />,
};

/** R3 — FRAME: no photo variant (dark green radial with pattern) */
export const R3_Frame_NoPhoto: Story = {
  render: () => <Round3_Frame {...BASE_ARGS} />,
};

// ─── Round 2 ────────────────────────────────────────────────────────────────

/** R2 — RIPPED: torn panel, green text blasts through (with photo) */
export const R2_Ripped_WithPhoto: Story = {
  render: () => <Round2_Ripped {...WITH_PHOTO} />,
};

/** R2 — RIPPED: torn panel, green text blasts through (no photo) */
export const R2_Ripped_NoPhoto: Story = {
  render: () => <Round2_Ripped {...BASE_ARGS} />,
};

/** R2 — BURST: neon green spotlight, player glows (with photo) */
export const R2_Burst_WithPhoto: Story = {
  render: () => <Round2_Burst {...WITH_PHOTO} />,
};

/** R2 — BURST: neon green spotlight, player glows (no photo) */
export const R2_Burst_NoPhoto: Story = {
  render: () => <Round2_Burst {...BASE_ARGS} />,
};

/** R2 — BANDS: kinetic stacked GOAL bands, score circle centerpiece (with photo) */
export const R2_Bands_WithPhoto: Story = {
  render: () => <Round2_Bands {...WITH_PHOTO} />,
};

/** R2 — BANDS: kinetic stacked GOAL bands, score circle centerpiece (no photo) */
export const R2_Bands_NoPhoto: Story = {
  render: () => <Round2_Bands {...BASE_ARGS} />,
};

// ─── Round 1 (kept for reference) ───────────────────────────────────────────

/** Style A — Stacked Type (with celebration photo) */
export const StyleA_WithPhoto: Story = {
  render: () => <StyleA_StackedType {...WITH_PHOTO} />,
};

/** Style A — Stacked Type (no photo — shirt number variant) */
export const StyleA_NoPhoto: Story = {
  render: () => <StyleA_StackedType {...BASE_ARGS} />,
};

/** Style B — Split Panel (with celebration photo) */
export const StyleB_WithPhoto: Story = {
  render: () => <StyleB_SplitPanel {...WITH_PHOTO} />,
};

/** Style B — Split Panel (no photo — placeholder variant) */
export const StyleB_NoPhoto: Story = {
  render: () => <StyleB_SplitPanel {...BASE_ARGS} />,
};

/** Style C — Vintage Sports Card (with celebration photo) */
export const StyleC_WithPhoto: Story = {
  render: () => <StyleC_VintageSportsCard {...WITH_PHOTO} />,
};

/** Style C — Vintage Sports Card (no photo — silhouette variant) */
export const StyleC_NoPhoto: Story = {
  render: () => <StyleC_VintageSportsCard {...BASE_ARGS} />,
};
