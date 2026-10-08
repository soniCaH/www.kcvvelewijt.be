import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";
import { YouthDirectory } from "./YouthDirectory";
import { reservenTeam, youthTeam as team } from "./youth-directory.fixtures";

// Local committed asset (Storybook `staticDirs`) so the squad-photo polaroid is
// deterministic in VR. Teams without it render the <JerseyShirt> fallback.
const PHOTO = "/images/ultras.jpg";

/**
 * The reserves — no age range, so the heading renders bare, and no age code, so
 * the card captions by name over an initialled jersey (#2414). The one team in
 * the directory with a published reeks, so the only card with a sub-line.
 */
const reserven: YouthDivisionGroup = {
  label: "Reserven",
  teams: [reservenTeam()],
};

const divisions: YouthDivisionGroup[] = [
  reserven,
  {
    label: "Onderbouw",
    range: "U6–U11",
    teams: [
      team("U6", PHOTO),
      team("U7"),
      team("U8"),
      team("U9"),
      team("U11", PHOTO),
    ],
  },
  {
    label: "Middenbouw",
    range: "U12–U16",
    teams: [team("U13", PHOTO), team("U15", PHOTO)],
  },
  {
    label: "Bovenbouw",
    range: "U17–U21",
    teams: [team("U17", PHOTO), team("U19"), team("U21", PHOTO)],
  },
];

const meta = {
  title: "Features/Teams/YouthDirectory",
  component: YouthDirectory,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof YouthDirectory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `/jeugd` — the reserves lead, then the three age divisions small → large
 * (#3427), under the youth heading that route passes.
 */
export const FullDirectory: Story = {
  args: { heading: "Jeugdwerking", divisions },
};

/**
 * Sparse — one division with members, empty groups omitted.
 *
 * It also carries the heading `/ploegen` passes, where the list holds the
 * teams the two flagships above it leave out and so cannot claim to be the
 * youth section (#2641). Both live headings are then in the baselines without
 * a third story: the teams-index register is pixel-identical to
 * `FullDirectory` apart from this string, which the unit tests assert.
 */
export const SparseDirectory: Story = {
  args: {
    heading: "Andere",
    divisions: [
      { label: "Reserven", teams: [] },
      { label: "Onderbouw", range: "U6–U11", teams: [] },
      { label: "Middenbouw", range: "U12–U16", teams: [team("U13")] },
      { label: "Bovenbouw", range: "U17–U21", teams: [] },
    ],
  },
};

/**
 * Bovenbouw in frame, on its own.
 *
 * `FullDirectory` puts Bovenbouw fourth since the small → large order
 * (#3427), below the fold on every VR viewport (1440×900 / 768×1024 /
 * 375×667 — none scroll), and `SparseDirectory` only ever populates
 * Middenbouw — so without this story the `jersey-deep` tone (Bovenbouw's)
 * would have zero VR coverage. Before #3427 the same gap sat on Onderbouw's
 * `warning` tone (#2615 code review); that one is now in `FullDirectory`.
 */
export const BovenbouwFocus: Story = {
  args: {
    heading: "Andere",
    divisions: [
      { label: "Reserven", teams: [] },
      { label: "Onderbouw", range: "U6–U11", teams: [] },
      { label: "Middenbouw", range: "U12–U16", teams: [] },
      { label: "Bovenbouw", range: "U17–U21", teams: [team("U19")] },
    ],
  },
};
