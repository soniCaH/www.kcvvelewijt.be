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
  token: resolveToken(),
  useCdn: false,
});
