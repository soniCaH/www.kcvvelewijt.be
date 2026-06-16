import { SQUARE_SIZE } from "../constants";
import {
  ShareFrame,
  ShareFoot,
  ShareMid,
  ShareTop,
} from "../shared/ShareFrame";
import {
  CrestMatchup,
  Headline,
  Kicker,
  Meta,
  Scoreline,
} from "../shared/ShareElements";
import {
  resolveCrests,
  resolveResultMood,
  type ResultMood,
} from "../shared/theme";

export interface SquareResultTemplateProps {
  matchName: string;
  score: string;
  mood: ResultMood;
  competition?: string;
  /** Club crest URLs (KCVV's side falls back to the local crest). */
  homeLogo?: string;
  awayLogo?: string;
  /** Optional fullscreen newsprint photo. */
  imageUrl?: string;
}

/**
 * Result template — 1:1 (1080×1080) Instagram feed post. Score + result
 * headline over the mood register, or a fullscreen newsprint photo.
 */
export function SquareResultTemplate({
  matchName,
  score,
  mood,
  competition,
  homeLogo,
  awayLogo,
  imageUrl,
}: SquareResultTemplateProps) {
  const m = resolveResultMood(mood);
  const hasImage = Boolean(imageUrl);
  const crests = resolveCrests(matchName, homeLogo, awayLogo);

  return (
    <ShareFrame
      width={SQUARE_SIZE}
      height={SQUARE_SIZE}
      register={hasImage ? "image" : m.register}
      sentiment={m.sentiment}
      imageUrl={imageUrl}
      overlay={m.overlay}
    >
      <ShareTop />
      <ShareMid center>
        {!hasImage && (
          <CrestMatchup
            crests={crests}
            size={150}
            style={{ marginBottom: "24px" }}
          />
        )}
        <Kicker>Eindstand</Kicker>
        <Scoreline
          fontSize={286}
          style={{
            marginTop: "14px",
            textShadow: hasImage ? "8px 12px 0 rgba(0,0,0,0.45)" : undefined,
          }}
        >
          {score}
        </Scoreline>
        <Headline
          punctuation={m.punctuation}
          fontSize={116}
          style={{ marginTop: "18px" }}
        >
          {m.headline}
        </Headline>
        {competition && (
          <Meta style={{ marginTop: "36px" }}>{competition}</Meta>
        )}
      </ShareMid>
      <ShareFoot left={matchName} align="center" />
    </ShareFrame>
  );
}
