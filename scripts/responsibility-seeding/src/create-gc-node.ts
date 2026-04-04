import { client, dataset } from "./sanity-client";

const gcNode = {
  _id: "organigramNode-gerechtelijk-correspondent",
  _type: "organigramNode",
  title: "Gerechtelijk Correspondent",
  department: "hoofdbestuur",
  parentNode: { _type: "reference", _ref: "organigramNode-voorzitter", _weak: true },
  members: [{ _type: "reference", _ref: "staffMember-psd-245", _key: "staffMemberpsd245", _weak: true }],
  active: true,
  sortOrder: 95,
  roleCode: "GC",
};

async function main() {
  if (dataset === "production" && process.env.CONFIRM_PRODUCTION_SEED !== "yes") {
    throw new Error("Set CONFIRM_PRODUCTION_SEED=yes for production");
  }
  console.log(`Creating GC node in dataset: ${dataset}`);
  await client.createIfNotExists(gcNode);
  console.log("Done — organigramNode-gerechtelijk-correspondent created");
}

main().catch(console.error);
