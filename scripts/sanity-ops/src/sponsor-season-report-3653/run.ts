/**
 * Writes one printable season report per active Sponsor (#3653, spec #3618
 * slice c). Hand-run; the thin shell around `build-report.ts` and `render.ts`.
 * Not unit-tested: `--dry-run` is the manual check.
 *
 * Run (README: "Sponsor season report"):
 *   SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops sponsor-report --dry-run
 *   SANITY_DATASET=production pnpm --filter @kcvv/sanity-ops sponsor-report --from 2026-07-01 --to 2027-06-30 --spotlight weeks.json
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { client } from "../shared/sanity-client";
import { packageRoot } from "../shared/package-root";
import {
  buildReport,
  defaultSeason,
  type Ga4Row,
  type SponsorInput,
} from "./build-report";
import { renderReportPage } from "./render";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? "530024143";
const EVENTS = [
  "sponsor_impression",
  "sponsor_click",
  "sponsor_featured_click",
];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Git-ignored (`.gitignore`): the reports hold a client's numbers. */
const OUTPUT_DIR = new URL("out/sponsor-season-report-3653/", packageRoot);

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const SPONSORS_QUERY = `*[_type == "sponsor" && defined(name)]{
  "id": _id, name, tier, "active": active == true,
  "teams": teams[]->{ "name": coalesce(displayName, name) }.name
}`;

interface SanitySponsor extends Omit<SponsorInput, "teams"> {
  teams: (string | null)[] | null;
}

const accessToken = () => {
  try {
    return execSync("gcloud auth application-default print-access-token", {
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
  } catch {
    return fail(
      "Could not get a gcloud access token. Run:\n  gcloud auth application-default login --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform",
    );
  }
};

interface Ga4Response {
  rows?: {
    dimensionValues: { value: string }[];
    metricValues: { value: string }[];
  }[];
  rowCount?: number;
}

const fetchGa4Rows = async (from: string, to: string): Promise<Ga4Row[]> => {
  const token = accessToken();
  const limit = 100_000;
  const rows: Ga4Row[] = [];
  for (let offset = 0; ; offset += limit) {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: from, endDate: to }],
          dimensions: [
            { name: "customEvent:sponsor_id" },
            { name: "customEvent:source" },
            { name: "eventName" },
            // To limit the "(not set)" source mapping to before the #3773 deploy.
            { name: "date" },
          ],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            filter: {
              fieldName: "eventName",
              inListFilter: { values: EVENTS },
            },
          },
          limit,
          offset,
        }),
      },
    );
    if (!response.ok) {
      return fail(
        `GA4 runReport failed: ${response.status} ${await response.text()}`,
      );
    }
    const page = (await response.json()) as Ga4Response;
    for (const { dimensionValues: d, metricValues: m } of page.rows ?? []) {
      rows.push({
        sponsorId: d[0].value,
        source: d[1].value,
        eventName: d[2].value,
        date: d[3].value,
        count: Number(m[0].value),
      });
    }
    if (offset + limit >= (page.rowCount ?? 0)) return rows;
  }
};

/** `{ "Garage X": ["2027-03-01", ...] }`: the Monday of each spotlight week. */
const readSpotlightWeeks = (path: string | undefined) => {
  if (!path) return {};
  const weeks = JSON.parse(readFileSync(path, "utf-8")) as Record<
    string,
    string[]
  >;
  for (const [name, list] of Object.entries(weeks)) {
    if (!Array.isArray(list) || !list.every((w) => ISO_DATE.test(w))) {
      fail(`Spotlight weeks for "${name}" must be a list of YYYY-MM-DD dates.`);
    }
  }
  return weeks;
};

const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const main = async () => {
  const { values } = parseArgs({
    options: {
      from: { type: "string" },
      to: { type: "string" },
      spotlight: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  const season = defaultSeason(new Date());
  const range = {
    from: values.from ?? season.from,
    to: values.to ?? season.to,
  };
  for (const date of [range.from, range.to]) {
    if (!ISO_DATE.test(date)) fail(`Not a YYYY-MM-DD date: ${date}`);
  }

  const sponsors = (await client.fetch<SanitySponsor[]>(SPONSORS_QUERY)).map(
    (sponsor) => ({
      ...sponsor,
      teams: (sponsor.teams ?? []).filter((team): team is string => !!team),
    }),
  );
  const rows = await fetchGa4Rows(range.from, range.to);
  const reports = buildReport({
    sponsors,
    rows,
    spotlightWeeks: readSpotlightWeeks(values.spotlight),
    range,
  });

  console.log(`${range.from} tot ${range.to}: ${rows.length} GA4 rows`);
  for (const report of reports) {
    const own = rows.filter((row) => row.sponsorId === report.hash).length;
    console.log(
      `  ${report.name}: ${own} rows${report.hasData ? "" : " (nog geen meetgegevens)"}`,
    );
  }

  if (values["dry-run"]) return console.log("\nDry run: nothing written.");

  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const report of reports) {
    // The hash keeps two Sponsors with the same name apart.
    const file = new URL(
      `${slug(report.name)}-${report.hash}.html`,
      OUTPUT_DIR,
    );
    writeFileSync(file, renderReportPage(report));
  }
  console.log(`\nWrote ${reports.length} reports to ${OUTPUT_DIR.pathname}`);
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
