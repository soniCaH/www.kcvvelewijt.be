"use client";

// Renders plain Phosphor-Fill icons (`@/lib/icons.redesign`) directly. Phosphor
// pulls `createContext` (IconContext) at module load, which breaks `next build`
// when evaluated in the server graph — so this presentational page component is
// a client boundary. Data fetching stays in the server route (page.tsx), which
// passes the serializable `keyContacts` down as props.

/**
 * ContactPage — `/club/contact` on the retro-terrace-fanzine system
 * (design contract 10k1, owner-approved 2026-06-15).
 *
 *   <PageHero> (kicker "Club", warm "." headline)
 *     → <StripedSeam>
 *     → Clubgegevens (paper card: address · e-mail · cross-links) + <MapEmbed>
 *     → "Contacteer ons." — one merged grid of paper cards: dynamic
 *       `keyContacts` + static `CONTACT_CATEGORIES`, deduped on e-mail
 *       (a key contact covering an address drops the matching category).
 *     → "Kom naar ons." — Parking · Inkom (jersey-deep prices table) ·
 *       Kantine · Toegankelijkheid.
 *
 * Replaces the legacy gradient-hero + Lucide + green-icon-box composition.
 * Icons are plain Phosphor Fill (jersey-deep, no box) via `@/lib/icons.redesign`.
 */

import Link from "next/link";
import {
  ArrowRight,
  Car,
  Coffee,
  Envelope,
  MapPin,
  Ticket,
  Wheelchair,
} from "@/lib/icons.redesign";
import {
  EditorialHeading,
  PageContainer,
  StripedSeam,
  TapedCard,
} from "@/components/design-system";
import { PageHero } from "@/components/layout";
import { HtmlTableBlock } from "@/components/article/blocks/HtmlTableBlock/HtmlTableBlock";
import { MapEmbed } from "./MapEmbed";
import type { KeyContactVM } from "@/lib/repositories/staff.repository";

interface ContactPageProps {
  keyContacts?: KeyContactVM[];
}

interface ContactCategory {
  label: string;
  email: string;
  description: string;
}

const CONTACT_CATEGORIES: ContactCategory[] = [
  {
    label: "Algemene vragen",
    email: "info@kcvvelewijt.be",
    description: "Algemene informatie over de club",
  },
  {
    label: "Jeugdwerking",
    email: "jeugd@kcvvelewijt.be",
    description: "Inschrijvingen, stages en jeugdactiviteiten",
  },
  {
    label: "Sponsoring",
    email: "sponsoring@kcvvelewijt.be",
    description: "Partnerschappen en sponsormogelijkheden",
  },
  {
    label: "Webmaster",
    email: "kevin@kcvvelewijt.be",
    description: "Technische vragen over de website",
  },
];

/** Inkom prices rendered through the `<HtmlTableBlock>` idiom (jersey-deep
 *  header band). Sanitised on render; only structural table tags survive. */
const PRICES_TABLE_HTML = `<table>
  <thead><tr><th>Wedstrijd</th><th>Prijs</th></tr></thead>
  <tbody>
    <tr><td>Jeugd</td><td>€3</td></tr>
    <tr><td>B-ploeg</td><td>€5</td></tr>
    <tr><td>A-ploeg</td><td>€10</td></tr>
  </tbody>
</table>`;

/** A unified contact-grid card — a dynamic key contact OR a static category,
 *  normalised so both render with one mono tag, an optional title/body, and a
 *  mailto link. */
interface ContactGridCard {
  key: string;
  tag: string;
  name?: string;
  description?: string;
  email: string;
}

// Shared chrome -------------------------------------------------------------

const MONO_TAG =
  "text-jersey-deep font-mono text-[10px] font-semibold tracking-[0.12em] uppercase";
const ICON_TITLE = "text-ink text-[1.05rem] font-bold";
// Generic jersey-deep inline-action chrome — shared by the mailto links AND
// the "Routebeschrijving" map link.
const INLINE_LINK =
  "text-jersey-deep mt-2 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline";
const CARD_BODY = "text-ink-soft text-[0.95rem] leading-relaxed";
const CROSS_LINK =
  "group border-ink bg-cream-soft hover:bg-cream-deep flex items-center justify-between gap-3 border p-3 transition-colors";

function SectionHeading({ children }: { children: string }) {
  return (
    <EditorialHeading
      level={2}
      size="display-md"
      emphasis={{ text: ".", tone: "warm" }}
      className="mb-6"
    >
      {children}
    </EditorialHeading>
  );
}

/** A boxed cross-link row in the Clubgegevens card (hulpvinder, organigram). */
function CrossLink({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub: string;
}) {
  return (
    <Link href={href} className={CROSS_LINK}>
      <span>
        <span className="text-ink block text-[0.9rem] font-bold">{title}</span>
        <span className="text-ink-soft mt-0.5 block text-[0.8rem]">{sub}</span>
      </span>
      <ArrowRight
        size={16}
        className="text-jersey-deep shrink-0 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------

export function ContactPage({ keyContacts }: ContactPageProps = {}) {
  const keyContactCards: ContactGridCard[] = (keyContacts ?? []).map(
    (contact, index) => ({
      key: `kc-${contact.email}-${index}`,
      tag: contact.role,
      name: contact.name,
      email: contact.email,
    }),
  );

  // A key contact already exposing an address makes the matching static
  // category redundant (e.g. the Jeugdcoördinator covers jeugd@ → drop the
  // "Jeugdwerking" bucket). Dedupe on a case-insensitive e-mail match.
  const coveredEmails = new Set(
    keyContactCards.map((card) => card.email.toLowerCase()),
  );
  const categoryCards: ContactGridCard[] = CONTACT_CATEGORIES.filter(
    (category) => !coveredEmails.has(category.email.toLowerCase()),
  ).map((category) => ({
    key: `cat-${category.email}`,
    tag: category.label,
    description: category.description,
    email: category.email,
  }));

  const contactCards = [...keyContactCards, ...categoryCards];

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero */}
      <PageContainer className="pt-10 pb-12">
        <PageHero
          kicker="Club"
          headline="Contact"
          lead="Heb je een vraag? We helpen je graag verder."
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Clubgegevens + map */}
      <PageContainer className="py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TapedCard bg="cream" shadow="sm" padding="lg">
            <EditorialHeading
              level={2}
              size="display-md"
              emphasis={{ text: ".", tone: "warm" }}
            >
              Clubgegevens
            </EditorialHeading>

            <div className="mt-6 space-y-6">
              {/* Address */}
              <div>
                <div className="flex items-center gap-2.5">
                  <MapPin
                    size={22}
                    className="text-jersey-deep shrink-0"
                    aria-hidden
                  />
                  <span className={ICON_TITLE}>Adres</span>
                </div>
                <div className="mt-2">
                  <p className={CARD_BODY}>Driesstraat 32</p>
                  <p className={CARD_BODY}>1982 Elewijt (Zemst)</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Driesstraat+32,+1982+Elewijt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={INLINE_LINK}
                >
                  Routebeschrijving
                  <ArrowRight size={14} className="shrink-0" aria-hidden />
                </a>
              </div>

              {/* E-mail */}
              <div>
                <div className="flex items-center gap-2.5">
                  <Envelope
                    size={22}
                    className="text-jersey-deep shrink-0"
                    aria-hidden
                  />
                  <span className={ICON_TITLE}>E-mail</span>
                </div>
                <a href="mailto:info@kcvvelewijt.be" className={INLINE_LINK}>
                  info@kcvvelewijt.be
                </a>
              </div>

              {/* Cross-links */}
              <div className="space-y-2.5">
                <CrossLink
                  href="/hulp"
                  title="Weet je niet wie je moet contacteren?"
                  sub="Gebruik onze hulpvinder"
                />
                <CrossLink
                  href="/hulp#structuur"
                  title="Bekijk het volledige organigram"
                  sub="Alle bestuursleden en contactgegevens"
                />
              </div>
            </div>
          </TapedCard>

          {/* OpenStreetMap, no consent needed — paper-framed */}
          <MapEmbed />
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Contacteer ons — merged + deduped grid */}
      <PageContainer className="py-12">
        <SectionHeading>Contacteer ons</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contactCards.map((card) => (
            <TapedCard key={card.key} bg="cream" shadow="sm" padding="md">
              <p className={MONO_TAG}>{card.tag}</p>
              {card.name ? (
                <p className="text-ink mt-1 font-bold">{card.name}</p>
              ) : null}
              {card.description ? (
                <p className="text-ink-soft mt-1 text-sm leading-relaxed">
                  {card.description}
                </p>
              ) : null}
              <a href={`mailto:${card.email}`} className={INLINE_LINK}>
                <Envelope size={16} className="shrink-0" aria-hidden />
                {card.email}
              </a>
            </TapedCard>
          ))}
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Kom naar ons — venue & matchday info */}
      <PageContainer className="py-12">
        <SectionHeading>Kom naar ons</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Parking */}
          <TapedCard bg="cream" shadow="sm" padding="md">
            <div className="flex items-center gap-2.5">
              <Car
                size={22}
                className="text-jersey-deep shrink-0"
                aria-hidden
              />
              <span className={ICON_TITLE}>Parking</span>
            </div>
            {/* TODO: add gemeente Zemst parking plan URL once confirmed */}
            <p className={`mt-3 ${CARD_BODY}`}>
              Parkeren kan aan het voetbalveld en rondom het Van Innis
              sportpark. Een gedetailleerd parkeerplan vind je op de website van
              de gemeente Zemst.
            </p>
          </TapedCard>

          {/* Inkom */}
          <TapedCard bg="cream" shadow="sm" padding="md">
            <div className="flex items-center gap-2.5">
              <Ticket
                size={22}
                className="text-jersey-deep shrink-0"
                aria-hidden
              />
              <span className={ICON_TITLE}>Inkom</span>
            </div>
            {/* `mt-3!`/`mb-0!` override HtmlTableBlock's default `my-6` so the
                prices table sits tight under the header inside the card. */}
            <HtmlTableBlock html={PRICES_TABLE_HTML} className="mt-3! mb-0!" />
          </TapedCard>

          {/* Kantine */}
          <TapedCard bg="cream" shadow="sm" padding="md">
            <div className="flex items-center gap-2.5">
              <Coffee
                size={22}
                className="text-jersey-deep shrink-0"
                aria-hidden
              />
              <span className={ICON_TITLE}>Kantine</span>
            </div>
            <p className={`mt-3 ${CARD_BODY}`}>
              De kantine is open op trainingsdagen:
            </p>
            <ul className={`mt-1 list-disc space-y-1 pl-5 ${CARD_BODY}`}>
              <li>Woensdag &amp; vrijdag: vanaf 18u00</li>
              <li>Donderdag: vanaf 20u00</li>
            </ul>
            <p className={`mt-2 ${CARD_BODY}`}>
              Op wedstrijddagen zijn er geen vaste uren.
            </p>
          </TapedCard>

          {/* Toegankelijkheid */}
          <TapedCard bg="cream" shadow="sm" padding="md">
            <div className="flex items-center gap-2.5">
              <Wheelchair
                size={22}
                className="text-jersey-deep shrink-0"
                aria-hidden
              />
              <span className={ICON_TITLE}>Toegankelijkheid</span>
            </div>
            <p className={`mt-3 ${CARD_BODY}`}>
              Het sportpark is toegankelijk voor rolstoelgebruikers. Er zijn 2
              voorbehouden parkeerplaatsen beschikbaar.
            </p>
          </TapedCard>
        </div>
      </PageContainer>
    </div>
  );
}
