import {defineField, defineType} from 'sanity'
import {LinkIcon, UserIcon} from '@sanity/icons'
import {validateSubjectsCount} from './validation/subjects-count'

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
      name: "subjects",
      title: "Subjects (interview only)",
      type: "array",
      of: [{ type: "subject" }],
      description:
        "Persons the interview is about. For duo/panel interviews, list 2–4. Drives the hero layout (N=1 single portrait / N=2 side-by-side / N=3 trio / N=4 2×2 grid), per-pair attribution on `key` and `quote` pairs, and JSON-LD metadata.",
      hidden: ({ parent }) => parent?.articleType !== "interview",
      validation: (r) =>
        r.custom((subjects, ctx) =>
          validateSubjectsCount(subjects, {
            document: ctx.document as { articleType?: string } | undefined,
          }),
        ),
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
        { type: "videoBlock" },
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
    defineField({
      name: "relatedContent",
      title: "Related content",
      description:
        "Curated mix van gerelateerde items naast het artikel. Pick artikels, spelers, teams of staf die je expliciet wil tonen. Curated picks winnen van automatisch afgeleide vermeldingen uit de body (geen dubbele kaarten). Houd het kort — max 8.",
      type: "array",
      validation: (r) =>
        r.max(8).custom((items: { _ref?: string }[] | undefined) => {
          if (!items?.length) return true
          const seen = new Set<string>()
          // Return per-row markers so Sanity highlights the offending entry
          // instead of flagging the whole field — duplicates are usually
          // editor mistakes that benefit from precise targeting.
          const errors: Array<{ message: string; path: [number] }> = []
          for (const [i, item] of items.entries()) {
            if (!item._ref) continue
            if (seen.has(item._ref)) {
              errors.push({
                message: `Item ${item._ref} verschijnt meer dan één keer.`,
                path: [i],
              })
              continue
            }
            seen.add(item._ref)
          }
          return errors.length > 0 ? errors : true
        }),
      of: [
        {
          type: "reference",
          to: [
            { type: "article" },
            { type: "player" },
            { type: "team" },
            { type: "staffMember" },
          ],
          // Self-reference filter: prune the host article (and its draft twin)
          // out of the article picker so editors can't relate an article to
          // itself. Article _id is unique across types, so filtering on _id
          // is safe even though the picker spans multiple document types.
          options: {
            filter: ({ document }) => {
              if (!document?._id) return {}
              const publishedId = document._id.replace(/^drafts\./, "")
              return {
                filter: "_id != $self && _id != $draftSelf",
                params: {
                  self: publishedId,
                  draftSelf: `drafts.${publishedId}`,
                },
              }
            },
          },
        },
      ],
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
