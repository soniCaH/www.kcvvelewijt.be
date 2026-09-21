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

/**
 * Draft-aware variant of `client`, for the few call sites that must see
 * drafts.* documents on purpose — e.g. a referrer query that must not miss a
 * draft referrer, or a delete sweep that must not leave a draft-only document
 * behind. Each call site names the reason next to the call (#2839).
 */
export const draftAwareClient = client.withConfig({ perspective: "raw" });
