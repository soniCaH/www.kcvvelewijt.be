import { DateTime } from "luxon";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { TapedCard } from "@/components/design-system";
import { getButtonClasses } from "@/components/design-system/Button";
import {
  DEFAULT_TICKET_LABEL,
  formatTimeRange,
  resolveEventRange,
  type EventFactValue,
  type ResolvedEvent,
  type ResolvedEventRange,
  type ResolvedSession,
} from "../EventFact/types";
import { cn } from "@/lib/utils/cn";

export interface EventDetailBlockProps {
  value: EventFactValue;
  isPast: boolean;
  className?: string;
}

/**
 * True when the eventFact carries detail beyond what the locked
 * `<EventStrip>` shows in the hero: a multi-day schedule, a venue
 * address, a capacity ceiling, or an editor-authored note.
 */
export function shouldRenderEventDetailBlock(value: EventFactValue): boolean {
  const hasSessions =
    Array.isArray(value.sessions) && value.sessions.some((s) => s.date?.trim());
  const hasAddress = !!value.address?.trim();
  const hasCapacity = typeof value.capacity === "number" && value.capacity > 0;
  const hasNote = Array.isArray(value.note) && value.note.length > 0;
  return hasSessions || hasAddress || hasCapacity || hasNote;
}

/**
 * `endDate ?? latestSession ?? date < today` — events without a valid
 * date are treated as upcoming so an editor draft still surfaces the
 * CTA. Pure function so callers can pass `now` for testability.
 *
 * Server Components should pass an explicit `now` (e.g. derived at
 * request time) to keep the comparison deterministic per ISR cache
 * entry — `new Date()` default is only intended for client renders.
 */
export function deriveIsPast(
  value: EventFactValue,
  now: Date = new Date(),
): boolean {
  const today = DateTime.fromJSDate(now).setZone("utc").toISODate();
  if (!today) return false;
  const reference =
    value.endDate?.trim() ||
    (Array.isArray(value.sessions)
      ? value.sessions
          .map((s) => s.date?.trim())
          .filter((d): d is string => Boolean(d))
          .sort()
          .at(-1)
      : undefined) ||
    value.date?.trim();
  if (!reference) return false;
  return reference < today;
}

function weekdayAbbrev(date: ResolvedEvent): string {
  if (!date.hasDate) return "";
  return date.weekday.slice(0, 2).toUpperCase();
}

/**
 * Whitelist http(s) for the editor-authored ticket URL — Sanity's `url`
 * type already validates at write time, but runtime defense in depth
 * keeps `javascript:` / `data:` payloads out of the CTA href even if
 * draft content sneaks through.
 */
function safeExternalHref(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? trimmed
      : null;
  } catch {
    return null;
  }
}

interface HeadDateParts {
  monthLabel: string;
  dayLabel: string;
  weekdayLabel: string;
}

function resolveHeadDateParts(range: ResolvedEventRange): HeadDateParts | null {
  if (range.kind === "none") {
    return { monthLabel: "", dayLabel: "—", weekdayLabel: "Datum volgt" };
  }
  const start = range.kind === "single" ? range.date : range.start;
  const end = range.kind === "single" ? null : range.end;
  return {
    monthLabel:
      end && start.monthShort !== end.monthShort
        ? `${start.monthShort}–${end.monthShort}`
        : start.monthShort,
    dayLabel: start.day,
    weekdayLabel: end
      ? `${weekdayAbbrev(start)}–${weekdayAbbrev(end)}`
      : weekdayAbbrev(start),
  };
}

function Pill({ label, muted }: { label: string; muted: boolean }) {
  return (
    <span
      data-event-detail-pill={muted ? "muted" : "active"}
      className={cn(
        "inline-block w-fit border px-[6px] py-[2px] font-mono text-[10px] leading-none tracking-[0.16em] uppercase",
        muted
          ? "border-ink-muted bg-cream-soft text-ink-muted"
          : "border-ink bg-jersey-deep text-cream",
      )}
    >
      {label}
    </span>
  );
}

function SessionsGrid({ sessions }: { sessions: ResolvedSession[] }) {
  return (
    <dl
      data-event-detail-sessions="true"
      className="grid grid-cols-[80px_auto_1fr] gap-x-[14px] gap-y-[6px]"
    >
      {sessions.map((session, i) => {
        const time = formatTimeRange(session.startTime, session.endTime);
        const key = session._key ?? `s-${i}`;
        return (
          <div key={key} className="contents">
            <dt className="text-ink-muted font-mono text-[10px] leading-tight tracking-[0.18em] uppercase">
              {weekdayAbbrev(session.date)} · {session.date.day}
            </dt>
            <dd className="text-ink m-0 font-serif text-[14px] leading-tight font-bold italic">
              {session.date.weekday.replace(/^./, (c) => c.toUpperCase())}
            </dd>
            <dd className="text-ink-soft m-0 font-mono text-[11px] leading-tight tracking-[0.06em]">
              {time ?? "—"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

interface MetaRow {
  key: string;
  label: string;
  value: string;
}

function MetaList({ rows }: { rows: MetaRow[] }) {
  if (rows.length === 0) return null;
  return (
    <dl
      data-event-detail-meta="true"
      className="grid grid-cols-[100px_1fr] gap-x-[14px] gap-y-[4px]"
    >
      {rows.map((row) => (
        <div key={row.key} className="contents">
          <dt className="text-ink-muted font-mono text-[10px] leading-tight tracking-[0.16em] uppercase">
            {row.label}
          </dt>
          <dd className="text-ink m-0 font-serif text-[14px] leading-snug">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function buildMetaRows(value: EventFactValue): MetaRow[] {
  const rows: MetaRow[] = [];
  if (value.location?.trim()) {
    rows.push({
      key: "location",
      label: "Locatie",
      value: value.location.trim(),
    });
  }
  if (value.address?.trim()) {
    rows.push({ key: "address", label: "Adres", value: value.address.trim() });
  }
  if (typeof value.capacity === "number" && value.capacity > 0) {
    rows.push({
      key: "capacity",
      label: "Capaciteit",
      value: `Max ${value.capacity} plaatsen`,
    });
  }
  return rows;
}

/**
 * Date-block — three-line typographic anchor (month / day / weekday).
 * The italic 36px day carries optical whitespace above its glyph;
 * `-2px` on the day closes the top gap and `+3px` on the weekday opens
 * the bottom so the vertical rhythm reads as evenly distributed.
 */
function DateBlock({ dateParts }: { dateParts: HeadDateParts | null }) {
  return (
    <div className="text-ink flex w-[56px] flex-col items-center text-center leading-none">
      <span
        data-event-detail-head-month="true"
        className="text-ink-muted font-mono text-[9px] tracking-[0.16em] uppercase"
      >
        {dateParts?.monthLabel ?? ""}
      </span>
      <span
        data-event-detail-head-day="true"
        className="font-display mt-[-2px] text-[36px] font-black italic"
      >
        {dateParts?.dayLabel ?? "—"}
      </span>
      <span
        data-event-detail-head-weekday="true"
        className="text-ink-muted mt-[3px] font-mono text-[9px] tracking-[0.16em] uppercase"
      >
        {dateParts?.weekdayLabel ?? ""}
      </span>
    </div>
  );
}

/**
 * Head row — left date-block + right pill/title stack, both vertically
 * centered as units so the column geometries balance regardless of how
 * many lines the title wraps to.
 */
function Head({
  dateParts,
  pillLabel,
  isPast,
  title,
}: {
  dateParts: HeadDateParts | null;
  pillLabel?: string;
  isPast: boolean;
  title?: string;
}) {
  return (
    <header
      data-event-detail-head="true"
      className="border-ink-muted flex items-center gap-x-5 border-b border-dotted pb-3"
    >
      <DateBlock dateParts={dateParts} />
      <div className="flex flex-1 flex-col gap-1.5">
        {pillLabel ? <Pill label={pillLabel} muted={isPast} /> : null}
        {title ? (
          <p
            data-event-detail-title="true"
            className="text-ink m-0 font-serif text-[22px] leading-[1.15] font-black italic"
          >
            {title}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function Note({ blocks }: { blocks: PortableTextBlock[] }) {
  return (
    <div
      data-event-detail-note="true"
      className="text-ink-soft font-serif text-[15px] leading-[1.5] italic"
    >
      <PortableText value={blocks} />
    </div>
  );
}

/**
 * <EventDetailBlock> — full event-detail card placed between `<EndMark>`
 * and `<ArticleCredits>` per the 5.d-evt lock (Option A).
 *
 * Skip-condition: returns `null` when none of `sessions[]` / `address` /
 * `capacity` / `note` are populated — simple events whose strip already
 * carries everything readers need don't get a redundant body block.
 *
 * Past-event behaviour: the tag pill is replaced with a muted
 * `Afgelopen` pill and the CTA is hidden; the rest of the card remains
 * visible as a historical record. `isPast` is computed page-level via
 * `deriveIsPast` so the renderer stays pure.
 */
export function EventDetailBlock({
  value,
  isPast,
  className,
}: EventDetailBlockProps) {
  if (!shouldRenderEventDetailBlock(value)) return null;

  const range = resolveEventRange(value.date, value.endDate, value.sessions);
  const title = value.title?.trim();
  const tag = value.competitionTag?.trim();
  const pillLabel = isPast ? "Afgelopen" : tag;
  const ticketUrl = !isPast ? safeExternalHref(value.ticketUrl) : null;
  const ticketLabel = value.ticketLabel?.trim() || DEFAULT_TICKET_LABEL;
  const metaRows = buildMetaRows(value);
  const note =
    Array.isArray(value.note) && value.note.length > 0 ? value.note : null;
  const sessions = range.kind === "sessions" ? range.sessions : null;

  return (
    <div
      className="mx-auto my-10 w-full"
      style={{ maxWidth: "var(--container-prose)" }}
    >
      <TapedCard
        bg="cream"
        tape={[{ color: "jersey", length: "md" }]}
        padding="lg"
        className={cn("w-full", className)}
      >
        <section
          data-event-detail-block="true"
          data-is-past={isPast ? "true" : "false"}
          className="flex flex-col gap-[14px]"
        >
          <Head
            dateParts={resolveHeadDateParts(range)}
            pillLabel={pillLabel}
            isPast={isPast}
            title={title}
          />
          {sessions ? <SessionsGrid sessions={sessions} /> : null}
          {metaRows.length > 0 ? <MetaList rows={metaRows} /> : null}
          {note ? <Note blocks={note} /> : null}
          {ticketUrl ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-event-detail-cta="true"
              className={cn(
                getButtonClasses({ variant: "primary", size: "md" }),
                "w-fit",
              )}
            >
              {ticketLabel}
              <span aria-hidden="true" className="ml-1">
                →
              </span>
            </a>
          ) : null}
        </section>
      </TapedCard>
    </div>
  );
}
