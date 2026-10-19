/**
 * Daily birthday post to Slack `#general` (#3570), replacing the Drupal one.
 * Reads Sanity only (one GROQ query, zero PSD calls) and posts at most two
 * messages: today's birthdays, plus on Mondays the Monday-to-Sunday list.
 * Dispatched from its own cron in `index.ts`, never inside the nightly sync.
 * The matching is pure so it is unit-tested without a clock, Slack or Sanity.
 */
import { Effect } from "effect";
import { WorkerEnvTag } from "../env";
import { SanityProjection, type BirthdayPerson } from "../sanity/projection";
import { escapeSlack, postSlack } from "../psd/slack-alert";

export const BIRTHDAY_JOB = "birthday-post";

/** Must match wrangler.toml. 07:00 UTC is 08:00/09:00 in Brussels, same calendar day. */
export const BIRTHDAY_CRON = "0 7 * * *";

export interface Birthday {
  readonly person: BirthdayPerson;
  /** The age they turn on `date`. */
  readonly age: number;
  /** "YYYY-MM-DD" of the celebration. */
  readonly date: string;
}

export class BirthdaySlackError extends Error {
  readonly _tag = "BirthdaySlackError" as const;
  constructor() {
    super("Slack did not confirm the birthday message");
    this.name = "BirthdaySlackError";
  }
}

const DAYS = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];
const MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

const BRUSSELS_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Brussels",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar date in Belgium at `now` ("YYYY-MM-DD") — never the UTC date. */
export const brusselsDate = (now: Date): string => BRUSSELS_DATE.format(now);

const toUtc = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

const isLeap = (y: number): boolean =>
  (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Monday through Sunday of the week containing `iso`, as "YYYY-MM-DD". */
export function weekOf(iso: string): string[] {
  const day = toUtc(iso).getUTCDay(); // 0 = Sunday
  const monday = toUtc(iso).getTime() - ((day + 6) % 7) * 86_400_000;
  return Array.from({ length: 7 }, (_, i) =>
    new Date(monday + i * 86_400_000).toISOString().slice(0, 10),
  );
}

/** The month-day ("MM-DD") a person celebrates in `year`. Born 29 February: celebrates on 28 February in a non-leap year. */
function celebrationMonthDay(birthDate: string, year: number): string {
  const monthDay = birthDate.slice(5, 10);
  return monthDay === "02-29" && !isLeap(year) ? "02-28" : monthDay;
}

/** Everyone whose birthday falls on `iso`; people born that very day or later are skipped. */
export function birthdaysOn(
  people: readonly BirthdayPerson[],
  iso: string,
): Birthday[] {
  const year = Number(iso.slice(0, 4));
  return people
    .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.birthDate))
    .filter((p) => celebrationMonthDay(p.birthDate, year) === iso.slice(5, 10))
    .map((person) => ({
      person,
      age: year - Number(person.birthDate.slice(0, 4)),
      date: iso,
    }))
    .filter((b) => b.age > 0)
    .sort((a, b) => a.person.name.localeCompare(b.person.name, "nl"));
}

const line = ({ person, age }: Birthday): string =>
  `• ${escapeSlack(person.name)}${
    person.label ? ` (${escapeSlack(person.label)})` : ""
  } wordt ${age}`;

const dayLabel = (iso: string): string => {
  const d = toUtc(iso);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

/** The messages for the day `iso`: today's birthdays, plus the week's on a Monday. Empty days post nothing. */
export function buildBirthdayMessages(
  people: readonly BirthdayPerson[],
  iso: string,
): string[] {
  const messages: string[] = [];
  const today = birthdaysOn(people, iso);
  if (today.length > 0) {
    messages.push(
      [":birthday: *Vandaag jarig*", ...today.map(line)].join("\n"),
    );
  }
  if (toUtc(iso).getUTCDay() === 1) {
    const week = weekOf(iso).flatMap((d) => birthdaysOn(people, d));
    if (week.length > 0) {
      messages.push(
        [
          ":calendar: *Verjaardagen deze week*",
          ...week.map((b) => `${line(b)} — ${dayLabel(b.date)}`),
        ].join("\n"),
      );
    }
  }
  return messages;
}

export const runBirthdayPost = (now: Date) =>
  Effect.gen(function* () {
    const webhook = (yield* WorkerEnvTag).SLACK_BIRTHDAY_WEBHOOK_URL;
    // No webhook (staging, local) → nothing could be delivered, so skip the read too.
    if (!webhook) return;
    const people = yield* (yield* SanityProjection).getBirthdayPeople();
    for (const text of buildBirthdayMessages(people, brusselsDate(now))) {
      const delivered = yield* Effect.promise(() => postSlack(webhook, text));
      // The message IS this job's output: undelivered means the job did not run.
      if (!delivered) return yield* Effect.fail(new BirthdaySlackError());
    }
  });
