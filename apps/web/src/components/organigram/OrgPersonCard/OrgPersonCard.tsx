import Image from "next/image";
import Link from "next/link";
import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";

/**
 * `<OrgPersonCard>` — the Phase 7 `/hulp` structure card (design lock `7o4`).
 *
 * Extends the 6.C `<TeamStaff>` idiom (round newsprint photo OR jersey-deep
 * monogram · first-semibold + last-italic name · mono function label) and
 * parameterises it by **occupancy state** and **scale**:
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
export type OrgPersonCardScale = "directory" | "node";

export interface OrgPersonCardProps {
  /** The organigram position this card represents. */
  node: OrgChartNode;
  /**
   * Render scale. `directory` (default) is the 64px-avatar browse card;
   * `node` is the smaller explorer-leaf chrome (Phase 3, #2054).
   */
  scale?: OrgPersonCardScale;
  /**
   * Where the vacant-recruit CTA points. Defaults to the club contact page —
   * the same destination the hub's closing `<CtaBand>` uses (7o4: "to
   * contact/Hulp"; final route confirmed in 7o7).
   */
  vacantCtaHref?: string;
  className?: string;
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

/**
 * Monogram initials (max 2 chars) from a name/title: first + last token initial.
 * Returns "·" when there is no usable text, mirroring 6.C's fallback glyph.
 */
export function monogramInitials(value: string | undefined): string {
  const parts = (value ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase("nl-BE") || "·";
}

// ─── Scale config ────────────────────────────────────────────────────────────

interface ScaleConfig {
  avatarPx: number;
  avatarClass: string;
  monoClass: string;
  dualWrapClass: string;
  dualCirclePx: number;
  dualCircleClass: string;
  dualMonoClass: string;
  plusNClass: string;
  nameClass: string;
}

const SCALE_CONFIG: Record<OrgPersonCardScale, ScaleConfig> = {
  directory: {
    avatarPx: 64,
    avatarClass: "h-16 w-16",
    monoClass: "text-2xl",
    dualWrapClass: "h-16 w-[78px]",
    dualCirclePx: 52,
    dualCircleClass: "h-[52px] w-[52px]",
    dualMonoClass: "text-lg",
    plusNClass: "h-[30px] w-[30px] text-[11px]",
    nameClass: "text-base",
  },
  node: {
    avatarPx: 48,
    avatarClass: "h-12 w-12",
    monoClass: "text-xl",
    dualWrapClass: "h-12 w-[60px]",
    dualCirclePx: 40,
    dualCircleClass: "h-10 w-10",
    dualMonoClass: "text-sm",
    plusNClass: "h-6 w-6 text-[9px]",
    nameClass: "text-sm",
  },
};

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

const AVATAR_RING =
  "border-ink bg-cream-soft flex items-center justify-center overflow-hidden rounded-full border-2";

const MONO_GLYPH = "text-jersey-deep font-display-big font-black";

/** Single round avatar: newsprint photo, or jersey-deep monogram fallback. */
function SingleAvatar({
  name,
  imageUrl,
  cfg,
}: {
  name: string;
  imageUrl?: string;
  cfg: ScaleConfig;
}) {
  const src = imageUrl?.trim() ?? "";
  const hasPhoto = src !== "";
  return (
    <div className={cn(AVATAR_RING, cfg.avatarClass)}>
      {hasPhoto ? (
        <Image
          src={src}
          alt={name}
          width={cfg.avatarPx}
          height={cfg.avatarPx}
          unoptimized
          className="h-full w-full object-cover"
          style={{ filter: "var(--filter-photo-newsprint)" }}
        />
      ) : (
        <span aria-hidden="true" className={cn(MONO_GLYPH, cfg.monoClass)}>
          {monogramInitials(name)}
        </span>
      )}
    </div>
  );
}

/** Overlapping dual-avatar cue for shared roles (static — no hover/tooltip). */
function DualAvatar({
  holders,
  cfg,
}: {
  holders: OrgChartNode["members"];
  cfg: ScaleConfig;
}) {
  const [a, b] = holders;
  const extra = holders.length - 2;

  const circle = (
    member: OrgChartNode["members"][number] | undefined,
    pos: "left" | "right",
  ) => {
    const src = member?.imageUrl?.trim() ?? "";
    const hasPhoto = src !== "";
    return (
      <span
        className={cn(
          AVATAR_RING,
          cfg.dualCircleClass,
          "absolute top-[6px]",
          pos === "left" ? "left-0 z-20" : "right-0 z-10",
        )}
      >
        {hasPhoto ? (
          <Image
            src={src}
            alt={member?.name ?? ""}
            width={cfg.dualCirclePx}
            height={cfg.dualCirclePx}
            unoptimized
            className="h-full w-full object-cover"
            style={{ filter: "var(--filter-photo-newsprint)" }}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(MONO_GLYPH, cfg.dualMonoClass)}
          >
            {monogramInitials(member?.name)}
          </span>
        )}
      </span>
    );
  };

  return (
    <div
      aria-hidden="true"
      className={cn("relative", cfg.dualWrapClass)}
      data-testid="org-person-card-dual-avatar"
    >
      {circle(a, "left")}
      {circle(b, "right")}
      {extra > 0 && (
        <span
          className={cn(
            "border-ink bg-jersey-deep text-cream absolute top-[6px] -right-[6px] z-30 flex items-center justify-center rounded-full border-2 font-mono font-semibold",
            cfg.plusNClass,
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

const SUBLABEL =
  "text-ink-muted mt-1.5 font-mono text-[9px] tracking-[0.06em] uppercase";

// ─── Component ───────────────────────────────────────────────────────────────

export function OrgPersonCard({
  node,
  scale = "directory",
  vacantCtaHref = "/club/contact",
  className,
}: OrgPersonCardProps) {
  const state = deriveCardState(node.members.length);
  const cfg = SCALE_CONFIG[scale];

  const baseCard =
    "border-ink relative flex flex-col items-center border-2 p-3 text-center";

  return (
    <article
      data-testid="org-person-card"
      data-node-id={node.id}
      data-card-state={state}
      className={cn(
        baseCard,
        state === "vacant"
          ? "bg-warm shadow-paper-sm"
          : "bg-cream shadow-[3px_3px_0_0_var(--color-ink)]",
        className,
      )}
    >
      {/* roleCode pill — top-right, auto-hides when absent (7o4). */}
      {node.roleCode && (
        <span
          data-testid="org-person-card-rolepill"
          className="border-ink bg-jersey-deep text-cream absolute top-2 right-2 border-[1.5px] px-1.5 py-px font-mono text-[8px] font-semibold tracking-[0.05em] uppercase"
        >
          {node.roleCode}
        </span>
      )}

      {/* Avatar */}
      {state === "single" && (
        <SingleAvatar
          name={node.members[0]?.name ?? node.title}
          imageUrl={node.members[0]?.imageUrl}
          cfg={cfg}
        />
      )}
      {state === "shared" && <DualAvatar holders={node.members} cfg={cfg} />}
      {state === "vacant" && (
        <div
          className={cn(
            AVATAR_RING,
            cfg.avatarClass,
            "border-dashed bg-white/45",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "text-jersey-deep font-display-big font-black italic",
              cfg.monoClass,
            )}
          >
            +
          </span>
        </div>
      )}

      {/* Name slot — person (single) or position (shared/vacant) */}
      {state === "single" ? (
        <NameRhythm
          value={node.members[0]?.name ?? node.title}
          className={cn("mt-2.5", cfg.nameClass)}
        />
      ) : (
        <NameRhythm
          value={node.title}
          italicLead={state === "vacant"}
          className={cn("mt-2.5", cfg.nameClass)}
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
          <Link
            href={vacantCtaHref}
            data-testid="org-person-card-vacant-cta"
            className="border-ink bg-cream text-ink shadow-paper-sm mt-2.5 border-[1.5px] px-2.5 py-1.5 font-mono text-[9px] font-bold tracking-[0.06em] uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Iets voor jou? →
          </Link>
        </>
      )}
    </article>
  );
}
