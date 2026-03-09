import "dotenv/config";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

interface DrupalEvent {
  id: string;
  attributes: {
    title: string;
    status: boolean;
    field_daterange?: { value: string; end_value?: string } | null;
    field_event_link?: { uri?: string; title?: string } | null;
  };
  relationships: {
    field_media_image?: { data: { id: string } | null };
  };
}

interface DrupalFile {
  id: string;
  attributes: { uri: { url: string } };
}

/**
 * Migrates published event nodes from Drupal into Sanity as event documents.
 *
 * Fetches published events (including media references), uploads any referenced images to Sanity,
 * and creates a corresponding Sanity document for each event with title, date range, external link,
 * and an optional cover image reference.
 */
async function main() {
  console.log("Fetching events from Drupal...");
  const events = await fetchAllPages<DrupalEvent>(
    drupalUrl(
      "node/event?include=field_media_image.field_media_image&filter[status]=1&page[limit]=50",
    ),
  );
  console.log(`Found ${events.length} events`);

  for (const ev of events) {
    const imageRef = ev.relationships.field_media_image?.data;
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

    await createDoc({
      _id: `event-drupal-${ev.id}`,
      _type: "event",
      title: ev.attributes.title,
      dateStart:
        ev.attributes.field_daterange?.value ?? new Date().toISOString(),
      dateEnd: ev.attributes.field_daterange?.end_value ?? null,
      externalLink: ev.attributes.field_event_link?.uri
        ? {
            url: ev.attributes.field_event_link.uri,
            label: ev.attributes.field_event_link.title ?? ev.attributes.title,
          }
        : null,
      ...(coverAssetId
        ? {
            coverImage: {
              _type: "image",
              asset: { _type: "reference", _ref: coverAssetId },
            },
          }
        : {}),
    });

    console.log(`  Migrated: ${ev.attributes.title}`);
  }

  console.log("Events migration complete.");
}

main().catch(console.error);
