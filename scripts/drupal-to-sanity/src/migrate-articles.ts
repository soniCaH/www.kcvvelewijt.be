import "dotenv/config";
import { JSDOM } from "jsdom";
import { htmlToBlocks } from "@portabletext/to-portable-text";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

interface DrupalArticle {
  id: string;
  attributes: {
    title: string;
    status: boolean;
    path?: { alias?: string };
    body?: { processed?: string } | null;
    publish_on?: string | null;
    field_featured?: boolean;
  };
  relationships: {
    field_media_article_image?: { data: { id: string } | null };
    field_tags?: { data: Array<{ id: string }> };
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
      "node/article?include=field_media_article_image.field_media_image,field_tags&filter[status]=1&sort=-publish_on&page[limit]=50",
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

    // Tags
    const tags: string[] = [];
    for (const tagRef of article.relationships.field_tags?.data ?? []) {
      const termRes = await fetch(drupalUrl(`taxonomy_term/tags/${tagRef.id}`));
      if (termRes.ok) {
        const termJson = (await termRes.json()) as { data: DrupalTerm };
        tags.push(termJson.data.attributes.name);
      }
    }

    // Body: HTML → Portable Text (jsdom for Node.js DOMParser compatibility)
    const body = article.attributes.body?.processed
      ? htmlToBlocks(article.attributes.body.processed, {
          parseHtml: (html) => new JSDOM(html).window.document,
        })
      : [];

    // Slug from Drupal path alias (/news/my-article → my-article)
    const slug =
      article.attributes.path?.alias?.replace("/news/", "") ?? article.id;

    await createDoc({
      _id: `article-drupal-${article.id}`,
      _type: "article",
      title: article.attributes.title,
      slug: { _type: "slug", current: slug },
      publishAt: article.attributes.publish_on ?? null,
      featured: article.attributes.field_featured ?? false,
      tags,
      body,
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
