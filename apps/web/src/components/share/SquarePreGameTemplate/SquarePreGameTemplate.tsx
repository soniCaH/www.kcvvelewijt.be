import { SQUARE_SIZE } from "../constants";
import {
  ShareFrame,
  ShareFoot,
  ShareMid,
  ShareTop,
} from "../shared/ShareFrame";
import {
  CrestMatchup,
  Dash,
  Kicker,
  Meta,
  ShareName,
} from "../shared/ShareElements";
import { resolveCrests, splitMatchName } from "../shared/theme";

export interface SquarePreGameTemplateProps {
  matchName: string;
  competition?: string;
  /** Kickoff line, e.g. "Zaterdag · 20:00". */
  dateTime?: string;
  /** Club crest URLs (KCVV's side falls back to the local crest). */
  homeLogo?: string;
  awayLogo?: string;
  /** Optional fullscreen newsprint photo. */
  imageUrl?: string;
}

/**
 * Pre-game template — 1:1 (1080×1080) Instagram feed post. Club-crest matchup
 * over a cream sheet, or a fullscreen newsprint photo when an image is given.
 */
export function SquarePreGameTemplate({
  matchName,
  competition,
  dateTime,
  homeLogo,
  awayLogo,
  imageUrl,
}: SquarePreGameTemplateProps) {
  const { home, away } = splitMatchName(matchName);
  const hasImage = Boolean(imageUrl);
  const crests = resolveCrests(matchName, homeLogo, awayLogo);

  return (
    <ShareFrame
      width={SQUARE_SIZE}
      height={SQUARE_SIZE}
      register={hasImage ? "image" : "cream"}
      imageUrl={imageUrl}
      overlay="calm"
    >
      <ShareTop />
      <ShareMid center>
        <Kicker>{competition ? `Vandaag · ${competition}` : "Vandaag"}</Kicker>
        {!hasImage && (
          <CrestMatchup
            crests={crests}
            size={180}
            style={{ margin: "36px 0 32px" }}
          />
        )}
        <ShareName
          fontSize={116}
          style={hasImage ? { marginTop: "32px" } : undefined}
        >
          {home}
        </ShareName>
        {away && (
          <>
            <Dash fontSize={70} style={{ margin: "6px 0" }} />
            <ShareName fontSize={116} accent>
              {away}
            </ShareName>
          </>
        )}
        {!hasImage && dateTime && (
          <Meta style={{ marginTop: "36px" }}>{dateTime}</Meta>
        )}
      </ShareMid>
      <ShareFoot left={hasImage ? dateTime : undefined} align="center" />
    </ShareFrame>
  );
}
