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
  Seam,
} from "../shared/ShareElements";
import {
  resolveCrests,
  resolveResultMood,
  type ResultMood,
} from "../shared/theme";

export type FullTimeMood = ResultMood;

export interface FullTimeTemplateProps {
  matchName: string;
  score: string;
  mood: FullTimeMood;
  competition?: string;
  /** Club crest URLs (KCVV's side falls back to the local crest). */
  homeLogo?: string;
  awayLogo?: string;
  /** Optional fullscreen newsprint photo. */
  imageUrl?: string;
}

/**
 * Eindstand (full-time) template — 1080×1920 Instagram Story. The score is the
 * hero. Win → loud register B; draw → calm cream; loss → sober cream/brick.
 * Register A/B by default, or a fullscreen newsprint photo when supplied.
 */
export function FullTimeTemplate({
  matchName,
  score,
  mood,
  competition,
  homeLogo,
  awayLogo,
  imageUrl,
}: FullTimeTemplateProps) {
  const m = resolveResultMood(mood);
  const hasImage = Boolean(imageUrl);
  const crests = resolveCrests(matchName, homeLogo, awayLogo);

  // Per-mood accent under the result headline. Exhaustive switch over the
  // result-mood union so a future mood is caught at compile time.
  const accentBand = (() => {
    switch (mood) {
      case "draw":
        return <Seam width="60%" style={{ margin: "8px 0 4px" }} />;
      case "loss":
        return (
          <HalftoneBand
            width="64%"
            color="rgba(201,63,28,0.5)"
            height={46}
            style={{ margin: "8px 0 4px" }}
          />
        );
      case "win":
        return (
          <HalftoneBand
            width="64%"
            color="rgba(245,241,230,0.5)"
            height={46}
            style={{ margin: "8px 0 4px" }}
          />
        );
      default:
        return mood satisfies never;
    }
  })();

  return (
    <ShareFrame
      width={CAPTURE_WIDTH}
      height={CAPTURE_HEIGHT}
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
            size={236}
            style={{ marginBottom: "48px" }}
          />
        )}
        <Kicker>Eindstand</Kicker>
        <Scoreline
          fontSize={460}
          style={{
            marginTop: "20px",
            textShadow: hasImage ? "10px 14px 0 rgba(0,0,0,0.45)" : undefined,
          }}
        >
          {score}
        </Scoreline>
        <Headline
          punctuation={m.punctuation}
          fontSize={170}
          style={{ marginTop: "28px" }}
        >
          {m.headline}
        </Headline>
        {!hasImage && accentBand}
        {competition && (
          <Meta style={{ marginTop: "28px" }}>{competition}</Meta>
        )}
      </ShareMid>
      <ShareFoot left={matchName} align="center" />
    </ShareFrame>
  );
}
