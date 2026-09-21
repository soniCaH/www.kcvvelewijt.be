import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const dataset = process.env.SANITY_DATASET ?? "staging";

function resolveToken(): string {
  if (process.env.SANITY_API_TOKEN) return process.env.SANITY_API_TOKEN;

  try {
    const configPath = join(homedir(), ".config", "sanity", "config.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (config.authToken) return config.authToken;
  } catch {
    // fall through
  }

  console.error("No Sanity auth token found (checked SANITY_API_TOKEN env var and ~/.config/sanity/config.json)");
  process.exit(1);
}

console.log(`Using dataset: ${dataset}`);

export const client = createClient({
  projectId: "vhb33jaz",
  dataset,
  apiVersion: "2024-01-01",
  // As of API version v2025-02-19, @sanity/client's default perspective changed
  // from "raw" to "published" — pin it explicitly so drafts never reach a guard.
  perspective: "published",
  token: resolveToken(),
  useCdn: false,
});
