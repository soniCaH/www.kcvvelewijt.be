import {
  EditorialHeading,
  EmptyState,
  MonoLabel,
  PageContainer,
  TapedCard,
} from "@/components/design-system";
import type { UpcomingRow } from "@/components/match/types";
import { UpcomingMatchesClient } from "./UpcomingMatchesClient";
import type { AgendaSurface } from "./upcoming-matches-analytics";

const KCVV_TEAM_ID = 1235;
const DEFAULT_VISIBLE = 5;

export interface UpcomingMatchesProps {
  matches: UpcomingRow[];
  /** Render initially in expanded state. Used by Storybook to capture the
   *  expanded baseline; production homepage always starts collapsed. */
  initialExpanded?: boolean;
  /**
   * A match read failed (BFF/PSD down), as opposed to the feed genuinely
   * holding no rows. Only read on the no-rows path: with rows present the
   * agenda renders as normal regardless of this flag. Mirrors
   * `<FirstTeamsBlock>`'s own `unavailable` prop, minus "Uitslagen" — this
   * band shows fixtures only, never results (#2505/#2844).
   *
   * @default false
   */
  unavailable?: boolean;
  /**
   * Where the band renders (#3430). `"kalender"` drops the "Volledige
   * kalender" link revealed on expand — the band sits above that calendar —
   * and tags row clicks `kalender_agenda` instead of `home_agenda`.
   *
   * @default "home"
   */
  surface?: AgendaSurface;
}

export const UpcomingMatches = ({
  matches,
  initialExpanded = false,
  unavailable = false,
  surface = "home",
}: UpcomingMatchesProps) => {
  // No rows and the read didn't fail → genuinely nothing to show, so the
  // whole section drops (matches the NewsGrid E.1 convention). A failed read
  // holds the band's shape instead — see the `<EmptyState>` branch below.
  if (matches.length === 0 && !unavailable) return null;

  return (
    <section
      aria-label="Komende wedstrijden"
      className="bg-cream-soft py-16 md:py-20"
    >
      <PageContainer width="index">
        <TapedCard
          rotation="b"
          bg="cream"
          shadow="md"
          padding="lg"
          tape={[{ color: "warm", seed: "Komende wedstrijden" }]}
        >
          <div className="mb-6 flex flex-col gap-2">
            <MonoLabel size="md">AGENDA</MonoLabel>
            <EditorialHeading level={2} size="display-md">
              Komende wedstrijden
            </EditorialHeading>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              tier="slot"
              reason="unavailable"
              emphasis={{ text: "even niet beschikbaar" }}
            >
              Komende wedstrijden zijn even niet beschikbaar. Probeer het later
              opnieuw.
            </EmptyState>
          ) : (
            <UpcomingMatchesClient
              matches={matches}
              initialVisible={DEFAULT_VISIBLE}
              kcvvTeamId={KCVV_TEAM_ID}
              initialExpanded={initialExpanded}
              surface={surface}
            />
          )}
        </TapedCard>
      </PageContainer>
    </section>
  );
};
