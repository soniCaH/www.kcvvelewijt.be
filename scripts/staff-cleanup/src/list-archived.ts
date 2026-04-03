import { client } from "./sanity-client";

async function main() {
  const archived = await client.fetch<Array<{ _id: string; firstName: string; lastName: string; psdId: string | null }>>(
    `*[_type == "staffMember" && archived == true]{ _id, firstName, lastName, psdId } | order(lastName asc)`
  );

  console.log(`${archived.length} archived staff members:\n`);
  for (const doc of archived) {
    const psd = doc.psdId ? `psd-${doc.psdId}` : "no psdId";
    console.log(`  ${doc.firstName} ${doc.lastName} — ${doc._id} (${psd})`);
  }
}

main().catch(console.error);
