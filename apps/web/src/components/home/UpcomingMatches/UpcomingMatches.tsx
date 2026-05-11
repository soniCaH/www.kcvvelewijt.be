import {
  EditorialHeading,
  MonoLabel,
  TapedCard,
} from "@/components/design-system";
import type { UpcomingMatch } from "@/components/match/types";
import { UpcomingMatchesClient } from "./UpcomingMatchesClient";

const KCVV_TEAM_ID = 1235;
const DEFAULT_VISIBLE = 5;

export interface UpcomingMatchesProps {
  matches: UpcomingMatch[];
  /** Render initially in expanded state. Used by Storybook to capture the
   *  expanded baseline; production homepage always starts collapsed. */
  initialExpanded?: boolean;
}

export const UpcomingMatches = ({
  matches,
  initialExpanded = false,
}: UpcomingMatchesProps) => {
  if (matches.length === 0) return null;

  return (
    <section
      aria-label="Komende wedstrijden"
      className="bg-cream-soft py-16 md:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <TapedCard
          rotation="b"
          bg="cream"
          shadow="md"
          padding="lg"
          tape={[{ color: "warm" }]}
        >
          <div className="mb-6 flex flex-col gap-2">
            <MonoLabel size="md">AGENDA</MonoLabel>
            <EditorialHeading level={2} size="display-md">
              Komende wedstrijden
            </EditorialHeading>
          </div>

          <UpcomingMatchesClient
            matches={matches}
            initialVisible={DEFAULT_VISIBLE}
            kcvvTeamId={KCVV_TEAM_ID}
            initialExpanded={initialExpanded}
          />
        </TapedCard>
      </div>
    </section>
  );
};

export { KCVV_TEAM_ID, DEFAULT_VISIBLE };
