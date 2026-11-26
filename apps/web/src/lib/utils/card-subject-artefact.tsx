// apps/web/src/lib/utils/card-subject-artefact.tsx
import type { ReactNode } from "react";
import {
  Crest,
  JerseyIllustration,
  JerseyShirt,
  playerFigureSeed,
} from "@/components/design-system";

/**
 * The four subject kinds an imageless card can stand in for (#2462). Every
 * kind but `"document"` has a subject-specific artefact; a document falls
 * through to `<NewsCard>`'s own default hatch instead — see
 * `getCardSubjectArtefact` below.
 */
export type CardArtefactSubject =
  | {
      kind: "person";
      /**
       * The #2485 amendment to #2462 rule 1 — *person* resolves one level
       * finer, keyed on the document the card was built from, never on the
       * route and never on role text. A player document takes the jersey;
       * a staff document takes the coat.
       */
      personType: "player" | "staff";
      /**
       * Stable identity, e.g. the Sanity `_id` — never a display name.
       * Fed through `playerFigureSeed` (the one owner of what a seed
       * string is), the same way `<SquadGrid>`'s `<PlayerCard>` and
       * `<PlayerHero>` already do, so a given player draws the same figure
       * everywhere `<JerseyIllustration>` renders them.
       */
      id: string;
    }
  | {
      kind: "team";
      /** Optional chest letter (e.g. age group) — forwarded to `<JerseyShirt>`. */
      ageLabel?: string | null;
    }
  | {
      kind: "club";
      /** Club / opponent name — drives `<Crest>`'s initialled-disc fallback. */
      name: string;
      /**
       * Club logo URL. Passed through to `<Crest>` unchanged — see the
       * placeholder-crest note below.
       */
      logoUrl?: string | null;
    }
  | { kind: "document" };

// Measured at #2462: a 180×180 crest, contained in a 288px card, lands at
// ~121px with no upscale. `<JerseyShirt>`'s own default (240px) and its
// documented corner-anchor override (140px) bracket that number, so 128px
// keeps every artefact in this same visual register across subject kinds.
// `<Crest>`'s `size` prop takes the number directly.
//
// The class only uses `max-h-*`/`max-w-*` against `<JerseyShirt>`'s baked-in
// `h-60 w-60` — a *different* CSS property, so it composes instead of
// racing the default on Tailwind's generated stylesheet order the way a
// same-property override (`h-32`/`w-32`, or `h-full`/`w-full`) would and
// silently lose. See `<JerseyShirt>`'s own docblock before changing this.
// The two constants below encode the same 128px — Tailwind's spacing scale
// (`32` → `8rem` → 128px) has no token → arbitrary-class helper to derive
// one from the other, so keep them in sync by hand if this number changes.
const ARTEFACT_SLOT_SIZE = 128;
const ARTEFACT_SLOT_SIZE_CLASS = "max-h-32 max-w-32";

/**
 * Maps an imageless card's subject to its own artefact — see DESIGN.md
 * § "The Imageless Card" for the design rules this implements (#2462,
 * #2472, #2485). `"document"` resolves to `undefined`, so `<NewsCard>`'s
 * own hatch stays whatever it already defaults to.
 *
 * Every branch is wrapped in one `relative h-full w-full` container, so the
 * returned node is self-positioning — a caller doesn't size or position it.
 *
 * Do not add crest detection here (byte-hashing, redirect-target checks,
 * `?v=` sniffing, a deny-list). #2472's resolution comment records six
 * variants tried and rejected; a missing or wrong crest is upstream PSD
 * data work, not a render-time concern.
 */
export const getCardSubjectArtefact = (
  subject: CardArtefactSubject,
): ReactNode | undefined => {
  const content = renderSubjectArtefact(subject);
  if (content === undefined) return undefined;
  return (
    <div className="bg-cream-soft relative flex h-full w-full items-center justify-center">
      {content}
    </div>
  );
};

const renderSubjectArtefact = (
  subject: CardArtefactSubject,
): ReactNode | undefined => {
  switch (subject.kind) {
    case "person":
      return (
        <JerseyIllustration
          variant="card"
          seed={playerFigureSeed({ id: subject.id })}
          garment={subject.personType === "staff" ? "coat" : "jersey"}
        />
      );
    case "team":
      return (
        <JerseyShirt
          letterOverlay={subject.ageLabel ?? undefined}
          className={ARTEFACT_SLOT_SIZE_CLASS}
        />
      );
    case "club":
      return (
        <Crest
          name={subject.name}
          logo={subject.logoUrl ?? undefined}
          size={ARTEFACT_SLOT_SIZE}
        />
      );
    case "document":
      return undefined;
    default: {
      // Exhaustiveness guard — a fifth subject kind breaks this
      // never-assignment until a case is added above.
      const _exhaustive: never = subject;
      void _exhaustive;
      return undefined;
    }
  }
};
