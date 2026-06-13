import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PrivacyPage from "./page";

/**
 * Design reference for the Phase 8 (8p1) cream-minimal `/privacy` reskin:
 * mono kicker → serif `<EditorialHeading>` title → mono last-updated line →
 * Freight Display intro lead → cream/ink prose column with a `<DottedDivider>`
 * between H2 sections.
 *
 * `Pages/*` stories are design references only and are intentionally **not**
 * VR-tagged — page-composition correctness is the e2e suite's job
 * (`docs/prd/page-level-testing-rework.md`). The privacy page is a pure,
 * synchronous server component with no data dependencies, so it renders
 * directly here.
 */
const meta = {
  title: "Pages/Privacy",
  component: PrivacyPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PrivacyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
