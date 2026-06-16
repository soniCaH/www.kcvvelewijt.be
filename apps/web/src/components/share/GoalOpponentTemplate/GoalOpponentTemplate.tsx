import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "../constants";
import {
  ShareFrame,
  ShareFoot,
  ShareMid,
  ShareTop,
} from "../shared/ShareFrame";
import {
  CrestMatchup,
  HalftoneBand,
  Headline,
  Kicker,
  Meta,
  Scoreline,
} from "../shared/ShareElements";
import { opponentName, resolveCrests } from "../shared/theme";

export interface GoalOpponentTemplateProps {
  score: string;
  matchName: string;
  minute: string;
  competition?: string;
  /** Club crest URLs (KCVV's side falls back to the local crest). */
  homeLogo?: string;
  awayLogo?: string;
}

/**
 * Tegendoelpunt (opponent goal) template — 1080×1920 Instagram Story.
 * Register A, sober/negative sentiment — acknowledgement, not celebration.
 * Crest matchup centres the card; a brick halftone band sits under the score.
 */
export function GoalOpponentTemplate({
  score,
  matchName,
  minute,
  competition,
  homeLogo,
  awayLogo,
}: GoalOpponentTemplateProps) {
  const opponent = opponentName(matchName);
  const crests = resolveCrests(matchName, homeLogo, awayLogo);
  const metaLine = competition ? `${minute}' · ${competition}` : `${minute}'`;

  return (
    <ShareFrame
      width={CAPTURE_WIDTH}
      height={CAPTURE_HEIGHT}
      register="cream"
      sentiment="negative"
    >
      <ShareTop />
      <ShareMid style={{ justifyContent: "space-evenly" }}>
        <div>
          <Kicker style={{ display: "block" }}>Tegendoelpunt</Kicker>
          <Kicker style={{ display: "block", marginTop: "6px" }}>
            {opponent}
          </Kicker>
          <Headline
            punctuation="dot"
            fontSize={300}
            style={{ marginTop: "24px" }}
          >
            Goal
          </Headline>
        </div>
        <CrestMatchup crests={crests} size={236} />
        <div>
          <Scoreline fontSize={420}>{score}</Scoreline>
          <HalftoneBand
            width="80%"
            color="rgba(201,63,28,0.5)"
            height={56}
            style={{ margin: "40px 0 24px" }}
          />
          <Meta>{metaLine}</Meta>
        </div>
      </ShareMid>
      <ShareFoot left={matchName} />
    </ShareFrame>
  );
}
