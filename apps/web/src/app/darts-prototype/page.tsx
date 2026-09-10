/**
 * PROTOTYPE — throwaway. Three variants of /darts on one route, ?variant=P|Q|R,
 * switched from the floating bar at the bottom.
 *
 * This is page 2 of two. Page 1 lives in the Gatsby repo on the same branch
 * name and looks deliberately different: same facts, own design language.
 * Owned by personal-development/.scratch/darts-tournament/issues/21-two-darts-pages-one-truth.md
 *
 * Facts come from @/data/darts.json — a verbatim copy of that map's content
 * file. Never edit the copy; edit the map's and copy it out again.
 *
 * The house language here is paper, ink and tape, not the Gatsby site's flat
 * green-on-dark. So the affiche is never full-bleed in any of these: on cream
 * paper a bleeding photo reads as a mistake, and the system already has a way
 * to put a picture on a page — you tape it down.
 */
"use client";

import Image from "next/image";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CtaBand,
  MonoLabel,
  PageContainer,
  LinkButton,
  PullQuote,
  SectionHeader,
  StampBadge,
  TapedCard,
} from "@/components/design-system";
import darts from "@/data/darts.json";

const POSTER = "/darts/poster-liggend.jpg";
const uren = darts.uren.dummy;

/** An undecided fact is shown, never hidden — the same convention affiche-copy.md
 *  uses, so a placeholder can never be mistaken for a decision. */
function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-ink-muted italic" title="Nog niet beslist">
      <span className="mr-1 text-[0.65em] tracking-[0.12em] uppercase not-italic">
        nog te beslissen
      </span>
      {children}
    </span>
  );
}

function Fact({
  value,
}: {
  value: { todo?: boolean; dummy?: string } | string;
}) {
  if (typeof value === "string") return <>{value}</>;
  return value.todo ? <Todo>{value.dummy}</Todo> : <>{String(value)}</>;
}

function Poster({ className = "" }: { className?: string }) {
  return (
    <Image
      src={POSTER}
      alt="Affiche EK Darts 2026 — zaterdag 19 december 2026, kantine KCVV Elewijt. Teams van vier personen, gegarandeerd meerdere wedstrijden, kwalificatie en eindronde voor iedereen, mooie prijzen en een vette afterparty."
      width={1920}
      height={1080}
      priority
      className={className}
    />
  );
}

/* ------------------------------------------------------------- VARIANT P -- */
/* "Papieren affiche" — page 1's agreed skeleton, translated. The poster is
   taped to the top of the page instead of bleeding off it, the facts sit in one
   ruled block underneath, and the day runs as a list. Closest sibling to the
   Gatsby page: pick this if the two sites should rhyme. */
function VariantP() {
  return (
    <div className="bg-cream py-10">
      <PageContainer width="default">
        <TapedCard rotation={-1} shadow="lift" padding="none" bg="cream">
          <Poster className="block h-auto w-full" />
        </TapedCard>

        <div className="border-ink mt-10 border-y-2 py-8">
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Wanneer", darts.datum.tekst],
              ["Waar", `${darts.waar.naam} — ${darts.waar.adres}`],
              ["Ploeg", `${darts.formule.ploeg} · ${darts.formule.ontmoeting}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="mb-2">
                  <MonoLabel tone="muted">{k}</MonoLabel>
                </dt>
                <dd className="text-ink text-lg leading-snug">{v}</dd>
              </div>
            ))}
            <div>
              <dt className="mb-2">
                <MonoLabel tone="muted">Prijs</MonoLabel>
              </dt>
              <dd className="text-ink text-lg leading-snug">
                <Fact value={darts.prijs} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-12">
          <SectionHeader title="De dag" as="h2" ruled />
          <ul className="divide-paper-edge mt-6 divide-y">
            {[
              [<Todo key="d">{uren.deuren}</Todo>, "Deuren open"],
              [
                <Todo key="w">{uren.eersteWorp}</Todo>,
                "Eerste worp — kwalificatie in groepen",
              ],
              ["—", darts.formule.verloop],
              [<Todo key="p">{uren.prijsuitreiking}</Todo>, "Prijsuitreiking"],
              ["19.15 u", darts.dj.tekst],
            ].map(([t, label], i) => (
              <li key={i} className="grid grid-cols-[10rem_1fr] gap-4 py-4">
                <span className="text-jersey-deep font-semibold">{t}</span>
                <span className="text-ink-soft">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12">
          <SectionHeader title="Reglement" as="h2" ruled />
          <p className="text-ink-soft mt-4">
            <Fact value={darts.reglement} />
          </p>
          <ul className="text-ink-soft mt-4 list-disc pl-5">
            {darts.reglement.vast.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </PageContainer>

      <div className="mt-14">
        <CtaBand
          ariaLabel="Inschrijven voor het EK Darts"
          heading="Schrijf je ploeg in"
          lead={darts.inschrijven.dummy}
          buttonLabel="Inschrijven"
          href="#inschrijven"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- VARIANT Q -- */
/* "Programmablad" — a printed match programme. Ink band across the top carrying
   the title in editorial type, the affiche demoted to a stamped card in the
   margin, and every fact as a two-column ruled row. Poster does the least work
   of the three; the typography does the most. */
function VariantQ() {
  return (
    <div className="bg-cream pb-16">
      <header className="bg-ink text-cream py-14">
        <PageContainer width="default">
          <MonoLabel tone="cream">{darts.tagline}</MonoLabel>
          <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">
            {darts.titel}
          </h1>
          <p className="text-cream/80 mt-4 text-xl">
            {darts.datum.tekst} — {darts.waar.naam}
          </p>
        </PageContainer>
      </header>

      <PageContainer width="default">
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_20rem]">
          <div>
            <SectionHeader title="Het toernooi" as="h2" ruled />
            <dl className="mt-6">
              {[
                [
                  "Formule",
                  `${darts.formule.ploeg} · ${darts.formule.ontmoeting}`,
                ],
                ["Verloop", darts.formule.verloop],
                ["Deuren", null],
                ["Eerste worp", null],
                ["Prijsuitreiking", null],
                ["Prijs per ploeg", null],
                ["Inschrijven", null],
                ["Eten en drank", null],
                ["Afterparty", darts.dj.tekst],
              ].map(([k, v]) => (
                <div
                  key={k as string}
                  className="border-paper-edge flex flex-wrap items-baseline justify-between gap-x-6 border-b border-dotted py-3"
                >
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-ink text-right">
                    {v ??
                      (k === "Deuren" ? (
                        <Todo>{uren.deuren}</Todo>
                      ) : k === "Eerste worp" ? (
                        <Todo>{uren.eersteWorp}</Todo>
                      ) : k === "Prijsuitreiking" ? (
                        <Todo>{uren.prijsuitreiking}</Todo>
                      ) : k === "Prijs per ploeg" ? (
                        <Fact value={darts.prijs} />
                      ) : k === "Inschrijven" ? (
                        <Fact value={darts.inschrijven} />
                      ) : (
                        <Fact value={darts.eten} />
                      ))}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12">
              <SectionHeader title="Reglement" as="h2" ruled />
              <p className="text-ink-soft mt-4">
                <Fact value={darts.reglement} />
              </p>
              <ul className="text-ink-soft mt-4 list-disc pl-5">
                {darts.reglement.vast.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside>
            <div className="relative">
              <StampBadge tone="jersey" rotation={-8}>
                19 dec
              </StampBadge>
              <TapedCard rotation={2} shadow="md" padding="none" bg="cream">
                <Poster className="block h-auto w-full" />
              </TapedCard>
            </div>
            <div className="mt-8">
              <LinkButton href="#inschrijven" variant="primary" withArrow>
                Inschrijven
              </LinkButton>
            </div>
          </aside>
        </div>
      </PageContainer>
    </div>
  );
}

/* ------------------------------------------------------------- VARIANT R -- */
/* "Prikbord" — everything is a taped card at a slight angle on the cream
   ground, poster included and biggest. The loudest of the three and the one
   that reads least like a document; it suits a fuif better than a reglement. */
function VariantR() {
  const cards: Array<[string, React.ReactNode, number]> = [
    ["Wanneer", darts.datum.tekst, -1.5],
    ["Waar", `${darts.waar.naam} — ${darts.waar.adres}`, 1],
    ["Formule", `${darts.formule.ploeg}. ${darts.formule.ontmoeting}.`, -0.5],
    ["Prijs", <Fact key="p" value={darts.prijs} />, 1.5],
    ["Eerste worp", <Todo key="w">{uren.eersteWorp}</Todo>, -1],
    ["Inschrijven", <Fact key="i" value={darts.inschrijven} />, 0.5],
    ["Eten en drank", <Fact key="e" value={darts.eten} />, -1],
    ["Afterparty", darts.dj.tekst, 1],
  ];
  return (
    <div className="bg-cream py-12">
      <PageContainer width="index">
        <div className="relative mx-auto max-w-3xl">
          <StampBadge tone="alert" rotation={-10}>
            {darts.tagline}
          </StampBadge>
          <TapedCard rotation={-2} shadow="lift" padding="none" bg="cream">
            <Poster className="block h-auto w-full" />
          </TapedCard>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([k, v, rot]) => (
            <TapedCard
              key={k}
              rotation={rot as never}
              shadow="soft"
              padding="md"
              bg="cream-soft"
            >
              <MonoLabel tone="muted">{k}</MonoLabel>
              <p className="text-ink mt-2 text-lg leading-snug">{v}</p>
            </TapedCard>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <TapedCard rotation={1} shadow="md" padding="lg" bg="cream">
            <SectionHeader title="Reglement" as="h2" ruled />
            <p className="text-ink-soft mt-4">
              <Fact value={darts.reglement} />
            </p>
            <ul className="text-ink-soft mt-4 list-disc pl-5">
              {darts.reglement.vast.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </TapedCard>
        </div>
      </PageContainer>
    </div>
  );
}

/* ------------------------------------------------------------- VARIANT S -- */
/* THE MIX — Kevin, 2026-09-10: "Header from P, without the first horizontal
   line between image and text (it goes from tilted to straight in a weird way,
   keep below). Titles in body and table style — but full width — from Q. Maybe
   a featured or important one in a card, but not ALL of them — waaaaaay too
   crowded."
   So: P's taped poster with only the LOWER rule under the facts, Q's ruled
   headings and dotted-leader rows at full width, and exactly two PullQuotes —
   the article-page treatment — on the two things that actually matter. */

/** The two rows that earn a card. Everything else stays in the table: a page
 *  where every fact is featured has featured nothing. */
function Featured({
  labels,
  children,
  rotation,
}: {
  labels: string[];
  children: React.ReactNode;
  rotation: -1 | 1;
}) {
  return (
    <div className="my-10">
      <PullQuote
        placement="flow"
        rotation={rotation}
        labels={labels.map((label) => ({ label }))}
      >
        {children}
      </PullQuote>
    </div>
  );
}

function VariantS() {
  const rows: Array<[string, React.ReactNode]> = [
    ["Wanneer", darts.datum.tekst],
    ["Waar", `${darts.waar.naam} — ${darts.waar.adres}`],
    ["Formule", `${darts.formule.ploeg} · ${darts.formule.ontmoeting}`],
    ["Verloop", darts.formule.verloop],
    ["Deuren", <Todo key="d">{uren.deuren}</Todo>],
    ["Eerste worp", <Todo key="w">{uren.eersteWorp}</Todo>],
    ["Prijsuitreiking", <Todo key="u">{uren.prijsuitreiking}</Todo>],
    ["Eten en drank", <Fact key="e" value={darts.eten} />],
    ["Afterparty", darts.dj.tekst],
  ];
  return (
    <div className="bg-cream pb-16">
      <PageContainer width="default">
        {/* The poster is tilted, so nothing straight goes directly under it —
            a -1° edge meeting a 0° rule reads as a mistake rather than a
            choice. The rule that closes the facts block is kept. */}
        <div className="pt-10">
          <TapedCard rotation={-1} shadow="lift" padding="none" bg="cream">
            <Poster className="block h-auto w-full" />
          </TapedCard>
        </div>

        <div className="border-ink mt-10 border-b-2 pb-8">
          <dl className="grid gap-8 sm:grid-cols-3">
            {[
              ["Wanneer", darts.datum.tekst],
              ["Waar", darts.waar.naam],
              ["Ploeg", darts.formule.ploeg],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="mb-2">
                  <MonoLabel tone="muted">{k}</MonoLabel>
                </dt>
                <dd className="text-ink text-lg leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-14">
          <SectionHeader title="Het toernooi" as="h2" ruled />
          <dl className="mt-6">
            {rows.map(([k, v]) => (
              <div
                key={k}
                className="border-paper-edge flex flex-wrap items-baseline justify-between gap-x-6 border-b border-dotted py-3"
              >
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-ink text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Featured 1 — the number everybody asks first, and the one still open. */}
        <Featured labels={["Prijs per ploeg"]} rotation={-1}>
          {darts.prijs.dummy} — vier spelers, dus{" "}
          {Math.round(Number(darts.prijs.dummy.replace(/[^\d]/g, "")) / 4)} euro
          per kop. Nog niet beslist.
        </Featured>

        <div className="mt-4">
          <SectionHeader title="Inschrijven" as="h2" ruled />
          <p className="text-ink-soft mt-4">
            <Fact value={darts.inschrijven} />
          </p>
        </div>

        <div className="mt-14">
          <SectionHeader title="Reglement" as="h2" ruled />
          <p className="text-ink-soft mt-4">
            <Fact value={darts.reglement} />
          </p>
        </div>

        {/* Featured 2 — the one rule that costs 70 euro a board if it is missed. */}
        <Featured labels={["Reglement", "Verplicht"]} rotation={1}>
          {darts.reglement.vast[0]}
        </Featured>
      </PageContainer>
    </div>
  );
}

/* ------------------------------------------------------------ THE SWITCHER  */
const VARIANTS: Record<
  string,
  { name: string; render: () => React.ReactElement }
> = {
  P: { name: "Papieren affiche", render: () => <VariantP /> },
  Q: { name: "Programmablad", render: () => <VariantQ /> },
  R: { name: "Prikbord", render: () => <VariantR /> },
  S: { name: "De mix (P+Q)", render: () => <VariantS /> },
};
const KEYS = Object.keys(VARIANTS);

function Switcher({ current }: { current: string }) {
  const router = useRouter();
  const go = (step: number) => {
    const i = (KEYS.indexOf(current) + step + KEYS.length) % KEYS.length;
    router.replace(`?variant=${KEYS[i]}`, { scroll: false });
  };
  return (
    <div className="bg-ink text-cream fixed bottom-5 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-full px-3 py-2 font-mono text-sm shadow-2xl">
      <button
        onClick={() => go(-1)}
        aria-label="Vorige variant"
        className="px-1 text-lg"
      >
        ←
      </button>
      <span className="min-w-[16ch] text-center">
        {current} — {VARIANTS[current].name}
      </span>
      <button
        onClick={() => go(1)}
        aria-label="Volgende variant"
        className="px-1 text-lg"
      >
        →
      </button>
    </div>
  );
}

function Prototype() {
  const asked = useSearchParams().get("variant") ?? "S";
  const current = KEYS.includes(asked) ? asked : "S";
  return (
    <>
      {VARIANTS[current].render()}
      {/* Gated so a stray merge can never ship the bar to a visitor. */}
      {process.env.NODE_ENV !== "production" && <Switcher current={current} />}
    </>
  );
}

export default function DartsPrototypePage() {
  /* useSearchParams needs a Suspense boundary in the App Router. */
  return (
    <Suspense fallback={<div className="bg-cream min-h-screen" />}>
      <Prototype />
    </Suspense>
  );
}
