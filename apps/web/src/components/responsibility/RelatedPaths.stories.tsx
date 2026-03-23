import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RelatedPaths } from "./RelatedPaths";

const meta: Meta<typeof RelatedPaths> = {
  title: "Features/Responsibility/RelatedPaths",
  component: RelatedPaths,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResults: Story = {
  args: { sanityId: "doc-abc" },
  parameters: {
    mockData: [
      {
        url: "/api/related?id=doc-abc&limit=3",
        method: "GET",
        status: 200,
        response: [
          {
            id: "doc-def",
            slug: "blessure-melden",
            type: "responsibilityPath",
            score: 0.85,
            title: "Blessure melden",
            excerpt: "Hoe meld je een blessure bij de club?",
          },
          {
            id: "doc-ghi",
            slug: "verzekering-aanvragen",
            type: "responsibilityPath",
            score: 0.78,
            title: "Verzekering aanvragen",
            excerpt: "Stappen voor het aanvragen van een sportverz...",
          },
          {
            id: "doc-jkl",
            slug: "nieuws-medisch",
            type: "article",
            score: 0.65,
            title: "Medische begeleiding vernieuwd",
            excerpt: "De club investeert in...",
          },
        ],
      },
    ],
  },
};

export const Empty: Story = {
  args: { sanityId: "doc-no-results" },
  parameters: {
    mockData: [
      {
        url: "/api/related?id=doc-no-results&limit=3",
        method: "GET",
        status: 200,
        response: [],
      },
    ],
  },
};
