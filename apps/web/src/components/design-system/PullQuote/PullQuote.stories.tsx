import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PullQuote } from "./PullQuote";
import { SubjectAvatar } from "../SubjectAvatar";

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
// subject's photo and first name.
export const WithSubjectAvatar: Story = {
  args: {
    attribution: { name: "Maxim Breugelmans", role: "A-PLOEG" },
    children: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
    avatarSlot: (
      <SubjectAvatar
        firstName="Maxim"
        fullName="Maxim Breugelmans"
        photoUrl="https://picsum.photos/seed/pullquote-photo/128/128"
        scale="attribution"
      />
    ),
  },
};

// Avatar slot when the subject has no photo — the monogram fallback
// fills the 64px disc. Same layout, just the photo path falls through
// to the monogram path.
export const WithSubjectAvatarMonogramFallback: Story = {
  args: {
    attribution: { name: "Anouk De Wit", role: "BESTUUR" },
    children:
      "We bouwen geen succesverhaal in één seizoen — we bouwen een club voor de volgende vijftig jaar.",
    avatarSlot: (
      <SubjectAvatar
        firstName="Anouk"
        fullName="Anouk De Wit"
        scale="attribution"
      />
    ),
  },
};

// Avatar slot on the ink tone — confirms the cream typography on the
// dark card still reads correctly inside the new two-line attribution
// stack.
export const WithSubjectAvatarToneInk: Story = {
  args: {
    tone: "ink",
    attribution: {
      name: "Wim Govaerts",
      role: "TRAINER",
      source: "SEIZOEN 25-26",
    },
    children:
      "We hebben de kleedkamer in de derde minuut weer wakker gekregen.",
    avatarSlot: (
      <SubjectAvatar
        firstName="Wim"
        fullName="Wim Govaerts"
        photoUrl="https://picsum.photos/seed/wim-pullquote/128/128"
        scale="attribution"
      />
    ),
  },
};
