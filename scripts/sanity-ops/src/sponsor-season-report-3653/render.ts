/**
 * One print-ready Dutch HTML page per Sponsor (#3653). Pure: report in, string
 * out. The board prints or saves it as PDF and mails it; it never goes on the
 * site. Raw counts only: no estimate, no return-on-investment claim, no other
 * Sponsor's data and no raw Sanity id (the report model holds none).
 */
import type { Surface, SponsorReport } from "./build-report";
import { MIN_IMPRESSIONS_FOR_RATE } from "./build-report";

const SURFACE_LABEL: Record<Surface, string> = {
  homepage: "Homepage",
  team: "Ploegpagina's",
  sponsors: "Sponsorpagina",
};

const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** "2026-07-01" to "1 juli 2026". Pinned to UTC: a date, not a moment. */
const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));

const formatNumber = (n: number) => new Intl.NumberFormat("nl-BE").format(n);

const formatRate = (rate: number) =>
  `${(rate * 100).toFixed(1).replace(".", ",")} %`;

const STYLE = `
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #0a0a0a; line-height: 1.5; max-width: 170mm; margin: 0 auto; padding: 12mm 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 24pt; line-height: 1.2; margin: 0 0 4pt; color: #007c46; }
  h2 { font-size: 13pt; margin: 22pt 0 6pt; color: #007c46; }
  p { margin: 0 0 6pt; }
  .period { margin-bottom: 18pt; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: right; padding: 6pt 8pt; border-bottom: 1px solid #0a0a0a; }
  th:first-child, td:first-child { text-align: left; }
  th { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.04em; }
  .note { font-size: 9.5pt; margin-top: 6pt; }
  .empty { font-size: 14pt; padding: 14pt 0; }
  footer { margin-top: 28pt; padding-top: 10pt; border-top: 2px solid #007c46; font-size: 9.5pt; }
`;

const renderTable = (report: SponsorReport) => `
  <table>
    <thead>
      <tr><th>Waar</th><th>Vertoningen</th><th>Klikken</th><th>Klikratio</th></tr>
    </thead>
    <tbody>
${report.surfaces
  .map(
    ({ surface, impressions, clicks, clickThroughRate }) =>
      `      <tr><td>${SURFACE_LABEL[surface]}</td><td>${formatNumber(impressions)}</td><td>${formatNumber(clicks)}</td><td>${clickThroughRate === undefined ? "&ndash;" : formatRate(clickThroughRate)}</td></tr>`,
  )
  .join("\n")}
    </tbody>
  </table>
${
  report.teamLineClicks === undefined
    ? ""
    : `  <p>Klikken op de naam bij de ploeg: ${formatNumber(report.teamLineClicks)}</p>`
}
  <p class="note">Een vertoning is het logo van de sponsor dat minstens een seconde voor de helft in beeld stond. Klikratio staat er pas vanaf ${MIN_IMPRESSIONS_FOR_RATE} vertoningen: daaronder zegt een percentage niets. Het percentage telt enkel de klikken sinds de vertoningen gemeten worden.</p>`;

export const renderReportPage = (report: SponsorReport): string => {
  const name = escapeHtml(report.name);
  const teams =
    report.teams.length > 0
      ? escapeHtml(report.teams.join(", "))
      : "Geen ploeg gekoppeld: clubbreed";
  const spotlight =
    report.spotlightWeeks.length > 0
      ? `
  <h2>In de kijker</h2>
  <p>${report.spotlightWeeks.map((week) => `week van ${formatDate(week)}`).join(", ")}</p>`
      : "";

  return `<!doctype html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} &ndash; zichtbaarheid op kcvvelewijt.be</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>${name}</h1>
  <p class="period">Zichtbaarheid op kcvvelewijt.be, ${formatDate(report.range.from)} tot en met ${formatDate(report.range.to)}</p>
${
  report.hasData
    ? `  <h2>Zichtbaarheid per plaats</h2>${renderTable(report)}`
    : `  <p class="empty">Nog geen meetgegevens.</p>`
}
  <h2>Gesteunde ploegen</h2>
  <p>${teams}</p>${spotlight}
  <footer>
    <p>Dit zijn de gemeten aantallen: een minimum, geen schatting. Bezoekers met een adblocker, of die geen toestemming gaven voor analytische metingen, worden niet geteld.</p>
  </footer>
</body>
</html>
`;
};
