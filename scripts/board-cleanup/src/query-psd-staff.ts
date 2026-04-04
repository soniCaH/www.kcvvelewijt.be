import { client } from "./sanity-client.js";

async function main() {
  const allStaff = await client.fetch<Array<{ _id: string; psdId?: number; firstName: string; lastName: string; archived?: boolean }>>(
    `*[_type == "staffMember"] { _id, psdId, firstName, lastName, archived } | order(_id asc)`
  );
  const psdStaff = allStaff.filter(d => d.psdId);
  console.log(`Total staffMember docs: ${allStaff.length}`);
  console.log(`With psdId: ${psdStaff.length}`);
  for (const d of psdStaff) {
    console.log(`  ${d._id} (psdId: ${d.psdId}): ${d.firstName} ${d.lastName} (archived: ${d.archived})`);
  }

  // Also check the team docs more closely
  const teams = await client.fetch<Array<{ _id: string; title: string; members: unknown }>>(
    `*[_type == "team" && _id in ["team-bestuur", "team-jeugdbestuur"]] { _id, title, members }`
  );
  console.log("\n=== TEAM DOCS RAW ===");
  for (const t of teams) {
    console.log(`\n${t._id}:`);
    console.log(JSON.stringify(t.members, null, 2));
  }
}

main().catch(console.error);
