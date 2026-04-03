/**
 * Phase 2 detail — for each board→PSD match, check:
 * 1. Does the board doc have a photo?
 * 2. Does the PSD doc already have a photo?
 * 3. Which documents reference the board doc?
 */
import { client } from "./sanity-client";
import { readFileSync } from "fs";

interface MatchEntry {
  boardId: string;
  psdId: string;
  psdIdNum: string;
  boardName: string;
  psdName: string;
  confidence: string;
  hasPhoto: boolean;
}

interface RefDoc {
  _id: string;
  _type: string;
}

const matches: MatchEntry[] = JSON.parse(readFileSync("phase2-matches.json", "utf-8"));

async function main() {
  console.log(`Analyzing ${matches.length} matches...\n`);

  for (const match of matches) {
    // Check PSD doc photo status
    const psdDoc = await client.fetch<{ photo: unknown } | null>(
      `*[_id == $id][0]{ photo }`,
      { id: match.psdId }
    );

    // Find references to the board doc
    const refs = await client.fetch<RefDoc[]>(
      `*[references($boardId)]{ _id, _type }`,
      { boardId: match.boardId }
    );

    const psdHasPhoto = !!psdDoc?.photo;
    const photoAction = match.hasPhoto && !psdHasPhoto
      ? "COPY photo to PSD"
      : match.hasPhoto && psdHasPhoto
        ? "both have photos (keep PSD)"
        : "no photo to copy";

    const refSummary = refs.length > 0
      ? refs.map((r) => `${r._type}:${r._id}`).join(", ")
      : "none";

    console.log(`${match.boardName} | ${match.boardId} → ${match.psdId}`);
    console.log(`  Photo: ${photoAction}`);
    console.log(`  Refs to relink (${refs.length}): ${refSummary}`);
    console.log();
  }
}

main().catch(console.error);
