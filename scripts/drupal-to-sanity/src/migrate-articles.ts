import "dotenv/config";
import { JSDOM } from "jsdom";
import { htmlToBlocks } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

// Minimal schema so htmlToBlocks knows which block type to use
const schema = Schema.compile({
  name: "migration",
  types: [
    {
      name: "article",
      type: "document",
      fields: [{ name: "body", type: "array", of: [{ type: "block" }] }],
    },
  ],
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockContentType = (schema.get("article") as any).fields.find(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (f: any) => f.name === "body",
).type;

/**
 * Split an HTML string at top-level <table> boundaries.
 * Non-table segments are converted via htmlToBlocks (preserves ul, ol, blockquote, etc.).
 * Table segments become {_type: 'htmlTable'} objects with the raw HTML preserved verbatim
 * (all th, td, tr, thead, tbody semantics intact).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function htmlSplitToBlocks(html: string, blockContentType: any): unknown[] {
  const doc = new JSDOM(html).window.document;
  const blocks: unknown[] = [];
  let buffer = '';

  const flushBuffer = () => {
    if (!buffer.trim()) { buffer = ''; return; }
    const ptBlocks = htmlToBlocks(buffer, blockContentType, {
      parseHtml: (h) => new JSDOM(h).window.document,
    });
    blocks.push(...ptBlocks);
    buffer = '';
  };

  for (const child of Array.from(doc.body.childNodes)) {
    if (child.nodeName === 'TABLE') {
      flushBuffer();
      blocks.push({
        _type: 'htmlTable',
        _key: crypto.randomUUID(),
        html: (child as Element).outerHTML,
      });
    } else if (child.nodeName === '#text') {
      const text = child.textContent?.trim() ?? '';
      if (text) buffer += `<p>${text}</p>`;
    } else {
      buffer += (child as Element).outerHTML ?? '';
    }
  }
  flushBuffer();
  return blocks;
}

interface DrupalArticle {
  id: string;
  attributes: {
    title: string;
    status: boolean;
    created?: string | null;
    path?: { alias?: string };
    body?: { processed?: string } | null;
    publish_on?: string | null;
    field_featured?: boolean;
  };
  relationships: {
    field_media_article_image?: { data: { id: string } | null };
    field_tags?: { data: Array<{ type: string; id: string }> };
    field_related_content?: { data: Array<{ type: string; id: string }> };
  };
}

interface DrupalFile {
  id: string;
  attributes: { uri: { url: string } };
}

interface DrupalTerm {
  id: string;
  attributes: { name: string };
}

async function main() {
  console.log("Fetching articles from Drupal...");
  const articles = await fetchAllPages<DrupalArticle>(
    drupalUrl(
      "node/article?include=field_media_article_image.field_media_image,field_tags&filter[status]=1&sort=-publish_on,-created&page[limit]=50",
    ),
  );
  console.log(`Found ${articles.length} articles`);

  for (const article of articles) {
    // Cover image
    const imageRef = article.relationships.field_media_article_image?.data;
    let coverAssetId: string | null = null;
    if (imageRef) {
      const mediaRes = await fetch(
        drupalUrl(`media/image/${imageRef.id}?include=field_media_image`),
      );
      if (mediaRes.ok) {
        const mediaJson = (await mediaRes.json()) as {
          included?: DrupalFile[];
        };
        const file = mediaJson.included?.[0];
        if (file?.attributes.uri.url) {
          const fullUrl = file.attributes.uri.url.startsWith("http")
            ? file.attributes.uri.url
            : `${process.env.DRUPAL_BASE_URL}${file.attributes.uri.url}`;
          coverAssetId = await uploadImageFromUrl(fullUrl);
        }
      }
    }

    // Tags — vocabulary is "category" (type: taxonomy_term--category)
    const tags: string[] = [];
    for (const tagRef of article.relationships.field_tags?.data ?? []) {
      // Derive JSON:API path from type: "taxonomy_term--category" → "taxonomy_term/category"
      const resourcePath = tagRef.type.replace("--", "/");
      const termRes = await fetch(drupalUrl(`${resourcePath}/${tagRef.id}`));
      if (termRes.ok) {
        const termJson = (await termRes.json()) as { data: DrupalTerm };
        tags.push(termJson.data.attributes.name);
      }
    }

    // Related articles — field_related_content may reference players/teams/articles;
    // only keep node--article references and map to Sanity IDs
    const relatedArticles = (
      article.relationships.field_related_content?.data ?? []
    )
      .filter((ref) => ref.type === "node--article")
      .map((ref) => ({
        _type: "reference" as const,
        _ref: `article-drupal-${ref.id}`,
        _key: ref.id,
        _weak: true, // don't fail if target doesn't exist (e.g. unpublished)
      }));

    // Body: HTML → Portable Text, preserving <table> blocks as htmlTable objects
    const body = article.attributes.body?.processed
      ? htmlSplitToBlocks(article.attributes.body.processed, blockContentType)
      : [];

    // Slug from Drupal path alias (/news/my-article → my-article)
    const slug =
      article.attributes.path?.alias?.replace("/news/", "") ?? article.id;

    await createDoc({
      _id: `article-drupal-${article.id}`,
      _type: "article",
      // Preserve Drupal creation date so Studio "Sort by Created" works correctly
      ...(article.attributes.created ? { _createdAt: article.attributes.created } : {}),
      title: article.attributes.title,
      slug: { _type: "slug", current: slug },
      // publish_on is only set for scheduled articles; fall back to created date
      publishAt: article.attributes.publish_on ?? article.attributes.created ?? null,
      featured: article.attributes.field_featured ?? false,
      tags,
      body,
      ...(relatedArticles.length > 0 ? { relatedArticles } : {}),
      ...(coverAssetId
        ? {
            coverImage: {
              _type: "image",
              asset: { _type: "reference", _ref: coverAssetId },
            },
          }
        : {}),
    });

    console.log(`  Migrated: ${article.attributes.title}`);
  }

  console.log(
    "Articles migration complete. IMPORTANT: Review rich text in Studio — HTML conversion may need manual cleanup.",
  );
}

main().catch(console.error);
