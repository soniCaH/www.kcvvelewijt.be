import {
  DARTS_TEAM_LIMIT,
  dartsPriceAmount,
  type DartsSignupRequest,
} from "@kcvv/api-contract";
// One source for the event facts: the web app's own file, never a typed copy
// (#3812). The worker bundles it at deploy time.
import darts from "../../../web/src/data/darts.json";
import type { EmailMessage } from "../email/resend";
import { esc, shell } from "./membership-emails";

/** The club's own copy of every signup. Lives here, not in `formRoutingConfig`. */
export const DARTS_CLUB_EMAIL = "kevin@kcvvelewijt.be";

const SIGN_OFF = "KCVV Elewijt — er is maar 1 plezante compagnie";
const INFO_LINK = "kcvvelewijt.be/darts";

const EVENT_DAY = new Intl.DateTimeFormat("nl-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Brussels",
});

/** "2026-12-19" → "zaterdag 19 december", the way the approved copy writes it. */
export const formatEventDay = (iso: string): string =>
  EVENT_DAY.format(new Date(`${iso}T12:00:00Z`));

/** A paragraph (lines split by `\n`) or a bullet list. */
type Block = string | { readonly list: ReadonlyArray<string> };

const renderText = (blocks: ReadonlyArray<Block>): string =>
  blocks
    .map((b) =>
      typeof b === "string" ? b : b.list.map((i) => `- ${i}`).join("\n"),
    )
    .join("\n\n");

const linkify = (escaped: string): string =>
  escaped.replace(
    INFO_LINK,
    `<a href="https://www.${INFO_LINK}">${INFO_LINK}</a>`,
  );

const renderHtml = (title: string, blocks: ReadonlyArray<Block>): string =>
  shell(
    esc(title),
    blocks
      .map((b) =>
        typeof b === "string"
          ? `<p>${linkify(esc(b)).replace(/\n/g, "<br>")}</p>`
          : `<ul>${b.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`,
      )
      .join("\n  "),
  );

const toMessage = (
  to: string,
  subject: string,
  blocks: ReadonlyArray<Block>,
  replyTo: string,
): EmailMessage => ({
  to,
  subject,
  html: renderHtml("EK Darts", blocks),
  text: renderText(blocks),
  replyTo,
});

const oneLine = (value: string): string => value.replace(/\s*\r?\n\s*/g, " ");

/** Mail 1: signup received, how to pay. Names the bank transfer only. */
const captainMail = (p: DartsSignupRequest): EmailMessage =>
  toMessage(
    p.captainEmail,
    `EK Darts: ${oneLine(p.teamName)} is ingeschreven — nog even betalen`,
    [
      `Hallo ${p.captainName},`,
      `Top: ${p.teamName} staat op de lijst voor het EK Darts, ${formatEventDay(darts.datum.iso)} in de kantine van KCVV Elewijt.`,
      `Nog één ding: jullie plaats is pas zeker als de ${dartsPriceAmount(darts.prijs.tekst)} betaald is. Schrijf het bedrag over naar ${darts.betaling.iban} (${darts.betaling.rekeninghouder}), met als mededeling: ${darts.betaling.mededeling.replace("{ploegnaam}", () => p.teamName)}`,
      "Zodra we de betaling zien, krijg je een tweede mail met de uren van de dag.",
      `Alle info en het reglement: ${INFO_LINK}\nIets veranderen of een vraag? Antwoord gewoon op deze mail.`,
      `Tot op het EK!\n${SIGN_OFF}`,
    ],
    DARTS_CLUB_EMAIL,
  );

/** Mail 3: on the wachtlijst, no payment details. */
const waitlistMail = (
  p: DartsSignupRequest,
  waitNumber: number,
): EmailMessage =>
  toMessage(
    p.captainEmail,
    `EK Darts: ${oneLine(p.teamName)} staat op de wachtlijst`,
    [
      `Hallo ${p.captainName},`,
      `Merci voor jullie inschrijving! Alle ${DARTS_TEAM_LIMIT} plaatsen zijn op dit moment ingenomen, dus ${p.teamName} staat als ${waitNumber}e op de wachtlijst. Betalen hoeft nog niet.`,
      "Valt er een ploeg af, dan laten we het meteen weten. In Elewijt gebeurt er altijd wel iets op het laatste moment.",
      `Tot misschien op het EK!\n${SIGN_OFF}`,
    ],
    DARTS_CLUB_EMAIL,
  );

/** Mail 4: the club's copy; replying goes to the captain. */
const clubMail = (
  p: DartsSignupRequest,
  place: { waitlist: boolean; number: number },
): EmailMessage => {
  const { number } = place;
  // The place, worded once for the subject, the Status line and the closing line.
  const status = place.waitlist
    ? {
        subject: `wachtlijst ${number}`,
        line: `wachtlijst ${number}`,
        closing: "Komt er een plaats vrij? Laat het deze ploeg zelf weten.",
      }
    : {
        subject: `ploeg ${number}/${DARTS_TEAM_LIMIT}`,
        line: `ploeg ${number} van ${DARTS_TEAM_LIMIT}`,
        closing: `Zet "Betaald" aan in de Studio zodra de ${dartsPriceAmount(darts.prijs.tekst)} binnen is: dan vertrekt mail 2.`,
      };
  return toMessage(
    DARTS_CLUB_EMAIL,
    `EK Darts: ${oneLine(p.teamName)} — ${status.subject}`,
    [
      "Nieuwe inschrijving via kcvvelewijt.be/darts",
      [
        `Ploegnaam: ${p.teamName}`,
        `Kapitein: ${p.captainName}`,
        `E-mail: ${p.captainEmail}`,
        `Gsm: ${p.captainPhone}`,
        ...(p.remark ? [`Opmerking: ${oneLine(p.remark)}`] : []),
        `Status: ${status.line}`,
      ].join("\n"),
      status.closing,
    ],
    p.captainEmail,
  );
};

/**
 * The mails that go out at signup: captain (mail 1, or mail 3 on the
 * wachtlijst) plus the club copy (mail 4). `number` is the team's spot, or its
 * place on the wachtlijst, counted by the caller at submit time.
 */
export const buildDartsSignupEmails = (input: {
  payload: DartsSignupRequest;
  waitlist: boolean;
  number: number;
}): EmailMessage[] => [
  input.waitlist
    ? waitlistMail(input.payload, input.number)
    : captainMail(input.payload),
  clubMail(input.payload, { waitlist: input.waitlist, number: input.number }),
];

/** Mail 2: payment seen, the place is sure, the hours of the day. */
export const buildDartsPaidEmail = (input: {
  teamName: string;
  captainName: string;
  captainEmail: string;
}): EmailMessage =>
  toMessage(
    input.captainEmail,
    `EK Darts: ${oneLine(input.teamName)} is er zeker bij`,
    [
      `Hallo ${input.captainName},`,
      `Betaling ontvangen, merci! ${input.teamName} is er zeker bij op ${formatEventDay(darts.datum.iso)}.`,
      "Zo begint de dag:",
      {
        list: [
          `${darts.uren.deuren} — deuren open`,
          `tot ${darts.uren.aanmeldenTot} — aanmelden aan het onthaal, met jullie vier spelers`,
          `${darts.uren.eersteWorp} — eerste pijl`,
        ],
      },
      "Kom op tijd: na het aanmelden worden de groepen geloot.",
      "Neem je eigen pijlen mee, met stalen punt. Pijlen met weerhaakjes zijn verboden: die trekken de sisal uit het bord. Twijfel je? Toon ze bij het onthaal.",
      "Spelers wisselen kan tot het aanmelden.",
      `Kantine KCVV Elewijt, Driesstraat 32, 1982 Elewijt\nAlle info en het reglement: ${INFO_LINK}`,
      `Game on!\n${SIGN_OFF}`,
    ],
    DARTS_CLUB_EMAIL,
  );
