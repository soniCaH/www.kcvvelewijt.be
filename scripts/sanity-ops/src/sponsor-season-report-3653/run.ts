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
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { client, dataset } from "../shared/sanity-client";
import { packageRoot } from "../shared/package-root";
import {
  buildReport,
  defaultSeason,
  type Ga4Row,
  type SponsorInput,
} from "./build-report";
import { renderReportPage } from "./render";
import { parseSpotlightWeeks, validateRange } from "./validate-input";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? "530024143";
const EVENTS = [
  "sponsor_impression",
  "sponsor_click",
  "sponsor_featured_click",
  "sponsor_team_line_click",
];
/** Git-ignored (`.gitignore`): the reports hold a client's numbers. */
const outputDir = ({ from, to }: { from: string; to: string }) =>
  new URL(`out/sponsor-season-report-3653/${from}_${to}/`, packageRoot);

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

// Every sponsor doc, named or not, active or not: the web wall tracks each
// active one, so each must be in the hash collision check.
const SPONSORS_QUERY = `*[_type == "sponsor"]{
  "id": _id, name, tier, "active": active == true,
  "teams": teams[]->{ "name": coalesce(displayName, name) }.name
}`;

interface SanitySponsor extends Omit<SponsorInput, "name" | "teams"> {
  name: string | null;
  teams: (string | null)[] | null;
}

/**
 * A raw REST call with a user ADC token does not carry the ADC quota project
 * (client libraries add it as a header, `fetch` does not): without it Google
 * bills gcloud's own project and refuses. Reads only that one field.
 */
const quotaProject = (): string => {
  const adcFile =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    join(
      homedir(),
      ".config",
      "gcloud",
      "application_default_credentials.json",
    );
  const fromFile = (): string | undefined => {
    try {
      const { quota_project_id } = JSON.parse(readFileSync(adcFile, "utf-8"));
      return typeof quota_project_id === "string"
        ? quota_project_id
        : undefined;
    } catch {
      return undefined;
    }
  };
  return (
    process.env.GOOGLE_CLOUD_QUOTA_PROJECT ??
    fromFile() ??
    fail(
      "No quota project for GA4. Run:\n  gcloud auth application-default set-quota-project kcvv-elewijt\n(or set GOOGLE_CLOUD_QUOTA_PROJECT).",
    )
  );
};

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

const fetchGa4Rows = async (
  from: string,
  to: string,
  project: string,
): Promise<Ga4Row[]> => {
  const token = accessToken();
  const limit = 100_000;
  const fetchPage = async (offset: number): Promise<Ga4Row[]> => {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-goog-user-project": project,
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
    const rows = (page.rows ?? []).map(
      ({ dimensionValues: d, metricValues: m }): Ga4Row => ({
        sponsorId: d[0].value,
        source: d[1].value,
        eventName: d[2].value,
        date: d[3].value,
        count: Number(m[0].value),
      }),
    );
    return offset + limit >= (page.rowCount ?? 0)
      ? rows
      : [...rows, ...(await fetchPage(offset + limit))];
  };
  return fetchPage(0);
};

/** Read and check the spotlight file, relative to where the operator typed the command. */
const readSpotlightWeeks = (
  path: string | undefined,
  range: { from: string; to: string },
) => {
  if (!path) return {};
  // pnpm runs the script from the package folder; INIT_CWD is where it was typed.
  const file = resolve(process.env.INIT_CWD ?? process.cwd(), path);
  try {
    return parseSpotlightWeeks(readFileSync(file, "utf-8"), range);
  } catch (err) {
    return fail(`Spotlight file ${file}: ${(err as Error).message}`);
  }
};

const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
      "allow-staging": { type: "boolean", default: false },
    },
  });
  // The shared client reads SANITY_DATASET (default staging); GA4 is always the
  // production property, so a staging sponsor list would not match its ids.
  if (dataset !== "production" && !values["allow-staging"]) {
    fail(
      `Sanity dataset is "${dataset}" but GA4 is the production property. Run with SANITY_DATASET=production (or --allow-staging to test).`,
    );
  }
  const season = defaultSeason(new Date());
  const range = {
    from: values.from ?? season.from,
    to: values.to ?? season.to,
  };
  try {
    validateRange(range);
  } catch (err) {
    fail((err as Error).message);
  }
  const spotlightWeeks = readSpotlightWeeks(values.spotlight, range);
  const project = quotaProject();

  const sponsors = (await client.fetch<SanitySponsor[]>(SPONSORS_QUERY)).map(
    (sponsor): SponsorInput => ({
      ...sponsor,
      name: sponsor.name?.trim() ?? "",
      // No name, no page: but the id stays in the collision check.
      active: sponsor.active && !!sponsor.name?.trim(),
      teams: (sponsor.teams ?? []).filter((team): team is string => !!team),
    }),
  );
  const rows = await fetchGa4Rows(range.from, range.to, project);
  const reports = buildReport({ sponsors, rows, spotlightWeeks, range });

  console.log(`${range.from} tot ${range.to}: ${rows.length} GA4 rows`);
  for (const report of reports) {
    // What the report keeps: impressions / clicks per surface.
    const counts = [
      ...report.surfaces.map(
        (s) => `${s.surface} ${s.impressions}/${s.clicks}`,
      ),
      ...(report.teamLineClicks === undefined
        ? []
        : [`team line ${report.teamLineClicks}`]),
    ].join(", ");
    console.log(
      `  ${report.name}: ${report.hasData ? counts : "nog geen meetgegevens"}`,
    );
  }

  if (values["dry-run"]) return console.log("\nDry run: nothing written.");

  // One folder per range, emptied first: no page of an earlier run survives.
  const dir = outputDir(range);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const report of reports) {
    // The hash keeps two Sponsors with the same name apart.
    const file = new URL(`${slug(report.name)}-${report.hash}.html`, dir);
    writeFileSync(file, renderReportPage(report));
  }
  console.log(`\nWrote ${reports.length} reports to ${dir.pathname}`);
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
