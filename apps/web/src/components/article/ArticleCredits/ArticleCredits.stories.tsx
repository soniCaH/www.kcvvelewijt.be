import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";
import { ArticleCredits } from "./ArticleCredits";

const meta = {
  title: "Article/ArticleCredits",
  component: ArticleCredits,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Net-new Phase 5 closing credits block (5.d-int Round 2 lock). Centered framed block with 1px ink rules top + bottom, prose width. Four optional rows in fixed order: `Door · Met · Beeld · Gepubliceerd`. Each row drops when its source field is blank.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArticleCredits>;

export default meta;
type Story = StoryObj<typeof meta>;

const TWO_SUBJECTS: IndexedSubject[] = [
  {
    _key: "s-1",
    kind: "player",
    playerRef: { firstName: "Lars", lastName: "Janssens", jerseyNumber: 9 },
  },
  {
    _key: "s-2",
    kind: "player",
    playerRef: { firstName: "Niels", lastName: "Peeters", jerseyNumber: 8 },
  },
];

const ONE_SUBJECT: IndexedSubject[] = TWO_SUBJECTS.slice(0, 1);

const ISO_DATE = "2026-05-17T12:00:00Z";

// Fully populated — all four rows render.
export const AllFields: Story = {
  args: {
    author: "Tom De Smet",
    photographer: "An Verheyden",
    subjects: TWO_SUBJECTS,
    publishedAt: ISO_DATE,
  },
};

// Interview minimum — Met + Gepubliceerd only. Drops Door + Beeld
// because the editor didn't fill them; the credits block still renders
// because subjects[] is required on interviews.
export const InterviewMinimum: Story = {
  args: {
    subjects: ONE_SUBJECT,
    publishedAt: ISO_DATE,
  },
};

// Author present, no photographer. Common shape on a column / opinion
// piece where the author is known but no photo credit exists.
export const NoPhotographer: Story = {
  args: {
    author: "Tom De Smet",
    subjects: ONE_SUBJECT,
    publishedAt: ISO_DATE,
  },
};

// Photographer present, no author. Common shape on a transfer
// announcement where the photo credit matters more than the byline.
export const NoAuthor: Story = {
  args: {
    photographer: "An Verheyden",
    subjects: ONE_SUBJECT,
    publishedAt: ISO_DATE,
  },
};

// Duo interview — Met joins two names with a comma + space.
export const DuoSubjects: Story = {
  args: {
    author: "Tom De Smet",
    photographer: "An Verheyden",
    subjects: TWO_SUBJECTS,
    publishedAt: ISO_DATE,
  },
};

// All fields blank — returns null. Storybook renders an empty stage
// (the decorator background is still visible) which is the expected
// defensive behaviour: the page-level template should not even mount
// `<ArticleCredits />` in this case, but the component itself doesn't
// crash on it.
export const NoFields: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Defensive: with every field blank, the component returns `null` and renders nothing. The page wrapper is expected to skip the block in this state; this story documents the no-crash baseline.",
      },
    },
  },
};
