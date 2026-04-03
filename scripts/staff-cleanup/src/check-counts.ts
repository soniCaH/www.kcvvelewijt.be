import { client } from "./sanity-client";

async function main() {
  const docs = await client.fetch(`{
    "psd": count(*[_type == "staffMember" && _id match "staffMember-psd-*"]),
    "board": count(*[_type == "staffMember" && _id match "staff-board-*"]),
    "manual": count(*[_type == "staffMember" && _id match "staffMember-manual-*"]),
    "total": count(*[_type == "staffMember"]),
    "archived": count(*[_type == "staffMember" && archived == true])
  }`);
  console.log("Staff counts:", JSON.stringify(docs, null, 2));
}

main().catch(console.error);
