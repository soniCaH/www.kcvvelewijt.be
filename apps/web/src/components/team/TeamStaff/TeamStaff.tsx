import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface TeamStaffMemberData {
  id: string;
  firstName: string;
  lastName: string;
  /** PSD functionTitle code or free-text (e.g. "T1", "Hoofdtrainer"). */
  functionTitle?: string | null;
  /** Editorial role bucket fallback ("trainer" / "afgevaardigde"). */
  role?: string | null;
  /** Round photo URL (newsprint-treated). Missing → monogram fallback. */
  imageUrl?: string | null;
}

export interface TeamStaffProps {
  staff: readonly TeamStaffMemberData[];
}

// PSD function codes → readable Dutch labels. Mirrors the organigram role codes.
const FUNCTION_CODE_LABELS: Record<string, string> = {
  T1: "Hoofdtrainer",
  T2: "Assistent-trainer",
  TK: "Keeperstrainer",
  TVJO: "Jeugdcoördinator",
};

// Editorial role bucket → capitalised label (fallback when functionTitle null).
const ROLE_BUCKET_LABELS: Record<string, string> = {
  trainer: "Trainer",
  afgevaardigde: "Afgevaardigde",
};

/**
 * Resolve a staff member's display function:
 *   1. functionTitle is a known code → mapped label
 *   2. functionTitle is already-readable free text → pass through
 *   3. functionTitle null → role bucket (Trainer / Afgevaardigde)
 *   4. nothing usable → "Staf"
 */
export function resolveFunctionLabel(
  functionTitle: string | null | undefined,
  role: string | null | undefined,
): string {
  const ft = functionTitle?.trim();
  if (ft) {
    return FUNCTION_CODE_LABELS[ft.toUpperCase()] ?? ft;
  }
  const bucket = role?.trim().toLowerCase();
  if (bucket && ROLE_BUCKET_LABELS[bucket]) {
    return ROLE_BUCKET_LABELS[bucket];
  }
  return "Staf";
}

function initials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  return `${f}${l}`.toLocaleUpperCase("nl-BE") || "·";
}

function StaffCard({ member }: { member: TeamStaffMemberData }) {
  // Trim so a whitespace-only CMS value doesn't feed an invalid <Image> src.
  const imageUrl = member.imageUrl?.trim() ?? "";
  const hasPhoto = imageUrl !== "";
  const fn = resolveFunctionLabel(member.functionTitle, member.role);

  return (
    <div
      data-testid="team-staff-card"
      data-state={hasPhoto ? "photo" : "monogram"}
      className="border-ink bg-cream flex flex-col items-center border-2 p-3 text-center shadow-[3px_3px_0_0_var(--color-ink)]"
    >
      {/* Round photo or monogram */}
      <div className="border-ink h-16 w-16 overflow-hidden rounded-full border-2">
        {hasPhoto ? (
          <Image
            src={imageUrl}
            alt={`${member.firstName} ${member.lastName}`}
            width={64}
            height={64}
            unoptimized
            className="h-full w-full object-cover"
            style={{ filter: "var(--filter-photo-newsprint)" }}
          />
        ) : (
          <span
            aria-hidden="true"
            // 24px keeps the jersey-deep-on-cream-soft monogram (3.73:1) within
            // axe's large-text 3:1 threshold — the locked colours stay intact.
            className="bg-cream-soft text-jersey-deep font-display-big flex h-full w-full items-center justify-center text-2xl font-black"
          >
            {initials(member.firstName, member.lastName)}
          </span>
        )}
      </div>

      {/* Name — first semibold + last italic */}
      <p className="font-display text-ink mt-2 leading-[1.05]">
        <span className="font-semibold">{member.firstName}</span>{" "}
        <em className="font-normal italic">{member.lastName}</em>
      </p>

      {/* Function */}
      <p className="text-ink-muted mt-1 font-mono text-[9px] tracking-[0.06em] uppercase">
        {fn}
      </p>
    </div>
  );
}

export function TeamStaff({ staff }: TeamStaffProps) {
  if (staff.length === 0) return null;

  return (
    <div
      data-testid="team-staff"
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4",
      )}
    >
      {staff.map((member) => (
        <StaffCard key={member.id} member={member} />
      ))}
    </div>
  );
}
