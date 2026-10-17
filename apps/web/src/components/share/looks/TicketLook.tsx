import { MONO_FONT, TOKENS } from "../constants";
import {
  accentOf,
  Canvas,
  Crest,
  Cta,
  DateBlock,
  Detail,
  Info,
  LookPhoto,
  Title,
  type LookProps,
} from "./look-parts";
import { unclash } from "./share-content";

/**
 * E · Ticket — a ticket on a pitch-dark ground; Donker swaps them, a
 * dark-green ticket on cream (#3509). A dashed tear line, no notches.
 */
export function TicketLook({
  content,
  format,
  theme,
  coverMode,
  fallbackIndex,
}: LookProps) {
  const dark = theme === "donker";
  const sq = format === "square";
  const ground = dark ? TOKENS.cream : TOKENS.jerseyDeepDark;
  const ticket = dark ? TOKENS.jerseyDeepDark : TOKENS.cream;
  const tText = dark ? TOKENS.cream : TOKENS.ink;
  const accent = accentOf(theme);
  const block = unclash(content, ticket);

  return (
    <Canvas format={format} bg={ground}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(90deg, ${dark ? "rgba(10,10,10,0.04)" : "rgba(245,241,230,0.05)"} 0 84px, transparent 84px 168px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: sq ? "40px 72px" : "80px 72px",
          gap: sq ? 24 : 48,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Crest size={sq ? 64 : 96} />
          <span
            style={{
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: sq ? 22 : 30,
              letterSpacing: "0.2em",
              color: dark ? TOKENS.ink : TOKENS.cream,
            }}
          >
            KCVV ELEWIJT
          </span>
        </div>
        <div
          style={{
            width: "100%",
            background: ticket,
            border: `5px solid ${TOKENS.ink}`,
            boxShadow: `14px 14px 0 ${dark ? TOKENS.jerseyDeep : TOKENS.ink}`,
            display: "flex",
            flexDirection: "column",
            transform: "rotate(-1.2deg)",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: sq ? 300 : 700,
              borderBottom: `5px solid ${TOKENS.ink}`,
              position: "relative",
            }}
          >
            <LookPhoto
              look="ticket"
              content={content}
              coverMode={coverMode}
              fallbackIndex={fallbackIndex}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: sq ? 28 : 40,
              padding: sq ? "28px 36px" : "48px 48px 40px",
              alignItems: "flex-start",
            }}
          >
            {content.detail === "dateblock" ? (
              <DateBlock
                content={content}
                color={block.onFill}
                background={block.fill}
                size={sq ? 0.8 : 1.27}
              />
            ) : (
              content.detail !== "none" && (
                <Detail
                  content={content}
                  color={accent}
                  size={sq ? 0.4 : 0.6}
                />
              )
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: sq ? 12 : 20,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontFamily: MONO_FONT,
                  fontWeight: 700,
                  fontSize: sq ? 22 : 30,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: accent,
                }}
              >
                {content.kicker}
              </span>
              <Title
                runs={content.title}
                size={sq ? 54 : 84}
                color={tText}
                accent={accent}
              />
              <Info
                lines={content.info}
                color={dark ? "rgba(245,241,230,0.86)" : TOKENS.inkSoft}
                size={sq ? 20 : 28}
              />
            </div>
          </div>
          <div style={{ height: 0, borderTop: `5px dashed ${tText}` }} />
          <div
            style={{
              padding: sq ? "16px 36px" : "28px 48px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Cta color={tText} size={sq ? 20 : 28} />
          </div>
        </div>
      </div>
    </Canvas>
  );
}
