/**
 * <SubjectsStrip> — Phase 3 §5.B.2 / `interview-locked.md`.
 *
 * Polaroid strip below the EditorialHero on `articleType="interview"`
 * articles. Layout per `subjects.length`:
 *
 *   N=1 desktop  →  [polaroid] + pull-quote (when provided)
 *   N=2 desktop  →  [polaroid] & [polaroid]   (italic display "&" 64px)
 *   N=3 desktop  →  [polaroid] [polaroid] [polaroid]
 *   N=4 desktop  →  2×2 grid
 *
 * Mobile (≤ 720px) for N≥3 swaps to a compact mono-caps list (no
 * polaroids) inside a paper card titled `★ Subjects`. N=1 / N=2 keep
 * polaroids on mobile, stacked vertically.
 *
 * Subject `kind` discriminates the data shape — the polaroid frame is
 * uniform; photo source + caption fields differ per kind. The locked
 * spec calls out that the page-level Server Component pre-resolves the
 * pull-quote (first body qaPair with tag in [key, quote]) and passes
 * it in as a prop to keep this component presentational.
 */
import { TapedCard } from "@/components/design-system/TapedCard";
import { MonoStar } from "@/components/design-system/MonoStar";

export type SubjectsStripOrientation = "auto" | "vertical";

export interface SubjectPlayer {
  _key: string;
  kind: "player";
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  psdImageUrl: string;
}

export interface SubjectStaff {
  _key: string;
  kind: "staff";
  firstName: string;
  lastName: string;
  functionTitle: string;
  photoUrl: string;
}

export interface SubjectCustom {
  _key: string;
  kind: "custom";
  customName: string;
  customRole: string;
  customPhotoUrl: string;
}

export type Subject = SubjectPlayer | SubjectStaff | SubjectCustom;

interface ResolvedSubjectMeta {
  photoUrl: string;
  displayName: string;
  metaLine: string;
  altName: string;
}

function resolveSubject(subject: Subject): ResolvedSubjectMeta {
  switch (subject.kind) {
    case "player": {
      const number =
        subject.jerseyNumber !== undefined ? `#${subject.jerseyNumber}` : "";
      const meta = [subject.position, number]
        .filter((s) => s && s !== "")
        .join(" · ");
      return {
        photoUrl: subject.psdImageUrl,
        displayName: subject.firstName,
        metaLine: meta,
        altName: `${subject.firstName} ${subject.lastName}`,
      };
    }
    case "staff": {
      return {
        photoUrl: subject.photoUrl,
        displayName: subject.firstName,
        metaLine: subject.functionTitle,
        altName: `${subject.firstName} ${subject.lastName}`,
      };
    }
    case "custom": {
      return {
        photoUrl: subject.customPhotoUrl,
        displayName: subject.customName,
        metaLine: subject.customRole,
        altName: subject.customName,
      };
    }
  }
}

interface PolaroidProps {
  subject: Subject;
  rotation: number;
  tapeColor: "jersey" | "ink" | "cream";
}

function Polaroid({ subject, rotation, tapeColor }: PolaroidProps) {
  const { photoUrl, displayName, metaLine, altName } = resolveSubject(subject);
  return (
    <TapedCard
      rotation={rotation}
      tape={[{ color: tapeColor, length: "md" }]}
      bg="cream"
      padding="sm"
      as="figure"
      className="w-[200px]"
    >
      <div className="border-paper-edge bg-cream-soft border">
        {/* Plain <img> — Sanity URLs come pre-projected; keep parity with
            other strip primitives (TransferFactStrip uses the same path). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={altName}
          width={400}
          height={500}
          className="block h-[240px] w-full object-cover object-[center_18%] contrast-[1.04] saturate-[0.9]"
        />
      </div>
      <figcaption className="mt-3 text-center">
        <p className="font-serif text-lg leading-tight font-black italic">
          {displayName}
        </p>
        {metaLine !== "" ? (
          <p className="text-ink-muted mt-1 font-mono text-[10px] leading-none tracking-[0.1em] uppercase">
            {metaLine}
          </p>
        ) : null}
      </figcaption>
    </TapedCard>
  );
}

function CompactRow({ subject }: { subject: Subject }) {
  const { displayName, metaLine, altName } = resolveSubject(subject);
  // For compact list, use the full name (firstName + lastName) instead of
  // just first — list rows have no photo to disambiguate.
  return (
    <li className="border-paper-edge flex flex-col gap-1 border-b py-3 last:border-b-0">
      <span className="font-serif text-lg leading-tight font-black italic">
        {altName !== displayName ? altName : displayName}
      </span>
      {metaLine !== "" ? (
        <span className="text-ink-muted font-mono text-[11px] leading-none uppercase">
          {metaLine}
        </span>
      ) : null}
    </li>
  );
}

function CompactList({ subjects }: { subjects: Subject[] }) {
  return (
    <TapedCard rotation={-0.4} bg="cream" padding="lg" className="w-full">
      <p className="text-ink-muted mb-3 flex items-center gap-2 font-mono text-xs leading-none uppercase">
        <MonoStar /> Subjects
      </p>
      <ul className="flex flex-col">
        {subjects.map((s) => (
          <CompactRow key={s._key} subject={s} />
        ))}
      </ul>
    </TapedCard>
  );
}

function PullQuoteInline({
  text,
  attribution,
}: {
  text: string;
  attribution: string;
}) {
  return (
    <blockquote className="flex max-w-[420px] flex-col gap-3 px-2">
      <span
        aria-hidden="true"
        className="text-jersey-deep font-serif text-5xl leading-none italic"
      >
        “
      </span>
      <p className="font-serif text-2xl leading-snug font-bold italic">
        {text}
      </p>
      <p className="text-ink-muted font-mono text-xs leading-none uppercase">
        — {attribution}
      </p>
    </blockquote>
  );
}

function Ampersand() {
  return (
    <span
      aria-hidden="true"
      className="text-jersey-deep font-serif text-6xl leading-none italic"
    >
      &amp;
    </span>
  );
}

const POLAROID_LOOKS: Array<Pick<PolaroidProps, "rotation" | "tapeColor">> = [
  { rotation: -1.4, tapeColor: "jersey" },
  { rotation: 0.6, tapeColor: "ink" },
  { rotation: -0.8, tapeColor: "jersey" },
  { rotation: 1.2, tapeColor: "ink" },
];

interface SubjectsStripProps {
  subjects: Subject[];
  /**
   * Pre-resolved by the page-level Server Component for N=1 — first
   * body `qaPair` with tag in [key, quote]. Hidden when undefined.
   */
  quote?: { text: string; attribution: string };
  /**
   * `auto` (default): viewport-responsive. `vertical`: force narrow
   * layout regardless of viewport. Used by Storybook fixtures.
   */
  orientation?: SubjectsStripOrientation;
}

export function SubjectsStrip({
  subjects,
  quote,
  orientation = "auto",
}: SubjectsStripProps) {
  if (subjects.length === 0) return null;
  const forceVertical = orientation === "vertical";

  // N≥3 + narrow → compact mono-caps list (no polaroids).
  if (subjects.length >= 3 && forceVertical) {
    return (
      <div className="mx-auto my-10 max-w-[420px]">
        <CompactList subjects={subjects} />
      </div>
    );
  }

  // N=1 → polaroid + pull-quote (when provided).
  if (subjects.length === 1) {
    const stackClass = forceVertical
      ? "flex flex-col items-center gap-8"
      : "flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-12";
    return (
      <div className="mx-auto my-12 max-w-[920px]">
        <div className={stackClass}>
          <Polaroid
            subject={subjects[0]!}
            rotation={POLAROID_LOOKS[0]!.rotation}
            tapeColor={POLAROID_LOOKS[0]!.tapeColor}
          />
          {quote !== undefined ? (
            <PullQuoteInline
              text={quote.text}
              attribution={quote.attribution}
            />
          ) : null}
        </div>
      </div>
    );
  }

  // N=2 → duo with italic display "&" between.
  if (subjects.length === 2) {
    const stackClass = forceVertical
      ? "flex flex-col items-center gap-6"
      : "flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-10";
    return (
      <div className="mx-auto my-12 max-w-[920px]">
        <div className={stackClass}>
          <Polaroid
            subject={subjects[0]!}
            rotation={POLAROID_LOOKS[0]!.rotation}
            tapeColor={POLAROID_LOOKS[0]!.tapeColor}
          />
          <Ampersand />
          <Polaroid
            subject={subjects[1]!}
            rotation={POLAROID_LOOKS[1]!.rotation}
            tapeColor={POLAROID_LOOKS[1]!.tapeColor}
          />
        </div>
      </div>
    );
  }

  // N=3 → three polaroids inline (desktop). md:flex-row.
  if (subjects.length === 3) {
    return (
      <div className="mx-auto my-12 max-w-[920px]">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-8">
          {subjects.map((s, i) => (
            <Polaroid
              key={s._key}
              subject={s}
              rotation={POLAROID_LOOKS[i]!.rotation}
              tapeColor={POLAROID_LOOKS[i]!.tapeColor}
            />
          ))}
        </div>
      </div>
    );
  }

  // N=4 (and any over-cap) → 2×2 grid.
  return (
    <div className="mx-auto my-12 max-w-[640px]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {subjects.map((s, i) => (
          <div key={s._key} className="flex justify-center">
            <Polaroid
              subject={s}
              rotation={POLAROID_LOOKS[i % POLAROID_LOOKS.length]!.rotation}
              tapeColor={POLAROID_LOOKS[i % POLAROID_LOOKS.length]!.tapeColor}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
