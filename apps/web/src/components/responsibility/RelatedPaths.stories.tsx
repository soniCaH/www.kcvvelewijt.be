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
            type: "responsibility",
            score: 0.85,
            title: "Blessure melden",
            excerpt: "Hoe meld je een blessure bij de club?",
          },
          {
            id: "doc-ghi",
            slug: "verzekering-aanvragen",
            type: "responsibility",
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

export const SingleResult: Story = {
  args: { sanityId: "doc-single" },
  parameters: {
    mockData: [
      {
        url: "/api/related?id=doc-single&limit=3",
        method: "GET",
        status: 200,
        response: [
          {
            id: "doc-one",
            slug: "contact-info",
            type: "article",
            score: 0.9,
            title: "Contactgegevens",
            excerpt: "Neem contact op met de club",
          },
        ],
      },
    ],
  },
};

export const AllSameType: Story = {
  args: { sanityId: "doc-same" },
  parameters: {
    mockData: [
      {
        url: "/api/related?id=doc-same&limit=3",
        method: "GET",
        status: 200,
        response: [
          {
            id: "doc-r1",
            slug: "stap-1",
            type: "responsibility",
            score: 0.88,
            title: "Stap 1: Aanmelden",
            excerpt: "Hoe meld je je aan?",
          },
          {
            id: "doc-r2",
            slug: "stap-2",
            type: "responsibility",
            score: 0.82,
            title: "Stap 2: Documenten",
            excerpt: "Welke documenten heb je nodig?",
          },
          {
            id: "doc-r3",
            slug: "stap-3",
            type: "responsibility",
            score: 0.76,
            title: "Stap 3: Betaling",
            excerpt: "Hoe betaal je het lidgeld?",
          },
        ],
      },
    ],
  },
};

export const MaxResults: Story = {
  args: { sanityId: "doc-max" },
  parameters: {
    mockData: [
      {
        url: "/api/related?id=doc-max&limit=3",
        method: "GET",
        status: 200,
        response: [
          {
            id: "doc-m1",
            slug: "blessure-melden",
            type: "responsibility",
            score: 0.92,
            title: "Blessure melden",
            excerpt: "Hoe meld je een blessure bij de club?",
          },
          {
            id: "doc-m2",
            slug: "nieuws-medisch",
            type: "article",
            score: 0.85,
            title: "Medische begeleiding",
            excerpt: "De club investeert in medische begeleiding",
          },
          {
            id: "doc-m3",
            slug: "verzekering",
            type: "responsibility",
            score: 0.78,
            title: "Verzekering aanvragen",
            excerpt: "Stappen voor sportverzekeringsaanvraag",
          },
          {
            id: "doc-m4",
            slug: "revalidatie",
            type: "article",
            score: 0.71,
            title: "Revalidatieprogramma",
            excerpt: "Nieuw revalidatieprogramma voor spelers",
          },
          {
            id: "doc-m5",
            slug: "over-ons",
            type: "page",
            score: 0.65,
            title: "Over de club",
            excerpt: "Algemene info over KCVV Elewijt",
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
