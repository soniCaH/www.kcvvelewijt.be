import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "../constants";
import {
  ShareFrame,
  ShareFoot,
  ShareMid,
  ShareTop,
} from "../shared/ShareFrame";
import {
  CrestMatchup,
  GhostNumeral,
  Headline,
  Kicker,
  Meta,
  NumDisc,
  PitchStripes,
  ShareName,
} from "../shared/ShareElements";
import { formatScore, resolveCrests } from "../shared/theme";

export interface GoalKcvvTemplateProps {
  playerName: string;
  shirtNumber?: number;
  score: string;
  matchName: string;
  minute: string;
  /** Club crest URLs (KCVV's side falls back to the local crest). */
  homeLogo?: string;
  awayLogo?: string;
  /**
   * Fullscreen newsprint photo. Resolved upstream via the chain
   * upload → Sanity celebrationImage → psdImage portrait → (none → filled).
   */
  imageUrl?: string;
}

/**
 * Goal KCVV template — 1080×1920 Instagram Story.
 * With a photo: fullscreen newsprint image + shout overlay. Without: a filled
 * register-B poster (jersey-stripe ground + giant ghost shirt number).
 */
export function GoalKcvvTemplate({
  playerName,
  shirtNumber,
  score,
  matchName,
  minute,
  homeLogo,
  awayLogo,
  imageUrl,
}: GoalKcvvTemplateProps) {
  const hasImage = Boolean(imageUrl);
  const standScore = formatScore(score);
  const numberLabel = shirtNumber ?? "—";
  const crests = resolveCrests(matchName, homeLogo, awayLogo);

  if (hasImage) {
    return (
      <ShareFrame
        width={CAPTURE_WIDTH}
        height={CAPTURE_HEIGHT}
        register="image"
        imageUrl={imageUrl}
        overlay="shout"
      >
        <ShareTop />
        <ShareMid style={{ justifyContent: "space-evenly" }}>
          <div>
            <Kicker>Doelpunt · {minute}&apos;</Kicker>
            <Headline
              punctuation="bang"
              fontSize={320}
              style={{
                marginTop: "8px",
                textShadow: "10px 14px 0 rgba(0,0,0,0.4)",
              }}
            >
              Goal
            </Headline>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "44px",
            }}
          >
            <NumDisc size={185} fontSize={107}>
              {numberLabel}
            </NumDisc>
            <div>
              <ShareName fontSize={108}>{playerName}</ShareName>
              <Meta style={{ marginTop: "14px" }}>Stand {standScore}</Meta>
            </div>
          </div>
        </ShareMid>
        <ShareFoot left={matchName} />
      </ShareFrame>
    );
  }

  return (
    <ShareFrame
      width={CAPTURE_WIDTH}
      height={CAPTURE_HEIGHT}
      register="dark"
      decor={
        <>
          <PitchStripes />
          <GhostNumeral
            fontSize={1208}
            style={{ right: "-90px", top: "-110px" }}
          >
            {numberLabel}
          </GhostNumeral>
        </>
      }
    >
      <ShareTop />
      <ShareMid style={{ justifyContent: "space-evenly" }}>
        <div>
          <Kicker>Doelpunt</Kicker>
          <Headline
            punctuation="bang"
            fontSize={300}
            style={{ marginTop: "8px" }}
          >
            Goal
          </Headline>
        </div>
        <CrestMatchup crests={crests} size={236} />
        <div>
          <ShareName fontSize={185}>{playerName}</ShareName>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
              marginTop: "40px",
            }}
          >
            <NumDisc size={163} fontSize={92}>
              {numberLabel}
            </NumDisc>
            <Meta>
              {minute}&apos; · Stand {standScore}
            </Meta>
          </div>
        </div>
      </ShareMid>
      <ShareFoot left={matchName} />
    </ShareFrame>
  );
}
