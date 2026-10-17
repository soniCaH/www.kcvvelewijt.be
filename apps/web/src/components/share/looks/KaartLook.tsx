import type { CSSProperties } from "react";
import { MONO_FONT, TOKENS } from "../constants";
import {
  accentOf,
  Canvas,
  Crest,
  Cta,
  Detail,
  Grain,
  Hero,
  Info,
  LookPhoto,
  Stamp,
  Title,
  type LookProps,
} from "./look-parts";
import { unclash } from "./share-content";

/**
 * A · Kaart — photo up top, a card laid over its bottom edge. Donker is a
 * dark-green card on the cream ground (#3509); the corner brackets stay ink.
 */
export function KaartLook({
  content,
  format,
  theme,
  coverMode,
  fallbackIndex,
}: LookProps) {
  const dark = theme === "donker";
  const sq = format === "square";
  const surface = dark ? TOKENS.jerseyDeepDark : "#ffffff";
  const text = dark ? TOKENS.cream : TOKENS.ink;
  const soft = dark ? "rgba(245,241,230,0.86)" : TOKENS.inkSoft;
  const accent = accentOf(theme);
  const stamp = unclash(content, surface);
  const bracket = (pos: "tl" | "br"): CSSProperties => ({
    position: "absolute",
    width: 44,
    height: 44,
    border: `5px solid ${TOKENS.ink}`,
    ...(pos === "tl"
      ? { top: -18, left: -18, borderRight: 0, borderBottom: 0 }
      : { bottom: -18, right: -18, borderLeft: 0, borderTop: 0 }),
  });
  const gap = sq ? 24 : 36;

  return (
    <Canvas format={format} bg={TOKENS.cream}>
      <Grain />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}
      >
        <div
          style={{ flex: 1, minHeight: sq ? 380 : 900, position: "relative" }}
        >
          <LookPhoto
            look="kaart"
            content={content}
            coverMode={coverMode}
            fallbackIndex={fallbackIndex}
          />
          <div style={{ position: "absolute", top: 56, left: 64 }}>
            <Crest size={sq ? 84 : 104} squad={content.squad} />
          </div>
        </div>
        <div
          style={{
            position: "relative",
            margin: sq ? "-170px 72px 0" : "-220px 72px 0",
            background: surface,
            border: `5px solid ${TOKENS.ink}`,
            boxShadow: `16px 16px 0 ${TOKENS.ink}`,
            padding: sq ? "64px 56px 48px" : "88px 64px 64px",
            display: "flex",
            flexDirection: "column",
            gap,
          }}
        >
          <span style={bracket("tl")} />
          <span style={bracket("br")} />
          <div style={{ position: "absolute", top: -30, right: 56 }}>
            <Stamp
              label={content.label}
              fill={stamp.fill}
              onFill={stamp.onFill}
              size={sq ? 28 : 34}
            />
          </div>
          {content.hero && (
            <Hero content={content} color={text} size={sq ? 0.55 : 0.8} />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {content.detail !== "none" && (
              <div style={{ alignSelf: "flex-start" }}>
                <Detail
                  content={content}
                  color={accent}
                  size={sq ? 0.5 : 0.8}
                />
              </div>
            )}
            <Title
              runs={content.title}
              size={sq ? 76 : 100}
              color={text}
              accent={accent}
            />
            <Info lines={content.info} color={soft} size={sq ? 26 : 32} />
          </div>
        </div>
        <div
          style={{
            padding: sq ? "40px 72px 36px" : "64px 72px 64px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "0.16em",
              color: TOKENS.inkMuted,
            }}
          >
            KCVV ELEWIJT
          </span>
          <Cta color={TOKENS.ink} size={sq ? 24 : 30} />
        </div>
      </div>
    </Canvas>
  );
}
