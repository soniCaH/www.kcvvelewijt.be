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
  // Editor-UX rework groups (#1501). `type` is the default tab — the editor
  // picks the article type first, which drives which conditional fields show.
  groups: [
    { name: "type", title: "Type", default: true },
    { name: "inhoud", title: "Inhoud" },
    { name: "publicatie", title: "Publicatie" },
    { name: "gerelateerd", title: "Gerelateerd" },
  ],
  fields: [
    defineField({
      name: "articleType",
      title: "Article type",
      type: "string",
      group: "type",
      description:
        "Bepaalt de vorm van het artikel: welke velden verschijnen en hoe de pagina rendert. Interview toont portretten + Q&A; Transfer en Event vragen een fact-blok in de inhoud; Match preview/recap koppelt aan een wedstrijd. Kies dit eerst — de rest van het formulier past zich erop aan.",
      options: {
        list: [
          { title: "Interview", value: "interview" },
          { title: "Announcement", value: "announcement" },
          { title: "Transfer", value: "transfer" },
          { title: "Event", value: "event" },
          { title: "Match preview", value: "matchPreview" },
          { title: "Match recap", value: "matchRecap" },
        ],
        layout: "radio",
      },
      initialValue: "announcement",
      validation: (r) =>
        r
          .required()
          .error(
            "Verplicht. Zonder type weet de site niet hoe het artikel gerenderd moet worden en welke velden nodig zijn.",
          ),
    }),
    defineField({
      name: "linkedMatch",
      title: "Linked match (preview/recap only)",
      type: "string",
      group: "type",
      description:
        "PSD-wedstrijd-id — kopieer het uit de /wedstrijd/[matchId] URL. Verplicht voor match preview- en match recap-artikels.",
      hidden: ({ parent }) =>
        !["matchPreview", "matchRecap"].includes(parent?.articleType ?? ""),
      validation: (r) =>
        r.custom((value, ctx) => {
          const articleType = (
            ctx.document as { articleType?: string } | undefined
          )?.articleType;
          if (!["matchPreview", "matchRecap"].includes(articleType ?? "")) {
            return true;
          }
          // PSD match ids are numeric (e.g. 2775); enforce digits-only so a
          // mistyped slug/URL can't slip through. An empty value fails this
          // too, so it doubles as the required-field check for the two types.
          const trimmed = typeof value === "string" ? value.trim() : "";
          if (!/^\d+$/.test(trimmed)) {
            return "Match preview- / recap-artikels hebben een numeriek PSD-wedstrijd-id nodig (kopieer het uit de /wedstrijd/[matchId] URL).";
          }
          return true;
        }),
    }),
    defineField({
      name: "subjects",
      title: "Subjects (interview only)",
      type: "array",
      group: "type",
      of: [{ type: "subject" }],
      description:
        "Personen waarover het interview gaat. Voor duo-/panelinterviews voeg je er 2–4 toe. Bepaalt de hero-lay-out (1 = enkel portret, 2 = naast elkaar, 3 = trio, 4 = 2×2-raster), de attributie per persoon op 'key'- en 'quote'-paren, en de JSON-LD-metadata.",
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
      group: "inhoud",
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
          .error(
            "Verplicht. Zonder titel heeft het artikel geen kop op de pagina en kan er geen slug gegenereerd worden.",
          )
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
      group: "inhoud",
      description:
        "Korte samenvatting boven het artikel — toont op homepage, news cards, hero, social shares. Laat leeg om de eerste alinea van de body te gebruiken. Richtlijn: ~280 tekens.",
      validation: (r) => r.max(280),
    }),
    defineField({
      name: "author",
      title: "Auteur (Door)",
      type: "string",
      group: "inhoud",
      description:
        "Naam van de schrijver. Wordt getoond in de byline boven het artikel en in het ArticleCredits-blok onderaan. Optioneel — bij interviews en lange stukken aanbevolen.",
    }),
    defineField({
      name: "photographer",
      title: "Fotograaf (Beeld)",
      type: "string",
      group: "inhoud",
      description:
        "Naam van de fotograaf. Wordt getoond in het ArticleCredits-blok onderaan. Optioneel — bij interviews, evenementenverslagen en toekomstige fotogalerijen vermelden.",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "publicatie",
      description:
        "De URL van het artikel (bijv. /nieuws/jouw-titel). Klik 'Generate' om hem uit de titel te maken. Wijzig hem niet meer nadat het artikel gepubliceerd en gedeeld is — bestaande links breken anders.",
      options: { source: "title" },
      validation: (r) =>
        r
          .required()
          .error(
            "Verplicht. Zonder slug heeft het artikel geen URL en is het niet bereikbaar op de site.",
          ),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      group: "publicatie",
      description:
        "Publicatiedatum en -tijd. Bepaalt de volgorde in nieuwsoverzichten (nieuwste eerst) en de datum in de byline. Laat leeg tot je effectief wil publiceren.",
    }),
    defineField({
      name: "unpublishAt",
      title: "Unpublish at",
      type: "datetime",
      group: "publicatie",
      description:
        "Optioneel: datum waarop het artikel automatisch van de site verdwijnt. Handig voor tijdelijke aankondigingen. Laat leeg om het artikel online te houden.",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "publicatie",
      description:
        "Zet aan om dit artikel uit te lichten (groter op de homepage / bovenaan overzichten). Gebruik spaarzaam — als alles uitgelicht is, valt niets meer op.",
      initialValue: false,
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      group: "inhoud",
      description:
        "Verplichte cover-afbeelding (16:9 landschap). Wordt overal gebruikt — homepage, news cards, hero, social shares. Eén upload per artikel.",
      options: { hotspot: true },
      validation: (r) =>
        r
          .required()
          .error(
            "Verplicht. De cover-afbeelding wordt overal getoond (homepage, kaarten, hero, social shares) — zonder cover oogt het artikel onaf.",
          ),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "inhoud",
      description:
        "Trefwoorden voor filtering en gerelateerde artikels (bijv. 'eerste elftal', 'jeugd'). Typ een woord en druk op Enter. Optioneel, maar helpt lezers verwante artikels te vinden.",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      group: "inhoud",
      description:
        "De volledige inhoud van het artikel. Gebruik het + menu om naast tekst ook beelden, video, Q&A en tabellen toe te voegen. Een event-artikel heeft minstens één Event-fact nodig, een transfer-artikel minstens één Transfer-fact; bij interviews structureer je met Q&A-paren en -secties.",
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
      group: "gerelateerd",
      description:
        "Optioneel: artikels die je expliciet onderaan wil tonen als 'lees ook'. Voor een bredere mix (spelers, teams, evenementen) gebruik je 'Related content' hieronder.",
      of: [{ type: "reference", to: [{ type: "article" }] }],
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "string",
      group: "publicatie",
      description: "Overschrijving voor SEO meta-omschrijving en OG-omschrijving (max. 160 tekens).",
      validation: (r) => r.max(160),
    }),
    defineField({
      name: "ogImage",
      title: "OG image",
      type: "image",
      group: "publicatie",
      description: "Optionele overschrijving voor de Open Graph-afbeelding. Valt terug op de omslagafbeelding.",
      options: { hotspot: true },
    }),
    defineField({
      name: "relatedContent",
      title: "Related content",
      group: "gerelateerd",
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
