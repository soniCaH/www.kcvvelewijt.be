import {defineField, defineType} from 'sanity'
import {LinkIcon, UserIcon} from '@sanity/icons'

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  orderings: [
    {
      title: "Publish date, newest first",
      name: "publishAtDesc",
      by: [{ field: "publishAt", direction: "desc" }],
    },
    {
      title: "Publish date, oldest first",
      name: "publishAtAsc",
      by: [{ field: "publishAt", direction: "asc" }],
    },
  ],
  fields: [
    defineField({
      name: "articleType",
      title: "Article type",
      type: "string",
      options: {
        list: [
          { title: "Interview", value: "interview" },
          { title: "Announcement", value: "announcement" },
          { title: "Transfer", value: "transfer" },
          { title: "Event", value: "event" },
        ],
        layout: "radio",
      },
      initialValue: "announcement",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "subject",
      title: "Subject (interview only)",
      type: "subject",
      description:
        "Person the interview is about. Drives the kicker in the hero, the attribution on `key` and `quote` qaBlock pairs, and JSON-LD metadata.",
      hidden: ({ parent }) => parent?.articleType !== "interview",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        "Houd de titel kort en krachtig (richtlijn: ~60 tekens). Op de homepagina wordt de titel na 3 regels afgekapt met een ellipsis.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "publishAt", title: "Publish at", type: "datetime" }),
    defineField({
      name: "unpublishAt",
      title: "Unpublish at",
      type: "datetime",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        {
          type: "block",
          marks: {
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                icon: LinkIcon,
                fields: [
                  {
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (r) =>
                      r
                        .required()
                        .uri({
                          allowRelative: true,
                          scheme: ["http", "https", "mailto", "tel"],
                        }),
                  },
                ],
              },
              {
                name: "internalLink",
                title: "Internal link",
                type: "object",
                icon: UserIcon,
                fields: [
                  {
                    name: "reference",
                    title: "Reference",
                    type: "reference",
                    to: [
                      { type: "player" },
                      { type: "staffMember" },
                      { type: "team" },
                      { type: "article" },
                      { type: "page" },
                    ],
                    validation: (r) => r.required(),
                  },
                ],
              },
            ],
          },
        },
        { type: "articleImage" },
        { type: "fileAttachment" },
        { type: "htmlTable" },
        { type: "qaBlock" },
        { type: "transferFact" },
        { type: "eventFact" },
      ],
    }),
    defineField({
      name: "relatedArticles",
      title: "Related articles",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
    }),
  ],
  preview: {
    select: { title: "title", media: "coverImage", publishAt: "publishAt" },
    prepare({ title, media, publishAt }) {
      return {
        title,
        subtitle: publishAt
          ? new Date(publishAt).toLocaleDateString("nl-BE")
          : "No date",
        media,
      };
    },
  },
});
