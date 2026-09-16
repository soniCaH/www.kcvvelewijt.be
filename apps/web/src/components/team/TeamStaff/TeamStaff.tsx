import { PlayerCard, PersonCardRun } from "@/components/team/SquadGrid";
import { ExternalMark } from "@/components/design-system/ExternalMark";
import { EXTERNAL_LINKS } from "@/lib/constants";

export interface TeamStaffMemberData {
  id: string;
  firstName: string;
  lastName: string;
  /** PSD functionTitle, shown verbatim (e.g. "T1 - A-team", "TVJO", "Keeperstrainer"). */
  functionTitle?: string | null;
  /** Editorial role bucket fallback ("trainer" / "afgevaardigde"). */
  role?: string | null;
  /**
   * Photo URL (newsprint-treated). Missing → the coat-garment
   * `<JerseyIllustration>` fallback (#2485).
   */
  imageUrl?: string | null;
  /**
   * Staff-detail URL (`/staf/{psdId}`). Set only when a detail page exists
   * for this member; present → the card becomes a link to that profile.
   */
  href?: string | null;
}

export interface TeamStaffProps {
  staff: readonly TeamStaffMemberData[];
  /** The run's own word — forwarded to `<PersonCardRun>`'s `label` (#2575 review). "Staf" on the team page, "De leden" on a board page. */
  heading: string;
  /**
   * Gates two repairs for a PSD data gap, together (#2638 review): the
   * labelled-first reorder AND the one-line ProSoccerData notice beneath
   * the cards. Both are a response to *missing PSD data*, so both stay off
   * the same switch. Team-page-only: ProSoccerData is PSD's dashboard, and
   * board members aren't PSD-tracked — `<BestuurPage>` leaves this at its
   * default `false`, which means an editor's hand-curated `staff[]` order
   * on `/club/bestuur` etc. is never silently overridden, and the section
   * never earns a footnote it has no PSD authority to make. Card-level
   * `resolveFunctionLabel` still returns `null` and the function line still
   * omits on a board card either way — this prop only controls the reorder
   * and the notice, not the per-card label itself.
   */
  unlabelledNotice?: boolean;
}

// Editorial role bucket → capitalised label (fallback when functionTitle null).
const ROLE_BUCKET_LABELS: Record<string, string> = {
  trainer: "Trainer",
  afgevaardigde: "Afgevaardigde",
};

/**
 * Resolve a staff member's display function:
 *   1. functionTitle present → pass through verbatim. PSD is the writer and
 *      its codes (`T1`, `TVJO`, …) are the club's official titles, so the
 *      site does not translate them (#2495).
 *   2. functionTitle null, role is a known bucket → bucket label (Trainer / …)
 *   3. functionTitle null, role is free text → pass the role through verbatim
 *      (board titles "Voorzitter" / "Secretaris" / … live in `role`; their
 *      `functionTitle` is PSD-empty, so without this they'd fall to null)
 *   4. nothing usable → null (#2638) — the card omits the function line
 *      entirely rather than shipping a last-resort "Staf" that classifies
 *      nobody. `role` is empty club-wide today but is the board's path
 *      elsewhere.
 */
export function resolveFunctionLabel(
  functionTitle: string | null | undefined,
  role: string | null | undefined,
): string | null {
  const ft = functionTitle?.trim();
  if (ft) return ft;
  const roleText = role?.trim();
  if (roleText) {
    return ROLE_BUCKET_LABELS[roleText.toLowerCase()] ?? roleText;
  }
  return null;
}

/**
 * `<TeamStaff>` — one `<PersonCardRun>` of the shared `<PlayerCard>`
 * (#2477), `garment="coat"` for the imageless fallback (#2485). Renders on
 * `/ploegen/[slug]` and, via `<BestuurPage>`, on the three board routes.
 *
 * When `unlabelledNotice` is set, cards are ordered labelled-first,
 * unlabelled-after (#2638), each part keeping the order the page composed
 * it in — a filter-and-concat rather than a sort, so nothing depends on
 * comparator stability. On a U9 that puts the two named roles at the top
 * and reads the remaining three as helpers, rather than scattering two
 * facts through three blanks. When it's unset (the board-page default),
 * cards keep the caller's own order — a curated Sanity `staff[]` ordering
 * is never silently overridden by a repair for data the board isn't
 * PSD-tracked to have anyway (#2638 review).
 */
export function TeamStaff({
  staff,
  heading,
  unlabelledNotice = false,
}: TeamStaffProps) {
  if (staff.length === 0) return null;

  const resolved = staff.map((member) => ({
    member,
    label: resolveFunctionLabel(member.functionTitle, member.role),
  }));
  const ordered = unlabelledNotice
    ? [
        ...resolved.filter((r) => r.label !== null),
        ...resolved.filter((r) => r.label === null),
      ]
    : resolved;
  const hasUnlabelled = resolved.some((r) => r.label === null);

  return (
    <>
      <PersonCardRun label={heading} data-testid="team-staff-grid">
        {ordered.map(({ member, label }) => (
          <PlayerCard
            key={member.id}
            id={member.id}
            firstName={member.firstName}
            lastName={member.lastName}
            position={label ?? undefined}
            photoUrl={member.imageUrl?.trim() || undefined}
            href={member.href?.trim() || undefined}
            garment="coat"
            linkAffordance
          />
        ))}
      </PersonCardRun>

      {unlabelledNotice && hasUnlabelled ? (
        <p
          data-testid="team-staff-gap-notice"
          className="text-ink font-body mt-4 text-base leading-relaxed"
        >
          Niet elke functie is ingevuld. Wie welke rol heeft, weet je zeker via{" "}
          <a
            href={EXTERNAL_LINKS.psdDashboard}
            target="_blank"
            rel="noopener noreferrer"
            className="prose-link"
          >
            ProSoccerData
            <ExternalMark />
          </a>
          .
        </p>
      ) : null}
    </>
  );
}
