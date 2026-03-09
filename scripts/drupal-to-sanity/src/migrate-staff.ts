import "dotenv/config";
import { fetchAllPages, drupalUrl } from "./drupal-fetcher";
import { uploadImageFromUrl, createDoc } from "./sanity-uploader";

const COACH_ROLE_MAP: Record<string, string> = {
  T1: "hoofdtrainer",
  T2: "assistent",
  TK: "keeperstrainer",
  TVJO: "tvjo",
  PDG: "ploegdelegatie",
  AF: "afgevaardigde",
  CO: "coach",
};

interface DrupalPlayer {
  id: string;
  attributes: {
    field_firstname?: string | null;
    field_lastname?: string | null;
    field_position_short?: string | null;
    field_birth_date?: string | null;
    field_join_date?: string | null;
  };
  relationships: { field_image?: { data: { id: string } | null } };
}

interface DrupalStaff {
  id: string;
  attributes: {
    field_firstname?: string | null;
    field_lastname?: string | null;
    field_position_staff?: string | null;
    field_birth_date?: string | null;
    field_join_date?: string | null;
  };
  relationships: { field_image?: { data: { id: string } | null } };
}

interface DrupalFile {
  id: string;
  attributes: { uri: { url: string } };
}

/**
 * Resolve a Drupal file reference to a Sanity image asset ID.
 *
 * @param ref - Drupal file reference object containing an `id`, or `null`/`undefined` to indicate no file
 * @returns The Sanity image asset ID when the file is found and uploaded, `null` otherwise
 */
async function resolveImage(
  ref: { id: string } | null | undefined,
): Promise<string | null> {
  if (!ref) return null;
  // field_image on node/player and node/staff is a direct file--file reference
  const res = await fetch(drupalUrl(`file/file/${ref.id}`));
  if (!res.ok) return null;
  const json = (await res.json()) as { data: DrupalFile };
  const url = json.data?.attributes?.uri?.url;
  if (!url) return null;
  const fullUrl = url.startsWith("http")
    ? url
    : `${process.env.DRUPAL_BASE_URL}${url}`;
  return uploadImageFromUrl(fullUrl);
}

/**
 * Migrate coaches and board staff from Drupal into Sanity as staffMember documents.
 *
 * Fetches player and staff nodes from Drupal, resolves optional image assets, creates corresponding
 * Sanity documents with mapped roles and available photo references, and logs progress for each item.
 */
async function main() {
  // Migrate node--player coaching staff (those with a position_short role code)
  console.log("Fetching coaches (node--player with role codes) from Drupal...");
  const allPlayers = await fetchAllPages<DrupalPlayer>(
    drupalUrl("node/player?page[limit]=100"),
  );
  const coaches = allPlayers.filter(
    (p) =>
      p.attributes.field_position_short &&
      COACH_ROLE_MAP[p.attributes.field_position_short],
  );

  for (const coach of coaches) {
    const photoAssetId = await resolveImage(
      coach.relationships.field_image?.data,
    );
    const role =
      COACH_ROLE_MAP[coach.attributes.field_position_short ?? ""] ?? "other";

    await createDoc({
      _id: `staff-coach-${coach.id}`,
      _type: "staffMember",
      firstName: coach.attributes.field_firstname ?? "",
      lastName: coach.attributes.field_lastname ?? "",
      role,
      birthDate: coach.attributes.field_birth_date ?? null,
      joinDate: coach.attributes.field_join_date ?? null,
      ...(photoAssetId
        ? {
            photo: {
              _type: "image",
              asset: { _type: "reference", _ref: photoAssetId },
            },
          }
        : {}),
    });
    console.log(
      `  Migrated coach: ${coach.attributes.field_firstname} ${coach.attributes.field_lastname} (${role})`,
    );
  }

  // Migrate node--staff board members
  console.log("Fetching board staff (node--staff) from Drupal...");
  const boardMembers = await fetchAllPages<DrupalStaff>(
    drupalUrl("node/staff?page[limit]=100"),
  );

  for (const member of boardMembers) {
    const photoAssetId = await resolveImage(
      member.relationships.field_image?.data,
    );
    await createDoc({
      _id: `staff-board-${member.id}`,
      _type: "staffMember",
      firstName: member.attributes.field_firstname ?? "",
      lastName: member.attributes.field_lastname ?? "",
      role: "bestuur",
      birthDate: member.attributes.field_birth_date ?? null,
      joinDate: member.attributes.field_join_date ?? null,
      ...(photoAssetId
        ? {
            photo: {
              _type: "image",
              asset: { _type: "reference", _ref: photoAssetId },
            },
          }
        : {}),
    });
    console.log(
      `  Migrated board: ${member.attributes.field_firstname} ${member.attributes.field_lastname}`,
    );
  }

  console.log("Staff migration complete.");
}

main().catch(console.error);
