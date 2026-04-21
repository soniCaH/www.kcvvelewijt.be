import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SubjectAttribution, SubjectPhoto } from "./SubjectAttribution";
import type { SubjectValue } from "./resolveSubject";

const playerSubject: SubjectValue = {
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    transparentImageUrl: null,
    psdImageUrl:
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&q=80",
  },
};

const staffSubject: SubjectValue = {
  kind: "staff",
  staffRef: {
    firstName: "Jeroen",
    lastName: "Van den Berghe",
    functionTitle: "Hoofdcoach A-ploeg",
    photoUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
  },
};

const customSubject: SubjectValue = {
  kind: "custom",
  customName: "Luc Janssens",
  customRole: "Oud-speler",
  customPhotoUrl:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80",
};

const meta = {
  title: "Features/Articles/SubjectAttribution",
  component: SubjectAttribution,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof SubjectAttribution>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  args: { subject: playerSubject, variant: "quote" },
  render: () => (
    <div className="flex flex-col gap-10 bg-[var(--color-foundation-gray-light)] p-12">
      <Row label="player — quote">
        <SubjectAttribution subject={playerSubject} variant="quote" />
      </Row>
      <Row label="player — key">
        <SubjectAttribution subject={playerSubject} variant="key" />
      </Row>
      <Row label="staff — quote">
        <SubjectAttribution subject={staffSubject} variant="quote" />
      </Row>
      <Row label="staff — key">
        <SubjectAttribution subject={staffSubject} variant="key" />
      </Row>
      <Row label="custom — quote">
        <SubjectAttribution subject={customSubject} variant="quote" />
      </Row>
      <Row label="custom — key">
        <SubjectAttribution subject={customSubject} variant="key" />
      </Row>
    </div>
  ),
};

export const PhotoBoundedBox: Story = {
  args: { subject: playerSubject, variant: "quote" },
  render: () => (
    <div className="flex gap-8 bg-white p-8">
      <Column label="player (psdImage)">
        <SubjectPhoto subject={playerSubject} className="w-[200px]" />
      </Column>
      <Column label="staff (photo)">
        <SubjectPhoto subject={staffSubject} className="w-[200px]" />
      </Column>
      <Column label="custom (customPhoto)">
        <SubjectPhoto subject={customSubject} className="w-[200px]" />
      </Column>
    </div>
  ),
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

function Column({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      {children}
    </div>
  );
}
