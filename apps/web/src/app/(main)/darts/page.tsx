/**
 * /darts — EK Darts 2026, zaterdag 19 december.
 *
 * The affiche carries a QR to this URL, so it exists on both club sites: the
 * Gatsby build serves the printed one today, this one serves it after the
 * switch. Same facts, deliberately not the same design.
 *
 * ⚠️ `darts.json` is a COPY. The source of truth is
 * personal-development/.scratch/darts-tournament/content/darts.json and the
 * Gatsby site holds the other copy. Never edit facts here — edit the source and
 * copy it to both, in the same session. Two pages that disagree are worse than
 * one page.
 *
 * Layout decided by prototype 2026-09-10 (branch `prototype/darts-page`,
 * `/darts-prototype?variant=P|Q|R|S`), issue 21 in the darts map: taped poster
 * opening, ruled headings, dotted-leader rows at full width, and exactly two
 * featured cards. Not three, not nine — a page where every fact is featured has
 * featured nothing.
 *
 * Nothing here is invented. `<PageHero register="band" tone="cream">` IS the
 * taped-card opening that was picked — it is the site's shared page opening and
 * renders a cream `<TapedCard>`, so the design and the rule agree rather than
 * compete. Rows are `<LeaderDotRow>`, headings `<SectionHeader>`, the two
 * highlights `<PullQuote>` — the same component article pages use for a
 * blockquote.
 */
import type { Metadata } from "next";
import {
  LeaderDotRow,
  PageContainer,
  PullQuote,
  SectionHeader,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import darts from "@/data/darts.json";

const POSTER = "/darts/poster-liggend.jpg";

/* ⚠️ This describes the affiche for the OG image ONLY — it is the `ogImage.alt`
   below, and nothing else. `<PageHero>` renders its image with a hard-coded
   `alt=""` and takes no alt parameter, which is a deliberate site-wide decision
   (#2559 / #2548 rule 1): the hero image sits beside the h1 that names it, so a
   photograph would only repeat the words.
   That premise does not hold here — this image is not a photograph, it is an
   information graphic — so the fix is NOT to punch an `imageAlt` prop through a
   component 31 routes share. It is to make sure nothing lives only in the
   picture. Everything the affiche says now exists as text on this page,
   `watJeKrijgt` included, so `alt=""` is the correct answer rather than a lucky
   one. Found by a reviewer on PR #2908. */
const POSTER_ALT =
  "Affiche EK Darts 2026 — zaterdag 19 december 2026, kantine KCVV Elewijt. " +
  "Teams van vier personen, gegarandeerd meerdere wedstrijden, kwalificatie en " +
  "eindronde voor iedereen, mooie prijzen en een vette afterparty.";

const uren = darts.uren.dummy;

/* An undecided fact is marked in place, never hidden — the convention
   affiche-copy.md already uses, so poster and page mark a missing decision the
   same way. `<LeaderDotRow value>` takes a string, not a node, so the marker is
   words rather than italics: it survives being read aloud, which italics do not. */
const open = (dummy: string) => `nog te beslissen — ${dummy}`;

export const metadata: Metadata = buildPageMetadata({
  title: "EK Darts 2026 — zaterdag 19 december",
  description: `${darts.tagline}. ${darts.datum.tekst}, ${darts.waar.naam}. ${darts.formule.ploeg}, ${darts.formule.ontmoeting}.`,
  path: "/darts",
  ogImage: { url: POSTER, width: 1920, height: 1080, alt: POSTER_ALT },
});

const ROWS: Array<{ label: string; value: string }> = [
  { label: "Wanneer", value: darts.datum.tekst },
  { label: "Waar", value: `${darts.waar.naam} — ${darts.waar.adres}` },
  {
    label: "Formule",
    value: `${darts.formule.ploeg} · ${darts.formule.ontmoeting}`,
  },
  { label: "Verloop", value: darts.formule.verloop },
  { label: "Deuren", value: open(uren.deuren) },
  { label: "Eerste worp", value: open(uren.eersteWorp) },
  { label: "Prijsuitreiking", value: open(uren.prijsuitreiking) },
  { label: "Eten en drank", value: open(darts.eten.dummy) },
  { label: "Afterparty", value: darts.dj.tekst },
];

export default function DartsPage() {
  return (
    <>
      {/* The opening gets its own container with the site's standard vertical
          rhythm — `pt-10 pb-12`, the same as /club. Without the top padding the
          taped card and its tape strip butt straight into the nav, which is what
          shipped for one round. `band` owns the space it sits in; it does not
          create it. */}
      <PageContainer width="default" className="pt-10 pb-12">
        <PageHero
          register="band"
          tone="cream"
          kicker={darts.tagline}
          headline={darts.titel}
          lead={`${darts.datum.tekst} — ${darts.waar.naam}`}
          image={POSTER}
          cta={{ label: "Inschrijven", href: "#inschrijven" }}
        />
      </PageContainer>

      <PageContainer width="default">
        <section className="mt-14" aria-labelledby="het-toernooi">
          <SectionHeader title="Het toernooi" as="h2" ruled />
          <dl className="mt-6">
            {ROWS.map((r) => (
              <LeaderDotRow key={r.label} label={r.label} value={r.value} />
            ))}
          </dl>
        </section>

        {/* Featured 1 — the number everybody asks first, and it is still open. */}
        <div className="my-10">
          <PullQuote
            placement="flow"
            rotation={-1}
            labels={[{ label: "Prijs per ploeg" }]}
          >
            {`${darts.prijs.dummy} voor een ploeg van vier. Nog niet beslist — dit cijfer staat er om de pagina te kunnen lezen, niet om op te rekenen.`}
          </PullQuote>
        </div>

        {/* The affiche's own promise, in text. Two of these bullets — the
            guaranteed matches and the prizes — existed nowhere but inside the
            poster image until PR #2908. A fact that lives only in a picture does
            not exist for anyone who cannot see the picture. */}
        <section className="mt-14">
          <SectionHeader title="Wat je krijgt" as="h2" ruled />
          <ul className="text-ink-soft mt-4 list-disc pl-5">
            {darts.watJeKrijgt.punten.map((punt) => (
              <li key={punt}>{punt}</li>
            ))}
          </ul>
        </section>

        <section
          className="mt-4"
          id="inschrijven"
          aria-labelledby="inschrijven-titel"
        >
          <SectionHeader title="Inschrijven" as="h2" ruled />
          <p className="text-ink-soft mt-4">{open(darts.inschrijven.dummy)}</p>
        </section>

        <section className="mt-14">
          <SectionHeader title="Reglement" as="h2" ruled />
          <p className="text-ink-soft mt-4">{open(darts.reglement.dummy)}</p>
        </section>

        {/* Featured 2 — the one rule that costs €70 a board when it is missed. */}
        <div className="my-10">
          <PullQuote
            placement="flow"
            rotation={1}
            labels={[{ label: "Reglement" }, { label: "Verplicht" }]}
          >
            {darts.reglement.vast[0]}
          </PullQuote>
        </div>

        <p className="text-ink-muted mb-16 text-sm">{darts.wettelijk.regel}</p>
      </PageContainer>
    </>
  );
}
