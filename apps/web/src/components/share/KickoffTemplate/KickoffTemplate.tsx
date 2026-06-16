import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "../constants";
import {
  ShareFrame,
  ShareFoot,
  ShareMid,
  ShareTop,
} from "../shared/ShareFrame";
import {
  CrestMatchup,
  Dash,
  GhostLetter,
  Kicker,
  Meta,
  Seam,
  ShareName,
} from "../shared/ShareElements";
import { resolveCrests, splitMatchName } from "../shared/theme";

export interface KickoffTemplateProps {
  matchName: string;
  competition?: string;
  /** Kickoff line, e.g. "Zaterdag · 20:00 · Terrein A". */
  dateTime?: string;
  /** Home club crest URL (KCVV's side falls back to the local crest). */
  homeLogo?: string;
  /** Away club crest URL (KCVV's side falls back to the local crest). */
  awayLogo?: string;
  /** Optional fullscreen newsprint photo. */
  imageUrl?: string;
}

/**
 * Aftrap (kickoff) template — 1080×1920 Instagram Story.
 * Register A cream sheet with a club-crest matchup hero, or a fullscreen
 * newsprint photo when an image is given.
 */
export function KickoffTemplate({
  matchName,
  competition,
  dateTime,
  homeLogo,
  awayLogo,
  imageUrl,
}: KickoffTemplateProps) {
  const { home, away } = splitMatchName(matchName);
  const hasImage = Boolean(imageUrl);
  const crests = resolveCrests(matchName, homeLogo, awayLogo);

  if (hasImage) {
    return (
      <ShareFrame
        width={CAPTURE_WIDTH}
        height={CAPTURE_HEIGHT}
        register="image"
        imageUrl={imageUrl}
        overlay="calm"
      >
        <ShareTop />
        <ShareMid center>
          <Kicker>{competition ? `Aftrap · ${competition}` : "Aftrap"}</Kicker>
          <ShareName fontSize={140} style={{ marginTop: "56px" }}>
            {home}
          </ShareName>
          {away && (
            <>
              <Dash style={{ margin: "20px 0" }} />
              <ShareName fontSize={140} accent>
                {away}
              </ShareName>
            </>
          )}
        </ShareMid>
        <ShareFoot left={dateTime} align="center" />
      </ShareFrame>
    );
  }

  return (
    <ShareFrame
      width={CAPTURE_WIDTH}
      height={CAPTURE_HEIGHT}
      register="cream"
      decor={
        <GhostLetter
          fontSize={1200}
          style={{ right: "-110px", bottom: "-140px" }}
        >
          vs
        </GhostLetter>
      }
    >
      <ShareTop />
      <ShareMid center>
        <Kicker>{competition ? `Aftrap · ${competition}` : "Aftrap"}</Kicker>
        <CrestMatchup
          crests={crests}
          size={300}
          style={{ margin: "56px 0 64px" }}
        />
        <ShareName fontSize={124}>{home}</ShareName>
        {away && (
          <>
            <Dash style={{ margin: "12px 0" }} />
            <ShareName fontSize={124} accent>
              {away}
            </ShareName>
          </>
        )}
        {dateTime && (
          <>
            <Seam width="78%" style={{ margin: "72px 0 48px" }} />
            <Meta>{dateTime}</Meta>
          </>
        )}
      </ShareMid>
      <ShareFoot align="center" />
    </ShareFrame>
  );
}
