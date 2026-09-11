import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HtmlTableBlock } from "./HtmlTableBlock";

const SCHEDULE_TABLE_HTML = `
<table>
  <thead>
    <tr>
      <th>Datum</th>
      <th>Tegenstander</th>
      <th>Locatie</th>
      <th>Uitslag</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Za 12 jul</td><td><strong>KCVV Elewijt A</strong></td><td>Uit</td><td>2-1</td></tr>
    <tr><td>Za 19 jul</td><td>SK Berg</td><td>Thuis</td><td>3-0</td></tr>
    <tr><td>Za 26 jul</td><td>FC Diest</td><td>Uit</td><td>1-1</td></tr>
    <tr><td>Za 2 aug</td><td>KFC Boechout</td><td>Thuis</td><td>3-1</td></tr>
    <tr><td>Za 9 aug</td><td>RC Mechelen</td><td>Uit</td><td>0-2</td></tr>
  </tbody>
</table>
`;

const WIDE_TABLE_HTML = `
<table>
  <thead>
    <tr>
      <th>Speler</th><th>#</th><th>Positie</th><th>M</th><th>G</th><th>A</th><th>GK</th><th>RK</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Lars Janssens</td><td>9</td><td>Aanvaller</td><td>22</td><td>14</td><td>5</td><td>3</td><td>0</td></tr>
    <tr><td>Niels Peeters</td><td>8</td><td>Middenvelder</td><td>24</td><td>4</td><td>11</td><td>6</td><td>1</td></tr>
    <tr><td>Wim Govaerts</td><td>6</td><td>Middenvelder</td><td>23</td><td>2</td><td>8</td><td>9</td><td>0</td></tr>
    <tr><td>Tom De Smet</td><td>4</td><td>Verdediger</td><td>21</td><td>1</td><td>2</td><td>11</td><td>2</td></tr>
    <tr><td>An Verheyden</td><td>1</td><td>Doelman</td><td>24</td><td>0</td><td>0</td><td>2</td><td>0</td></tr>
  </tbody>
</table>
`;

const SINGLE_COL_TABLE_HTML = `
<table>
  <thead><tr><th>Verzamelplaats</th></tr></thead>
  <tbody>
    <tr><td>Sportpark Elewijt</td></tr>
    <tr><td>Parking achterzijde</td></tr>
    <tr><td>Kantine begane grond</td></tr>
  </tbody>
</table>
`;

const NO_THEAD_TABLE_HTML = `
<table>
  <tbody>
    <tr><td>Sleutelhouder</td><td>Anouk De Wit</td></tr>
    <tr><td>Telefoon</td><td>0473 12 34 56</td></tr>
    <tr><td>E-mail</td><td>info@kcvvelewijt.be</td></tr>
  </tbody>
</table>
`;

const CAPTIONED_TABLE_HTML = `
<table>
  <caption>Poule A</caption>
  <thead><tr><th>Datum</th><th>Tegenstander</th></tr></thead>
  <tbody>
    <tr><td>Za 12 jul</td><td>VK Veltem</td></tr>
    <tr><td>Za 19 jul</td><td>SK Berg</td></tr>
  </tbody>
</table>
`;

const meta = {
  title: "Features/Articles/Blocks/HtmlTableBlock",
  component: HtmlTableBlock,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The quiet skin (#2582, reversing the fileattachment-htmltable-locked §5.2 card). Extracted from `<SanityArticleBody>`. Shares `<StandingsTable>`'s register — mono on cream, `border-b-2` ink under the header, `border-b` paper-edge between rows, no frame — and anchors nothing (#2476 rule 3: only a typed table knows what a column means). On real overflow: a control-register (32×32, jersey-deep) right arrow overlays the edge with no reserved rail, and the edge fade is capped at `min(24px, remaining)` rather than a fixed width (#2444, as amended by #2476/#2577).",
      },
    },
  },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream max-w-[680px] p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HtmlTableBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Schedule: Story = {
  name: "Schedule (5 rows × 4 cols)",
  args: { html: SCHEDULE_TABLE_HTML },
};

export const Wide: Story = {
  name: "Wide table (8 cols — horizontal scroll)",
  args: { html: WIDE_TABLE_HTML },
};

export const SingleColumn: Story = {
  name: "Single column",
  args: { html: SINGLE_COL_TABLE_HTML },
};

export const WithoutThead: Story = {
  name: "Without <thead>",
  args: { html: NO_THEAD_TABLE_HTML },
};

/** A `<caption>` renders in the kicker register — font-mono, uppercase,
 *  ink-muted, left-aligned — instead of the browser-default centred text
 *  (#2476 rule 8; three published tables ship one, e.g. "Poule A"). */
export const WithCaption: Story = {
  name: "With <caption> (kicker register)",
  args: { html: CAPTIONED_TABLE_HTML },
};

export const Empty: Story = {
  name: "Empty / whitespace-only (returns null)",
  args: { html: "   " },
};

export const MobileNarrow: Story = {
  name: "Mobile — narrow viewport (375px)",
  args: { html: WIDE_TABLE_HTML },
  // Locks the wide-table scroll behaviour at narrow width (#2803).
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};
