import { SubjectAvatar, type SubjectAvatarScale } from "./SubjectAvatar";
import { cn } from "@/lib/utils/cn";

/**
 * <SubjectAvatarCluster> — overlapping monogram discs for a "unaniem"
 * (all-subjects) answer. Always monogram, even at `attribution` scale: the
 * cluster is a compact identity marker for a shared answer, not a portrait,
 * so the photo path would only muddy an overlapping stack.
 *
 * Discs overlap left-to-right, each with a cream ring to stay legible
 * against its neighbour. Duo/trio interviews are the real cases; 4+ subjects
 * collapse the tail into a "+N" counter disc so the row can't blow out.
 */
export interface SubjectAvatarClusterMember {
  firstName: string;
  fullName?: string;
}

export interface SubjectAvatarClusterProps {
  members: SubjectAvatarClusterMember[];
  /** Row (32px, QARow) or attribution (64px, PullQuote). Both monogram. */
  scale?: Extract<SubjectAvatarScale, "row" | "attribution">;
  /** Max discs before the remainder collapses into a "+N" counter. */
  max?: number;
  className?: string;
}

const OVERLAP: Record<"row" | "attribution", string> = {
  row: "-ml-3",
  attribution: "-ml-5",
};

const COUNTER: Record<"row" | "attribution", string> = {
  row: "h-8 w-8 text-[13px]",
  attribution: "h-16 w-16 text-[20px]",
};

export function SubjectAvatarCluster({
  members,
  scale = "row",
  // ponytail: 3 discs covers duo/trio; 4+ collapse to "+N". Raise if a
  // panel format ever needs every face shown.
  max = 3,
  className,
}: SubjectAvatarClusterProps) {
  if (members.length === 0) return null;
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <div
      data-subject-avatar-cluster="true"
      data-count={members.length}
      className={cn("inline-flex items-center", className)}
    >
      {visible.map((m, i) => (
        <SubjectAvatar
          key={`${m.firstName}-${i}`}
          firstName={m.firstName}
          fullName={m.fullName}
          scale={scale}
          className={cn("ring-cream ring-2", i > 0 && OVERLAP[scale])}
        />
      ))}
      {overflow > 0 && (
        <span
          data-subject-avatar-cluster="overflow"
          role="img"
          aria-label={`nog ${overflow}`}
          className={cn(
            "bg-jersey-deep text-cream ring-cream inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold ring-2",
            COUNTER[scale],
            OVERLAP[scale],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
