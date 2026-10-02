import { RoundAvatar } from "../RoundAvatar";
import {
  SubjectAvatar,
  SUBJECT_AVATAR_SIZE,
  type SubjectAvatarScale,
} from "./SubjectAvatar";
import { cn } from "@/lib/utils/cn";

/**
 * <SubjectAvatarCluster> — overlapping monogram discs for a "unaniem"
 * (all-subjects) answer, on the round avatar family (#3332): same ramp, ring and
 * fill as `<SubjectAvatar>`. Always monogram, even at `attribution` scale: the
 * cluster is a compact identity marker for a shared answer, not a portrait,
 * so the photo path would only muddy an overlapping stack.
 *
 * Discs overlap left-to-right; the ink ring keeps each legible against its
 * neighbour. Duo/trio interviews are the real cases; 4+ subjects collapse the
 * tail into a "+N" count disc that takes the ring, fill and size of the avatars
 * beside it, so the row can't blow out.
 */
export interface SubjectAvatarClusterMember {
  firstName: string;
}

export interface SubjectAvatarClusterProps {
  members: SubjectAvatarClusterMember[];
  /** Row (40px, QARow) or attribution (64px, PullQuote). Both monogram. */
  scale?: Extract<SubjectAvatarScale, "row" | "attribution">;
  /** Max discs before the remainder collapses into a "+N" counter. */
  max?: number;
  className?: string;
}

const OVERLAP: Record<"row" | "attribution", string> = {
  row: "-ml-3",
  attribution: "-ml-5",
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
      aria-hidden="true"
      className={cn("inline-flex items-center", className)}
    >
      <span aria-hidden="true" className="contents">
        {visible.map((m, i) => (
          <SubjectAvatar
            key={`${m.firstName}-${i}`}
            firstName={m.firstName}
            scale={scale}
            className={cn(i > 0 && OVERLAP[scale])}
          />
        ))}
        {overflow > 0 && (
          <RoundAvatar
            size={SUBJECT_AVATAR_SIZE[scale]}
            glyph={`+${overflow}`}
            className={OVERLAP[scale]}
          />
        )}
      </span>
    </div>
  );
}
