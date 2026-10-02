import Link from "next/link";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";
import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { RoundAvatar } from "@/components/design-system/RoundAvatar";
import {
  CHIP_CLASSES,
  CHIP_LINK_CLASSES,
  PRESS_DOWN_HOVER,
  PRESS_DOWN_TRANSITION,
  PRESS_DOWN_TRANSITION_FADE,
} from "@/components/design-system/press-down";

/**
 * `<OrgPersonCard>` — the Phase 7 `/hulp` structure card (design lock `7o4`).
 *
 * Round newsprint photo OR monogram (`<RoundAvatar>`, #3331) · first-semibold +
 * last-italic name · mono function label — the avatar idiom `<TeamStaff>`
 * carried pre-#2575, now the shared round family: `/hulp` is a chart of
 * **positions**, not a directory of people (#2477 rule 7), so it never
 * moved onto the shared 3:4 `<PlayerCard>`. Parameterised by
 * **occupancy state**:
 *
 *  - `single`  — one holder: photo/monogram · person name · the position as the
 *                mono function label.
 *  - `shared`  — 2+ holders: a static dual-avatar cue + "N personen" (3+ adds a
 *                "+N" chip). The card shows the POSITION in the name slot; the
 *                first-holder detail opens on click (panel wired in Phase 4).
 *  - `vacant`  — 0 holders: a warm recruit card ("deze plek is vrij" + a soft
 *                "Iets voor jou? →" CTA), never a dead placeholder.
 *
 * State is **derived from `node.members.length`** (not a prop) so it can never
 * drift from the data. The whole card is one click target that opens the person
 * detail (7o5 / Phase 4, #2055) — Phase 2 ships it presentational with
 * `data-node-id` / `data-card-state` markers for the future delegation wrapper;
 * only the vacant CTA is an interactive link today. No hover behaviour on the
 * card or avatars (7o4: the dual-avatar is a static cue, not a hover target).
 */

export type OrgPersonCardState = "single" | "shared" | "vacant";

export interface OrgPersonCardProps {
  /** The organigram position this card represents. */
  node: OrgChartNode;
  /**
   * Where the vacant-recruit CTA points. Defaults to the club contact page —
   * the same destination the hub's closing `<CtaBand>` uses (7o4: "to
   * contact/Hulp"; final route confirmed in 7o7).
   */
  vacantCtaHref?: string;
  /**
   * Phase 4 (#2055): render the whole card as a focusable `<button>` that opens
   * the `<MemberDetailPanel>`. The card carries `data-member-card` so the hub's
   * single click-delegation listener can target directory cards without catching
   * the verkenner's own `data-node-id` nav nodes. When interactive, the vacant
   * card drops its inline recruit link — the panel's vacant state carries the
   * CTA instead. Presentational (`<article>`) by default.
   */
  interactive?: boolean;
  className?: string;
}

/** Accessible name for an interactive card (its visible text is decorative). */
function cardActionLabel(
  node: OrgChartNode,
  state: OrgPersonCardState,
): string {
  if (state === "vacant") return `${node.title} — deze plek is vrij`;
  if (state === "shared") {
    return `Contactgegevens — ${node.title}, ${node.members.length} personen`;
  }
  return `Contactgegevens van ${node.members[0]?.name ?? node.title}`;
}

// ─── Pure helpers (exported for unit tests) ──────────────────────────────────

/** Occupancy state from the holder count: 0 → vacant, 1 → single, 2+ → shared. */
export function deriveCardState(memberCount: number): OrgPersonCardState {
  if (memberCount <= 0) return "vacant";
  if (memberCount === 1) return "single";
  return "shared";
}

/**
 * Split a display value into the 6.C name rhythm: the first whitespace token is
 * the semibold "lead", the remainder is the italic "rest". Works for both a
 * person name ("Luc Boons" → Luc / Boons) and a position title
 * ("Wedstrijd secretariaat" → Wedstrijd / secretariaat); a single-token value
 * has an empty rest and renders bold-only.
 */
export function splitDisplayName(value: string): {
  lead: string;
  rest: string;
} {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lead: "", rest: "" };
  const [lead, ...others] = parts;
  return { lead: lead ?? "", rest: others.join(" ") };
}

// ─── Sub-parts ───────────────────────────────────────────────────────────────

/** First-token-bold + remainder-italic name rhythm. */
function NameRhythm({
  value,
  italicLead = false,
  className,
}: {
  value: string;
  /** Vacant cards render the whole title italic (no bold lead). */
  italicLead?: boolean;
  className?: string;
}) {
  const { lead, rest } = splitDisplayName(value);
  if (italicLead) {
    return (
      <p className={cn("font-display text-ink leading-[1.05]", className)}>
        <em className="font-normal italic">{value}</em>
      </p>
    );
  }
  return (
    <p className={cn("font-display text-ink leading-[1.05]", className)}>
      <span className="font-semibold">{lead}</span>
      {rest !== "" && (
        <>
          {" "}
          <em className="font-normal italic">{rest}</em>
        </>
      )}
    </p>
  );
}

/** Overlapping cue for shared roles (static — no hover/tooltip). */
function DualAvatar({ holders }: { holders: OrgChartNode["members"] }) {
  const [a, b] = holders;
  const extra = holders.length - 2;

  return (
    <div
      // A group follows the ramp at 40 (#3304); the fixed 64px height keeps
      // the card as tall as a single-avatar card.
      className="flex h-16 items-center -space-x-2"
      data-testid="org-person-card-dual-avatar"
    >
      <RoundAvatar
        size={40}
        name={a?.name}
        photoUrl={a?.imageUrl}
        className="relative z-30"
      />
      <RoundAvatar
        size={40}
        name={b?.name}
        photoUrl={b?.imageUrl}
        className="relative z-20"
      />
      {/* Not a person, but it takes the ring, fill and size of its neighbour. */}
      {extra > 0 && (
        <RoundAvatar size={40} glyph={`+${extra}`} className="relative z-10" />
      )}
    </div>
  );
}

// `w-full` is load-bearing: the card is `flex-col items-center`, so without it
// this <p> sizes to max-content and a long role ("Communicatieverantwoordelijke")
// spills out past the card border instead of wrapping. A role title is
// free-text/unbounded — the club can name a longer one tomorrow — so per
// DESIGN.md's Hyphenation Rule it carries `hyphens-auto` AND `break-words`,
// verified in Chrome and Safari (#2269).
const SUBLABEL =
  "text-ink-muted mt-1.5 w-full font-mono text-[11px] tracking-[0.06em] uppercase hyphens-auto break-words";

// ─── Component ───────────────────────────────────────────────────────────────

export function OrgPersonCard({
  node,
  vacantCtaHref = "/club/contact",
  interactive = false,
  className,
}: OrgPersonCardProps) {
  const state = deriveCardState(node.members.length);

  const baseCard =
    "border-ink relative flex flex-col items-center border-2 p-3 text-center";
  const rootClass = cn(
    baseCard,
    state === "vacant"
      ? "bg-warm shadow-paper-sm"
      : "bg-cream shadow-[3px_3px_0_0_var(--color-ink)]",
    interactive &&
      `w-full cursor-pointer ${
        state === "vacant" ? PRESS_DOWN_TRANSITION_FADE : PRESS_DOWN_TRANSITION
      } ${PRESS_DOWN_HOVER}`,
    className,
  );

  const content = (
    <>
      {/* roleCode pill — top-right, auto-hides when absent (7o4). */}
      {node.roleCode && (
        <span
          data-testid="org-person-card-rolepill"
          className="border-ink bg-jersey-deep text-cream absolute top-2 right-2 border-[1.5px] px-1.5 py-px font-mono text-[11px] font-semibold tracking-[0.05em] uppercase"
        >
          {node.roleCode}
        </span>
      )}

      {/* Avatar */}
      {state === "single" && (
        <RoundAvatar
          size={64}
          name={node.members[0]?.name ?? node.title}
          photoUrl={node.members[0]?.imageUrl}
        />
      )}
      {state === "shared" && <DualAvatar holders={node.members} />}
      {state === "vacant" && <RoundAvatar size={64} glyph="+" dashed />}

      {/* Name slot — person (single) or position (shared/vacant) */}
      {state === "single" ? (
        <NameRhythm
          value={node.members[0]?.name ?? node.title}
          className="mt-2.5 text-base"
        />
      ) : (
        <NameRhythm
          value={node.title}
          italicLead={state === "vacant"}
          className="mt-2.5 text-base"
        />
      )}

      {/* Sub-label */}
      {state === "single" && <p className={SUBLABEL}>{node.title}</p>}
      {state === "shared" && (
        <p className={SUBLABEL}>{node.members.length} personen</p>
      )}
      {state === "vacant" && (
        <>
          <p className={SUBLABEL}>deze plek is vrij</p>
          {/* Interactive cards open the panel (vacant state carries the CTA);
              the inline link is only for the presentational directory. */}
          {interactive ? (
            <span
              className={`${CHIP_CLASSES} border-ink bg-cream text-ink mt-2.5`}
            >
              Iets voor jou? →
            </span>
          ) : (
            <Link
              href={vacantCtaHref}
              data-testid="org-person-card-vacant-cta"
              className={`${CHIP_LINK_CLASSES} border-ink bg-cream text-ink mt-2.5`}
            >
              Iets voor jou? →
              <LinkPendingDots />
            </Link>
          )}
        </>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        data-testid="org-person-card"
        data-member-card="true"
        data-node-id={node.id}
        data-card-state={state}
        aria-label={cardActionLabel(node, state)}
        className={rootClass}
      >
        {content}
      </button>
    );
  }

  return (
    <article
      data-testid="org-person-card"
      data-node-id={node.id}
      data-card-state={state}
      className={rootClass}
    >
      {content}
    </article>
  );
}
