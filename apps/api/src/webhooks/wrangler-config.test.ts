import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPECTED_INDEX_BY_DATASET } from "../search/dataset-index-guard";

// ─── A deliberately tiny, scoped TOML reader ───────────────────────────────
//
// Not a general TOML parser — apps/api has no TOML dependency, and this
// issue adds none (#2833). It only understands what wrangler.toml actually
// contains: flat `key = "value"` lines grouped under `[section]` /
// `[[section]]` headers. That is enough to answer the one question this
// test exists to ask.

function parseSections(source: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current: string | null = null;
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    const header = /^(\[\[?[^\]]+\]\]?)$/.exec(line)?.[1];
    if (header) {
      current = header;
      sections[current] ??= [];
      continue;
    }
    if (current && line && !line.startsWith("#")) {
      sections[current]!.push(line);
    }
  }
  return sections;
}

function readStringVar(lines: string[], key: string): string | undefined {
  for (const line of lines) {
    const match = new RegExp(`^${key}\\s*=\\s*"([^"]*)"`).exec(line);
    if (match) return match[1];
  }
  return undefined;
}

// ─── The invariant the runtime guard cannot check itself ───────────────────
//
// datasetIndexMismatch (search/dataset-index-guard.ts) compares
// SANITY_DATASET against SEARCH_INDEX_NAME — two vars that live in the same
// wrangler.toml block, so a wrangler.toml edit that changes the vectorize
// binding's real `index_name` without also updating SEARCH_INDEX_NAME would
// pass that check cleanly while the worker silently wrote to the wrong
// index. Wrangler never exposes a binding's actual target to the worker at
// runtime, so a test reading wrangler.toml directly is the only place left
// to catch that drift (#2833 review finding 4).

describe("wrangler.toml keeps each environment's vectorize binding, SEARCH_INDEX_NAME, and dataset in lock-step", () => {
  const source = readFileSync(
    join(__dirname, "..", "..", "wrangler.toml"),
    "utf-8",
  );
  const sections = parseSections(source);

  const environments = [
    {
      label: "production",
      varsHeader: "[vars]",
      vectorizeHeader: "[[vectorize]]",
    },
    {
      label: "staging",
      varsHeader: "[env.staging.vars]",
      vectorizeHeader: "[[env.staging.vectorize]]",
    },
  ];

  for (const { label, varsHeader, vectorizeHeader } of environments) {
    it(`${label}: index_name, SEARCH_INDEX_NAME, and EXPECTED_INDEX_BY_DATASET all agree`, () => {
      const varsLines = sections[varsHeader];
      const vectorizeLines = sections[vectorizeHeader];
      expect(varsLines, `wrangler.toml is missing ${varsHeader}`).toBeDefined();
      expect(
        vectorizeLines,
        `wrangler.toml is missing ${vectorizeHeader}`,
      ).toBeDefined();

      const dataset = readStringVar(varsLines!, "SANITY_DATASET");
      const searchIndexName = readStringVar(varsLines!, "SEARCH_INDEX_NAME");
      const indexName = readStringVar(vectorizeLines!, "index_name");

      expect(dataset, `${varsHeader} is missing SANITY_DATASET`).toBeDefined();
      const expected = EXPECTED_INDEX_BY_DATASET[dataset!];
      expect(
        expected,
        `EXPECTED_INDEX_BY_DATASET has no entry for dataset "${dataset}"`,
      ).toBeDefined();

      expect(indexName).toBe(expected);
      expect(searchIndexName).toBe(expected);
    });
  }
});
