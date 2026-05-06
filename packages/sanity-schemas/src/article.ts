import {defineField, defineType} from 'sanity'
import {LinkIcon, UserIcon} from '@sanity/icons'
import {articlePreviewSelect, prepareArticlePreview} from './preview/article-preview'
import {validateSubjectsCount} from './validation/subjects-count'

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  orderings: [
    {
      title: "Publish date, newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Publish date, oldest first",
      name: "publishedAtAsc",
      by: [{ field: "publishedAt", direction: "asc" }],
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
      type: "array",
      description:
        "Houd de titel kort en krachtig (richtlijn: ~60 tekens). Selecteer één woord en klik op 'Accent' voor de groene cursief. Op de homepagina wordt de titel na 3 regels afgekapt met een ellipsis.",
      // Constrained Portable Text — single block, no styles, no
      // annotations, ONE custom decorator named `accent`. Editor selects
      // a word + clicks Accent → that span renders italic + jersey-deep
      // via <EditorialHeading>.
      // Spec: docs/design/mockups/phase-3-b-editorial-hero/fields.md Ask 9.
      of: [
        {
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [{ title: "Accent", value: "accent" }],
            annotations: [],
          },
        },
      ],
      validation: (r) =>
        r
          .required()
          .max(1)
          .custom((blocks) => {
            const arr = blocks as
              | { children?: { text?: string }[] }[]
              | undefined;
            const text =
              arr?.[0]?.children?.map((c) => c.text ?? "").join("") ?? "";
            return text.trim().length > 0 ? true : "Titel mag niet leeg zijn.";
          }),
    }),
    defineField({
      name: "lead",
      title: "Lead",
      type: "string",
      description:
        "Korte samenvatting boven het artikel — toont op homepage, news cards, hero, social shares. Laat leeg om de eerste alinea van de body te gebruiken. Richtlijn: ~280 tekens.",
      validation: (r) => r.max(280),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "publishedAt", title: "Published at", type: "datetime" }),
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
      description:
        "Verplichte cover-afbeelding (16:9 landschap). Wordt overal gebruikt — homepage, news cards, hero, social shares. Eén upload per artikel.",
      options: { hotspot: true },
      validation: (r) => r.required(),
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
      // articleType=event requires ≥1 eventFact block, articleType=transfer
      // requires ≥1 transferFact block. Hero has nothing to render without
      // it. Spec: fields.md Ask 6.
      validation: (r) =>
        r.custom((blocks, ctx) => {
          const articleType = (ctx.document as { articleType?: string })
            ?.articleType;
          const arr = (blocks as { _type?: string }[] | undefined) ?? [];
          if (
            articleType === "event" &&
            !arr.some((b) => b._type === "eventFact")
          ) {
            return "Een event-artikel heeft minstens één Event-fact nodig in de inhoud — voeg er één toe via het + menu in de body editor.";
          }
          if (
            articleType === "transfer" &&
            !arr.some((b) => b._type === "transferFact")
          ) {
            return "Een transfer-artikel heeft minstens één Transfer-fact nodig in de inhoud — voeg er één toe via het + menu in de body editor.";
          }
          return true;
        }),
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
        { type: "qaSectionDivider" },
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
      name: "metaDescription",
      title: "Meta description",
      type: "string",
      description: "Overschrijving voor SEO meta-omschrijving en OG-omschrijving (max. 160 tekens).",
      validation: (r) => r.max(160),
    }),
    defineField({
      name: "ogImage",
      title: "OG image",
      type: "image",
      description: "Optionele overschrijving voor de Open Graph-afbeelding. Valt terug op de omslagafbeelding.",
      options: { hotspot: true },
    }),
    defineField({
      name: "relatedContent",
      title: "Related content",
      description:
        "Curated mix van gerelateerde items naast het artikel. Pick artikels, spelers, teams, staf of evenementen die je expliciet wil tonen. Curated picks winnen van automatisch afgeleide vermeldingen uit de body (geen dubbele kaarten). Houd het kort — max 8.",
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
            { type: "event" },
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
    select: articlePreviewSelect,
    prepare: prepareArticlePreview,
  },
});
