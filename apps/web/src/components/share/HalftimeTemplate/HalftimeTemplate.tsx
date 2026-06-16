import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "../constants";
import {
  ShareFrame,
  ShareFoot,
  ShareMid,
  ShareTop,
} from "../shared/ShareFrame";
import {
  CrestMatchup,
  Kicker,
  Meta,
  Scoreline,
  Seam,
  ShareName,
} from "../shared/ShareElements";
import { resolveCrests, splitMatchName } from "../shared/theme";

export interface HalftimeTemplateProps {
  matchName: string;
  score: string;
  competition?: string;
  /** Club crest URLs (KCVV's side falls back to the local crest). */
  homeLogo?: string;
  awayLogo?: string;
  /** Optional fullscreen newsprint photo. */
  imageUrl?: string;
}

/**
 * Rust (half-time) template — 1080×1920 Instagram Story. Score is the hero,
 * with a club-crest matchup anchoring the top. Register A cream sheet, or a
 * fullscreen newsprint photo when an image is given.
 */
export function HalftimeTemplate({
  matchName,
  score,
  competition,
  homeLogo,
  awayLogo,
  imageUrl,
}: HalftimeTemplateProps) {
  const { home, away } = splitMatchName(matchName);
  const hasImage = Boolean(imageUrl);
  const crests = resolveCrests(matchName, homeLogo, awayLogo);
  const standMeta = competition ? `${away} · ${competition}` : away;

  return (
    <ShareFrame
      width={CAPTURE_WIDTH}
      height={CAPTURE_HEIGHT}
      register={hasImage ? "image" : "cream"}
      imageUrl={imageUrl}
      overlay="calm"
      decor={
        hasImage ? undefined : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              color: "rgba(0, 135, 85, 0.10)",
              backgroundImage:
                "radial-gradient(currentColor 3.7px, transparent 4px)",
              backgroundSize: "28px 28px",
            }}
          />
        )
      }
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
        <Kicker>Rust</Kicker>
        <Scoreline
          fontSize={460}
          style={{
            marginTop: "20px",
            textShadow: hasImage ? "10px 14px 0 rgba(0,0,0,0.45)" : undefined,
          }}
        >
          {score}
        </Scoreline>
        {hasImage ? (
          <Meta style={{ marginTop: "56px" }}>{matchName}</Meta>
        ) : (
          <>
            <Seam width="58%" style={{ margin: "64px 0 44px" }} />
            <ShareName fontSize={86}>{home}</ShareName>
            {standMeta && (
              <Meta style={{ marginTop: "28px" }}>{standMeta}</Meta>
            )}
          </>
        )}
      </ShareMid>
      <ShareFoot align="center" />
    </ShareFrame>
  );
}
