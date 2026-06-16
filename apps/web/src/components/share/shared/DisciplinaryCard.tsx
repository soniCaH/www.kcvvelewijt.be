import { CAPTURE_HEIGHT, CAPTURE_WIDTH, TOKENS } from "../constants";
import { ShareFrame, ShareFoot, ShareMid, ShareTop } from "./ShareFrame";
import {
  CardGraphic,
  GhostLetter,
  Headline,
  Kicker,
  Meta,
  ShareName,
} from "./ShareElements";
import { opponentName } from "./theme";

export type CardKind = "yellow" | "red";
export type CardSide = "kcvv" | "opponent";

export interface DisciplinaryCardProps {
  matchName: string;
  minute: string;
  /** KCVV side only. */
  playerName?: string;
  shirtNumber?: number;
}

/**
 * Shared disciplinary-card layout (#6–#9 in `sh4`): a blown-up card graphic,
 * a giant ghost G/R letter, register A. Brick accent for our cards, jersey
 * accent for the opponent's. Yellow → warm graphic, red → brick graphic.
 */
export function DisciplinaryCard({
  kind,
  side,
  matchName,
  minute,
  playerName,
  shirtNumber,
}: DisciplinaryCardProps & { kind: CardKind; side: CardSide }) {
  const isKcvv = side === "kcvv";
  const cardColor = kind === "yellow" ? TOKENS.warm : TOKENS.brick;
  const letter = kind === "yellow" ? "G" : "R";
  const label = kind === "yellow" ? "Gele kaart" : "Rode kaart";
  const kicker = `${label} · ${isKcvv ? "KCVV" : "tegenstander"}`;
  const opponent = opponentName(matchName);
  const footLeft = isKcvv ? matchName : undefined;

  return (
    <ShareFrame
      width={CAPTURE_WIDTH}
      height={CAPTURE_HEIGHT}
      register="cream"
      sentiment={isKcvv ? "negative" : "positive"}
      decor={
        <GhostLetter
          fontSize={1528}
          style={{ left: "-100px", bottom: "-320px" }}
        >
          {letter}
        </GhostLetter>
      }
    >
      <ShareTop />
      <ShareMid center style={{ justifyContent: "space-evenly" }}>
        <Kicker>{kicker}</Kicker>
        <CardGraphic
          color={cardColor}
          rotate={isKcvv ? 6 : -6}
          width={470}
          height={668}
        />
        {!isKcvv && kind === "red" ? (
          <div>
            <Headline punctuation="bang" fontSize={163}>
              Rood
            </Headline>
            <Meta style={{ marginTop: "28px" }}>
              {opponent} · {minute}&apos;
            </Meta>
          </div>
        ) : (
          <div>
            <ShareName fontSize={108} accent={!isKcvv}>
              {isKcvv ? playerName : opponent}
            </ShareName>
            <Meta style={{ marginTop: "24px" }}>
              {isKcvv && shirtNumber != null
                ? `Nr. ${shirtNumber} · ${minute}'`
                : `${minute}'`}
            </Meta>
          </div>
        )}
      </ShareMid>
      <ShareFoot left={footLeft} align="center" />
    </ShareFrame>
  );
}
