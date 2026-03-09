import "dotenv/config";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

interface DrupalSponsor {
  id: string;
  attributes: {
    title: string;
    field_type: string;
    status: boolean;
    field_website?: { uri: string } | null;
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
 * Migrate sponsor nodes from Drupal into the Sanity dataset, creating sponsor documents and uploading linked logo images when available.
 *
 * For each sponsor, this function fetches media image data if present, uploads the image to obtain an asset reference, and creates a Sanity document containing the sponsor's id, name, type (defaults to "other"), URL (nullable), active state, and an optional logo image reference.
 */
async function main() {
  console.log("Fetching sponsors from Drupal...");
  const sponsors = await fetchAllPages<DrupalSponsor>(
    drupalUrl(
      "node/sponsor?include=field_media_image.field_media_image&page[limit]=50",
    ),
  );
  console.log(`Found ${sponsors.length} sponsors`);

  for (const sponsor of sponsors) {
    const imageRef = sponsor.relationships.field_media_image?.data;
    let logoAssetId: string | null = null;

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
          console.log(`  Uploading logo for ${sponsor.attributes.title}...`);
          logoAssetId = await uploadImageFromUrl(fullUrl);
        }
      }
    }

    await createDoc({
      _id: `sponsor-drupal-${sponsor.id}`,
      _type: "sponsor",
      name: sponsor.attributes.title,
      type: sponsor.attributes.field_type ?? "other",
      url: sponsor.attributes.field_website?.uri ?? null,
      active: sponsor.attributes.status,
      ...(logoAssetId
        ? {
            logo: {
              _type: "image",
              asset: { _type: "reference", _ref: logoAssetId },
            },
          }
        : {}),
    });

    console.log(`  Migrated: ${sponsor.attributes.title}`);
  }

  console.log("Sponsors migration complete.");
}

main().catch(console.error);
