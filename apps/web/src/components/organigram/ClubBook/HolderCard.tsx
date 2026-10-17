import { RoundAvatar } from "@/components/design-system";
import type { RowHolder } from "./club-book";
import { MemberContact, MemberName } from "./MemberContact";

/**
 * Unfolded under a ledger row: one card per holder — face, name, contact and
 * the questions this person answers **in this role**, each linking to that
 * question in the finder (the finder reveals a `#<id>` itself).
 */
export function HolderCard({ holder }: { holder: RowHolder }) {
  return (
    <div className="border-ink bg-cream-soft shadow-paper-sm flex gap-3 border p-3">
      <RoundAvatar
        size={40}
        name={holder.name}
        photoUrl={holder.imageUrl}
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <MemberName
          member={holder}
          className="text-ink text-body-md font-bold"
        />
        <MemberContact member={holder} />
        {holder.questions.length > 0 && (
          <>
            <p className="text-label text-ink-muted mt-2 font-mono uppercase">
              Hier kan je terecht voor
            </p>
            <ul className="text-body-sm text-ink flex flex-col gap-1">
              {holder.questions.map((q) => (
                <li key={q.id}>
                  <a href={`#${q.id}`} className="hover:underline">
                    Ik {q.question}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
