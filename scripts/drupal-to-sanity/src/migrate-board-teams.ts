/**
 * Migrate club board teams (bestuur, jeugdbestuur, angels) from Drupal into Sanity `team` documents.
 *
 * These teams are not in PSD — they live in Drupal as node--team content.
 * Staff members are already in Sanity as staffMember documents (migrated via migrate-staff.ts)
 * with IDs following the pattern `staff-board-{drupal_uuid}`.
 *
 * Run against staging:    SANITY_DATASET=staging pnpm migrate:board-teams
 * Run against production: SANITY_DATASET=production pnpm migrate:board-teams
 */
import "dotenv/config";
import { client } from "./sanity-uploader";

interface BoardTeam {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  staffDrupalUuids: string[];
}

const BOARD_TEAMS: BoardTeam[] = [
  {
    _id: "team-bestuur",
    name: "Bestuur & Dagelijkse Werking",
    slug: "bestuur",
    tagline: "Het kloppend hart van de club",
    staffDrupalUuids: [
      "d2332ee2-19b0-4c9e-ac21-5c3bb35a60fc",
      "24c53ac0-ba52-428a-a039-a146a5eff963",
      "dd7508e6-f7c6-4425-81d8-8f176265eacd",
      "19c6f821-55cb-405b-ad0e-7fd70839a455",
      "400e96fc-df0f-474b-9b2a-dc7d9aac0536",
      "82404e68-9c6f-466e-80d4-f1c0d67e3369",
      "ef3a6397-8dd8-443c-b06a-1a3fb3e39fcc",
      "9aeed3fc-2d50-4f52-85c4-ee8c72ad7b1d",
      "89f7bc6a-9b53-4e81-b596-49f580b02dd6",
      "acffe287-67c1-42fc-8aa6-eab82c268b4c",
    ],
  },
  {
    _id: "team-jeugdbestuur",
    name: "Jeugdbestuur",
    slug: "jeugdbestuur",
    tagline: "De begeleiding van de toekomst",
    staffDrupalUuids: [
      "19c6f821-55cb-405b-ad0e-7fd70839a455",
      "67832a6b-9cbb-4776-8307-e01268df9f2b",
      "0f2a92a4-2de4-411b-a6dd-e195b6141cb3",
      "9aeed3fc-2d50-4f52-85c4-ee8c72ad7b1d",
      "97bcb134-f673-475c-9507-c98cf33a5b10",
      "400e96fc-df0f-474b-9b2a-dc7d9aac0536",
    ],
  },
  {
    _id: "team-angels",
    name: "KCVV Angels",
    slug: "angels",
    tagline: "De feestneuzen",
    staffDrupalUuids: [
      "24c53ac0-ba52-428a-a039-a146a5eff963",
      "1b7ad6bb-9821-405c-ab1b-4d40999ce539",
      "79e39dd6-3ac2-40f9-988b-76a3f3e07ab3",
      "98e0fc61-27b7-493f-92b5-0af74f9be818",
      "1d1cd6a6-6c10-400f-b6ab-5b8c26c222e0",
    ],
  },
];

async function main() {
  const dataset = process.env.SANITY_DATASET ?? "staging";
  console.log(`\nMigrating board teams to Sanity dataset: ${dataset}\n`);

  for (const team of BOARD_TEAMS) {
    const staffRefs = team.staffDrupalUuids.map((uuid, i) => ({
      _type: "reference" as const,
      _ref: `staff-board-${uuid}`,
      _key: `staff-${i}`,
    }));

    const doc = {
      _id: team._id,
      _type: "team",
      name: team.name,
      slug: { _type: "slug", current: team.slug },
      tagline: team.tagline,
      showInNavigation: false,
      staff: staffRefs,
    };

    console.log(`Creating team: ${team.name} (${team.slug})...`);
    await client.createOrReplace(doc);
    console.log(`  ✓ ${team.slug} (${staffRefs.length} staff linked)`);
  }

  console.log("\nDone! All board teams migrated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
