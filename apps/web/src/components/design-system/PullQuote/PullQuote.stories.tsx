import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { PullQuote, type PullQuoteProps } from "./PullQuote";
import { SubjectAvatar } from "../SubjectAvatar";

// `Omit` does not distribute over a union — `Omit<PullQuoteProps,
// "avatarSlot">` would flatten the attribution-XOR-labels union into one
// object with both fields simultaneously optional, losing the "never
// both" guarantee `PullQuoteProps` exists to enforce. Distributing `Omit`
// over each union member first (the standard `DistributedOmit` idiom)
// keeps it intact.
type DistributedOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

// Story-only args used for the avatar-layout variants. Serializable so
// the Storybook controls panel can introspect every field — `avatarSlot`
// itself is a `ReactNode` on `PullQuoteProps` and would otherwise be
// uneditable through Controls. The render function below maps these
// flat fields into a `<SubjectAvatar />` and forwards everything else
// to `<PullQuote>`.
type AvatarStoryArgs = DistributedOmit<PullQuoteProps, "avatarSlot"> & {
  avatarFirstName: string;
  avatarPhotoUrl?: string;
};

const meta = {
  title: "UI/PullQuote",
  component: PullQuote,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge max-w-xl border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PullQuote>;

export default meta;
// `StoryObj<typeof meta>` collapses `args` to `never` here: Storybook's
// `ArgsFromMeta` intersects the untyped `decorators` array's inferred arg
// type into the story args type, and that inference doesn't handle a
// component whose props are a discriminated union (attribution XOR
// labels, #2515 rule 4 / code review finding 3) — confirmed via a minimal
// repro reproducing the exact `never` collapse and its fix. Typing
// against the component directly (`StoryObj<typeof PullQuote>`) skips
// that intersection and type-checks correctly; verified `tags` /
// `parameters` / `args` on individual stories all still work.
type Story = StoryObj<typeof PullQuote>;
type AvatarStory = StoryObj<AvatarStoryArgs>;

const renderWithAvatar = ({
  avatarFirstName,
  avatarPhotoUrl,
  ...pullQuoteProps
}: AvatarStoryArgs) => {
  return (
    <PullQuote
      {...pullQuoteProps}
      avatarSlot={
        <SubjectAvatar
          firstName={avatarFirstName}
          photoUrl={avatarPhotoUrl}
          scale="attribution"
        />
      }
    />
  );
};

export const Playground: Story = {
  args: {
    attribution: { name: "Maxim Breugelmans" },
    children: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
  },
};

export const WithRoleAndSource: Story = {
  args: {
    attribution: {
      name: "Jonas Willems",
      role: "B-PLOEG",
      source: "INTERVIEW",
    },
    children: "Geen drama. Gewoon doorgaan en zondag de drie pakken.",
  },
};

// Tone is derived from `placement`, never authored directly (#2515 rule 5).
export const PlacementSection: Story = {
  args: {
    placement: "section",
    attribution: { name: "Coach", role: "A-PLOEG" },
    children:
      "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
  },
};

export const PlacementAside: Story = {
  args: {
    placement: "aside",
    attribution: { name: "Niels", role: "U21" },
    children: "Ik heb hier op tien verschillende posities gespeeld.",
  },
};

// Default placement ("flow") — cream, in the flow among paragraphs.
// Renders the identical code path as Playground (flow is the default, and
// name-only attribution is already covered three times over) — kept for
// autodocs completeness only, not VR-tagged (zero pixel delta from
// Playground, verified by direct PNG comparison).
export const PlacementFlow: Story = {
  tags: ["autodocs"],
  args: {
    placement: "flow",
    attribution: { name: "Maxim", role: "A-PLOEG" },
    children: "Geen drama. Gewoon doorgaan en zondag de drie pakken.",
  },
};

export const Rotated: Story = {
  args: {
    rotation: "b",
    tape: [{ color: "jersey", length: "lg" }],
    attribution: { name: "Maxim" },
    children: "Een tribune die zingt is meer waard.",
  },
};

// Long body wraps across multiple lines inside the card without breaking
// the layout.
export const LongQuote: Story = {
  args: {
    attribution: { name: "Voorzitter", role: "BESTUUR" },
    children:
      "Het clubgevoel zit in de kleinste dingen — een kop koffie na de match, een gedeeld pintje, een ouder die zijn kind langs de zijlijn ziet groeien. Dat verkoop je niet, dat bouw je generatie na generatie.",
  },
};

// State coverage (#2566) — the three states every consumer must cover:
// with attribution, without attribution (context labels instead), and the
// null path (neither — a nameless quote with nothing else that quotes).
export const WithLabelsNoAttribution: Story = {
  args: {
    placement: "section",
    labels: [
      { label: "de jeugdvisie" },
      { label: "plezier" },
      { label: "techniek" },
      { label: "teamspirit" },
    ],
    children:
      "Bij KCVV Elewijt staat plezier op één. Wie graag speelt, leert vanzelf — techniek, teamspirit en respect groeien mee.",
  },
};

export const NullPathNoAttributionNoLabels: Story = {
  args: {
    // Explicit `undefined` (not an omitted prop) — required by
    // PullQuoteProps' attribution-XOR-labels union.
    attribution: undefined,
    children: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
  },
};

// A CMS blockquote — the object this ticket's rule 2 makes the CMS block
// render as, with a `children` ReactNode standing in for the rich Portable
// Text output (marks already applied upstream) rather than a plain string.
// Not VR-tagged: the <em> sits inside an already-italic font-display
// blockquote, so the mark is invisible to a screenshot (covered by unit
// tests instead) — kept for autodocs completeness only.
export const AsBlockquote: Story = {
  tags: ["autodocs"],
  args: {
    attribution: undefined,
    children: (
      <>
        Het clubgevoel zit in de kleinste dingen —{" "}
        <em>een kop koffie na de match</em>.
      </>
    ),
  },
};

// 5.d2-locked attribution layout: 64px photo + italic display name +
// mono caps role/source line beneath. The avatar slot is opt-in — the
// caller supplies <SubjectAvatar scale="attribution" /> with the
// subject's photo and first name. Args are flat + serializable so the
// Controls panel can edit each field; `renderWithAvatar` composes them.
export const WithSubjectAvatar: AvatarStory = {
  args: {
    attribution: { name: "Maxim Breugelmans", role: "A-PLOEG" },
    children: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
    avatarFirstName: "Maxim",
    avatarPhotoUrl: fixtureImage("player-portrait", 0),
  },
  render: renderWithAvatar,
};

// Avatar slot when the subject has no photo — the monogram fallback
// fills the 64px disc. Same layout, just the photo path falls through
// to the monogram path.
export const WithSubjectAvatarMonogramFallback: AvatarStory = {
  args: {
    attribution: { name: "Anouk De Wit", role: "BESTUUR" },
    children:
      "We bouwen geen succesverhaal in één seizoen — we bouwen een club voor de volgende vijftig jaar.",
    avatarFirstName: "Anouk",
  },
  render: renderWithAvatar,
};

// Avatar slot on the ink tone (placement="section") — confirms the cream
// typography on the dark card still reads correctly inside the new
// two-line attribution stack.
export const WithSubjectAvatarToneInk: AvatarStory = {
  args: {
    placement: "section",
    attribution: {
      name: "Wim Govaerts",
      role: "TRAINER",
      source: "SEIZOEN 25-26",
    },
    children:
      "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
    avatarFirstName: "Wim",
    avatarPhotoUrl: fixtureImage("staff-portrait", 0),
  },
  render: renderWithAvatar,
};
