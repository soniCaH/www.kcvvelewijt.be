"use client";

import { MonoLabel, RoundAvatar } from "@/components/design-system";
import { revealHash } from "@/lib/utils/same-page-anchor";
import { KAARTENBAK } from "./card-style";
import type { RowHolder } from "./club-book";
import { MemberContact, MemberName } from "./MemberContact";

/**
 * Unfolded under a ledger row: one card per holder — face, name, contact and
 * the questions this person answers **in this role**, each linking to that
 * question in the finder.
 */
export function HolderCard({ holder }: { holder: RowHolder }) {
  return (
    <div className={`${KAARTENBAK} flex gap-3 p-3`}>
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
            <p className="mt-2">
              <MonoLabel tone="muted">Hier kan je terecht voor</MonoLabel>
            </p>
            <ul className="text-body-sm text-ink flex flex-col gap-1">
              {holder.questions.map((q) => (
                <li key={q.id}>
                  <a
                    href={`#${q.id}`}
                    // The finder reveals a `#<id>` itself, but only on a
                    // `hashchange`: a question whose hash is already in the
                    // URL needs `revealHash` to reveal it again.
                    onClick={(event) => {
                      event.preventDefault();
                      revealHash(q.id);
                    }}
                    className="hover:underline"
                  >
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
