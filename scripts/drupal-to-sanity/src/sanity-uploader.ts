import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? "staging",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

export async function uploadImageFromUrl(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error(`Failed to fetch image ${url}: ${res.status} ${res.statusText}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: url.split("/").pop(),
    });
    return asset._id;
  } catch (error) {
    console.error(`Failed to upload image ${url}`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createDoc(doc: Record<string, unknown>): Promise<void> {
  const id = doc._id as string;
  await client.createIfNotExists({ ...doc, _id: id });
  await client.patch(id).set(doc).commit();
}

export { client };
