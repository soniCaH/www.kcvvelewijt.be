/**
 * /darts — EK Darts 2026, zaterdag 19 december.
 *
 * The affiche carries a QR to this URL, so it must always answer 200.
 *
 * ⚠️ `darts.json` is a COPY of Kevin's source file
 * personal-development/.scratch/darts-tournament/content/darts.json. Never edit
 * facts here — edit the source and copy it in. This repo holds the only copy on
 * the web side (the old Gatsby site is gone). The BFF reads the very same file for
 * the signup mails and the closing date (#3812), so the form, the page and the
 * mails cannot disagree. The start and end hour also live in the Sanity event
 * `EK Darts`; change both together.
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
import {
  DartsSignup,
  DartsSignupCta,
} from "@/components/darts/DartsSignup/DartsSignup";
import darts from "@/data/darts.json";

const POSTER = "/darts/poster-liggend-v2.jpg";

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
  `Teams van vier personen, ${darts.watJeKrijgt.punten.join(", ").toLowerCase()}.`;

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
  { label: "Deuren", value: darts.uren.deuren },
  { label: "Eerste worp", value: darts.uren.eersteWorp },
  { label: "Prijsuitreiking", value: darts.uren.prijsuitreiking },
  { label: "Einde", value: darts.uren.einde },
  { label: "Eten en drank", value: open(darts.eten.dummy) },
  { label: "Muziek", value: darts.muziek.tekst },
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
        >
          <DartsSignupCta />
        </PageHero>
      </PageContainer>

      <PageContainer width="default">
        <section className="mt-14" aria-label="Het toernooi">
          <SectionHeader title="Het toernooi" as="h2" ruled />
          <dl>
            {ROWS.map((r) => (
              <LeaderDotRow key={r.label} label={r.label} value={r.value} />
            ))}
          </dl>
        </section>

        {/* Featured 1 — the number everybody asks first. */}
        <div className="my-10">
          <PullQuote
            placement="flow"
            rotation={-1}
            labels={[{ label: "Prijs per ploeg" }]}
          >
            {`${darts.prijs.tekst} — een ploeg is vier spelers.`}
          </PullQuote>
        </div>

        {/* The affiche's own promise, in text. Two of these bullets — the
            guaranteed matches and the prizes — existed nowhere but inside the
            poster image until PR #2908. A fact that lives only in a picture does
            not exist for anyone who cannot see the picture. */}
        <section className="mt-14">
          <SectionHeader title="Wat je krijgt" as="h2" ruled />
          <ul className="text-ink list-disc pl-5">
            {darts.watJeKrijgt.punten.map((punt) => (
              <li key={punt}>{punt}</li>
            ))}
          </ul>
        </section>

        {/* The page stays static. The block closes itself after the event day
            and reads the spots left per request — both in the browser. */}
        <DartsSignup />

        <section className="mt-14">
          <SectionHeader title="Reglement" as="h2" ruled />
          <p className="text-ink">{open(darts.reglement.dummy)}</p>
        </section>

        {/* Featured 2 — the one rule that costs €70 a board when it is missed.
            `darts.wettelijk.regel` ("Verboden op de openbare weg te gooien") is
            for print only: it stays in the JSON and is not rendered here. */}
        <div className="mt-10 mb-16">
          <PullQuote
            placement="flow"
            rotation={1}
            labels={[{ label: "Reglement" }, { label: "Verplicht" }]}
          >
            {darts.reglement.vast[0]}
          </PullQuote>
        </div>
      </PageContainer>
    </>
  );
}
