import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { PullQuote, type PullQuoteProps } from "./PullQuote";
import { SubjectAvatar } from "../SubjectAvatar";

// Story-only args used for the avatar-layout variants. Serializable so
// the Storybook controls panel can introspect every field — `avatarSlot`
// itself is a `ReactNode` on `PullQuoteProps` and would otherwise be
// uneditable through Controls. The render function below maps these
// flat fields into a `<SubjectAvatar />` and forwards everything else
// to `<PullQuote>`.
interface AvatarStoryArgs extends Omit<PullQuoteProps, "avatarSlot"> {
  avatarFirstName: string;
  avatarFullName?: string;
  avatarPhotoUrl?: string;
}

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
type Story = StoryObj<typeof meta>;
type AvatarStory = StoryObj<AvatarStoryArgs>;

function renderWithAvatar({
  avatarFirstName,
  avatarFullName,
  avatarPhotoUrl,
  ...pullQuoteProps
}: AvatarStoryArgs) {
  return (
    <PullQuote
      {...pullQuoteProps}
      avatarSlot={
        <SubjectAvatar
          firstName={avatarFirstName}
          fullName={avatarFullName}
          photoUrl={avatarPhotoUrl}
          scale="attribution"
        />
      }
    />
  );
}

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

export const ToneInk: Story = {
  args: {
    tone: "ink",
    attribution: { name: "Coach", role: "A-PLOEG" },
    children:
      "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
  },
};

export const ToneJersey: Story = {
  args: {
    tone: "jersey",
    attribution: { name: "Niels", role: "U21" },
    children: "Ik heb hier op tien verschillende posities gespeeld.",
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

export const LongQuote: Story = {
  args: {
    attribution: { name: "Voorzitter", role: "BESTUUR" },
    emphasis: { text: "generatie na generatie" },
    children:
      "Het clubgevoel zit in de kleinste dingen — een kop koffie na de match, een gedeeld pintje, een ouder die zijn kind langs de zijlijn ziet groeien. Dat verkoop je niet, dat bouw je generatie na generatie.",
  },
};

export const WithEmphasis: Story = {
  args: {
    attribution: { name: "Maxim", role: "A-PLOEG" },
    emphasis: { text: "tribune die zingt" },
    children: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
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
    avatarFullName: "Maxim Breugelmans",
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
    avatarFullName: "Anouk De Wit",
  },
  render: renderWithAvatar,
};

// Avatar slot on the ink tone — confirms the cream typography on the
// dark card still reads correctly inside the new two-line attribution
// stack.
export const WithSubjectAvatarToneInk: AvatarStory = {
  args: {
    tone: "ink",
    attribution: {
      name: "Wim Govaerts",
      role: "TRAINER",
      source: "SEIZOEN 25-26",
    },
    children:
      "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
    avatarFirstName: "Wim",
    avatarFullName: "Wim Govaerts",
    avatarPhotoUrl: fixtureImage("staff-portrait", 0),
  },
  render: renderWithAvatar,
};
