import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SponsorRepository } from "@/lib/repositories/sponsor.repository";
import { SponsorsBlock } from "@/components/sponsors";
import type { Sponsor } from "@/components/sponsors";

export interface SponsorsSectionProps {
  className?: string;
}

export async function SponsorsSection({ className }: SponsorsSectionProps) {
  const sponsors = await runPromise(
    Effect.gen(function* () {
      const repo = yield* SponsorRepository;
      const all = yield* repo.findAll();
      return all
        .filter(
          (s) =>
            s.tier === "hoofdsponsor" ||
            s.tier === "sponsor" ||
            (!s.tier &&
              s.type &&
              ["crossing", "green", "white"].includes(s.type)),
        )
        .map(
          (s): Sponsor => ({
            id: s.id,
            name: s.name,
            logo: s.logoUrl ?? "",
            url: s.url ?? undefined,
            tier: s.tier ?? "sponsor",
          }),
        );
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[SponsorsSection] Failed to fetch sponsors:", error);
        return Effect.succeed<Sponsor[]>([]);
      }),
    ),
  );

  return <SponsorsBlock sponsors={sponsors} className={className} />;
}
