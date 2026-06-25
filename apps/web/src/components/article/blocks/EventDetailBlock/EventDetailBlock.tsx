import { DateTime } from "luxon";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { TapedCard } from "@/components/design-system";
import { MonoLabel } from "@/components/design-system/MonoLabel";
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
import { formatWidgetDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

export interface EventDetailBlockProps {
  value: EventFactValue;
  isPast: boolean;
  className?: string;
}

/**
 * True when the eventFact carries anything worth surfacing in the
 * contained panel — a place, a date, a time, a schedule, a capacity, a
 * note, or a title. The panel replaces the old full-bleed hero strip
 * (#2237 ART-3), so it now renders for *every* event with content, not
 * just those with extra detail beyond the strip.
 */
export function hasEventFactContent(value: EventFactValue): boolean {
  const hasDate =
    !!value.date?.trim() ||
    (Array.isArray(value.sessions) &&
      value.sessions.some((s) => s.date?.trim()));
  const hasTime = !!value.startTime?.trim() || !!value.endTime?.trim();
  const hasPlace = !!value.location?.trim() || !!value.address?.trim();
  const hasCapacity = typeof value.capacity === "number" && value.capacity > 0;
  const hasNote = Array.isArray(value.note) && value.note.length > 0;
  return (
    hasDate ||
    hasTime ||
    hasPlace ||
    hasCapacity ||
    hasNote ||
    !!value.title?.trim()
  );
}

/**
 * `endDate ?? latestSession ?? date < today` — events without a valid
 * date are treated as upcoming so an editor draft still surfaces the
 * CTAs. Pure function so callers can pass `now` for testability.
 *
 * Server Components should pass an explicit `now` (e.g. derived at
 * request time) to keep the comparison deterministic per ISR cache
 * entry — `new Date()` default is only intended for client renders.
 */
export function deriveIsPast(
  value: EventFactValue,
  now: Date = new Date(),
): boolean {
  // Compare against the Belgian calendar day, not UTC — otherwise an
  // event flips to "past" up to ~2h early around the UTC midnight
  // boundary (Brussels is UTC+1/+2). The reference dates are timezone-less
  // calendar dates, so the only zone that matters is the club's.
  const today = DateTime.fromJSDate(now).setZone("Europe/Brussels").toISODate();
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

/** Compact `19 sep 2026` head date — start of the range. */
function formatCompactDate(range: ResolvedEventRange): string | null {
  if (range.kind === "none") return null;
  const start = range.kind === "single" ? range.date : range.start;
  return `${start.day} ${start.monthShort} ${start.year}`;
}

/** Long `Za 19 september 2026` / span `25 – 27 september 2026` Datum cell. */
function formatDatumCell(range: ResolvedEventRange): string {
  if (range.kind === "none") return "Datum volgt";
  if (range.kind === "single") {
    // Reuse the canonical Dutch `ccc d MMMM` formatter + append the year.
    return `${formatWidgetDate(range.date.dateIso)} ${range.date.year}`;
  }
  const { start, end, sameMonth, sameYear } = range;
  if (sameMonth) {
    return `${start.day} – ${end.day} ${start.monthLong} ${start.year}`;
  }
  if (sameYear) {
    return `${start.day} ${start.monthShort} – ${end.day} ${end.monthShort} ${start.year}`;
  }
  return `${start.day} ${start.monthShort} ${start.year} – ${end.day} ${end.monthShort} ${end.year}`;
}

/**
 * Tijd cell — a single range for single/continuous events, "Zie schema"
 * when per-day sessions carry their own hours (the schedule renders
 * below), "—" when no time is set. `startTime`/`endTime` are the effective
 * times resolved by the caller (which recovers a lone session's hours that
 * `resolveEventRange` drops when it collapses to `kind: "single"`).
 */
function formatTijdCell(
  range: ResolvedEventRange,
  startTime?: string,
  endTime?: string,
) {
  if (range.kind === "sessions") return "Zie schema";
  return formatTimeRange(startTime, endTime) ?? "—";
}

/**
 * Google Calendar template link for the "Zet in agenda" CTA. Times are
 * Europe/Brussels → UTC; an event without a start time becomes an
 * all-day entry (end date exclusive, hence `+1 day`).
 *
 * ponytail: a Google Calendar URL is the zero-dependency option; swap
 * for an `.ics` download if non-Google users ask for it.
 */
function buildGoogleCalendarUrl(
  value: EventFactValue,
  range: ResolvedEventRange,
  startTime?: string,
  endTime?: string,
): string | null {
  if (range.kind === "none") return null;
  const startIso =
    range.kind === "single" ? range.date.dateIso : range.start.dateIso;
  const endIso =
    range.kind === "single" ? range.date.dateIso : range.end.dateIso;
  const zone = "Europe/Brussels";

  // Per-day sessions carry their own hours (the panel shows "Zie schema"),
  // so the top-level start/end don't describe the whole span — model the
  // calendar entry as all-day. Otherwise use the effective daily time range
  // (which includes a lone session's recovered hours), defaulting to a 2h
  // block when only a start time is set (mirrors the match-feed ical
  // convention).
  const start = range.kind === "sessions" ? undefined : startTime?.trim();
  let dates: string;
  if (start) {
    const startDt = DateTime.fromISO(`${startIso}T${start}`, { zone });
    const end = endTime?.trim();
    const endDt = end
      ? DateTime.fromISO(`${endIso}T${end}`, { zone })
      : startDt.plus({ hours: 2 });
    if (!startDt.isValid || !endDt.isValid) return null;
    dates = `${startDt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}/${endDt
      .toUTC()
      .toFormat("yyyyMMdd'T'HHmmss'Z'")}`;
  } else {
    const startDay = DateTime.fromISO(startIso, { zone });
    const endDay = DateTime.fromISO(endIso, { zone }).plus({ days: 1 });
    if (!startDay.isValid || !endDay.isValid) return null;
    dates = `${startDay.toFormat("yyyyMMdd")}/${endDay.toFormat("yyyyMMdd")}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: value.title?.trim() || "KCVV Elewijt — Evenement",
    dates,
  });
  const location = value.address?.trim() || value.location?.trim();
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

function FactCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      data-event-detail-fact={label.toLowerCase()}
      className="flex flex-col gap-1.5"
    >
      <span className="text-jersey-deep">
        <MonoLabel size="sm">{label}</MonoLabel>
      </span>
      <span className="text-ink font-serif text-[18px] leading-snug font-medium italic">
        {value}
      </span>
    </div>
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

/** Address (only when it's not already standing in as the Locatie cell)
 *  + capacity, rendered as a compact secondary dl below the fact grid. */
function buildExtraRows(value: EventFactValue): MetaRow[] {
  const rows: MetaRow[] = [];
  if (value.address?.trim() && value.location?.trim()) {
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
 * <EventDetailBlock> — the contained event-fact panel (ART-3 Variant B,
 * locked `go-live-art3-event-hero-strip/locked.md`). Rendered between the
 * event hero and the article body on `articleType="event"`, replacing the
 * old full-bleed `HeroCompressedEventStrip`.
 *
 * Taped index-card: one washi tape, optional tag pill + compact date,
 * title, a 3-column Locatie / Datum / Tijd fact grid (MonoLabel kicker
 * over each value), then folded detail (per-day schedule, address,
 * capacity, note) and a CTA row — Reserveer (jersey-deep) + Zet in
 * agenda. Contained to `--container-wide`, never full-bleed.
 *
 * Past-event behaviour: the tag pill becomes a muted `Afgelopen`, the
 * whole card greyscales, and the CTA row is hidden. `isPast` is computed
 * page-level via `deriveIsPast` so this stays a pure renderer.
 */
export function EventDetailBlock({
  value,
  isPast,
  className,
}: EventDetailBlockProps) {
  if (!hasEventFactContent(value)) return null;

  const range = resolveEventRange(value.date, value.endDate, value.sessions);
  const title = value.title?.trim();
  const tag = value.competitionTag?.trim();
  const pillLabel = isPast ? "Afgelopen" : tag;
  const compactDate = formatCompactDate(range);

  // resolveEventRange collapses a lone dated session to kind:"single" and
  // drops its hours — recover them so the Tijd cell + calendar keep the
  // real times instead of falling back to the (often empty) top-level
  // fields (#2237 review).
  const datedSessions = (value.sessions ?? []).filter((s) => s.date?.trim());
  const loneSession =
    range.kind === "single" && datedSessions.length === 1
      ? datedSessions[0]
      : undefined;
  const startTime = loneSession?.startTime?.trim() || value.startTime;
  const endTime = loneSession?.endTime?.trim() || value.endTime;

  const locationValue = value.location?.trim() || value.address?.trim() || "—";
  const datumValue = formatDatumCell(range);
  const tijdValue = formatTijdCell(range, startTime, endTime);

  const ticketUrl = isPast ? null : safeExternalHref(value.ticketUrl);
  const ticketLabel = value.ticketLabel?.trim() || DEFAULT_TICKET_LABEL;
  const calendarUrl = isPast
    ? null
    : buildGoogleCalendarUrl(value, range, startTime, endTime);

  const sessions = range.kind === "sessions" ? range.sessions : null;
  const extraRows = buildExtraRows(value);
  const note =
    Array.isArray(value.note) && value.note.length > 0 ? value.note : null;

  return (
    <div className="bg-cream w-full px-4 pt-6 pb-2 md:px-8">
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-wide)" }}
      >
        <TapedCard
          bg="cream"
          tape={[{ color: "warm", length: "md" }]}
          padding="lg"
          rotation={-0.4}
          className={cn(isPast && "opacity-90 grayscale-[0.35]", className)}
        >
          <section
            data-event-detail-block="true"
            data-is-past={isPast ? "true" : "false"}
            className="flex flex-col gap-4"
          >
            {pillLabel || compactDate ? (
              <div
                data-event-detail-head="true"
                className="flex flex-wrap items-center gap-x-3 gap-y-2"
              >
                {pillLabel ? <Pill label={pillLabel} muted={isPast} /> : null}
                {compactDate ? (
                  <span className="text-ink-muted font-mono text-[11px] tracking-[0.08em] uppercase">
                    {compactDate}
                  </span>
                ) : null}
              </div>
            ) : null}

            {title ? (
              <p
                data-event-detail-title="true"
                className="text-ink m-0 font-serif text-[24px] leading-[1.08] font-black italic"
              >
                {title}
              </p>
            ) : null}

            <div
              data-event-detail-factgrid="true"
              className="border-ink-muted grid grid-cols-1 gap-x-[22px] gap-y-4 border-y border-dotted py-[18px] sm:grid-cols-3"
            >
              <FactCell label="Locatie" value={locationValue} />
              <FactCell label="Datum" value={datumValue} />
              <FactCell label="Tijd" value={tijdValue} />
            </div>

            {sessions ? <SessionsGrid sessions={sessions} /> : null}
            {extraRows.length > 0 ? <MetaList rows={extraRows} /> : null}
            {note ? <Note blocks={note} /> : null}

            {ticketUrl || calendarUrl ? (
              <div
                data-event-detail-cta-row="true"
                className="flex flex-wrap gap-3 pt-1"
              >
                {ticketUrl ? (
                  <a
                    href={ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-event-detail-cta="ticket"
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
                {calendarUrl ? (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-event-detail-cta="calendar"
                    className={cn(
                      getButtonClasses({ variant: "secondary", size: "md" }),
                      "w-fit",
                    )}
                  >
                    Zet in agenda
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>
        </TapedCard>
      </div>
    </div>
  );
}
