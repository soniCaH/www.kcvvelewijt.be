import { MONO_FONT, TOKENS } from "../constants";
import {
  accentOf,
  Canvas,
  Crest,
  Cta,
  Detail,
  Grain,
  Info,
  LookPhoto,
  Title,
  washGradient,
  washRgb,
  type LookProps,
} from "./look-parts";

/**
 * C · Affiche — full-bleed photo, a wash over it, seam + footer band. The
 * only look with a wash (Zacht / Normaal / Sterk, #3522); the kicker sits on
 * a solid plate. Square anchors its picture to the top.
 */
export function AfficheLook({
  content,
  format,
  theme,
  wash,
  coverMode,
  fallbackIndex,
}: LookProps) {
  const dark = theme === "donker";
  const sq = format === "square";
  const footH = sq ? 88 : 120;
  const text = dark ? TOKENS.cream : TOKENS.ink;
  const showDetail = content.detail !== "none" && content.detail !== "quote";

  return (
    <Canvas format={format} bg={TOKENS.jerseyDeepDark}>
      <div style={{ position: "absolute", inset: 0, bottom: footH }}>
        <LookPhoto
          look="affiche"
          content={content}
          coverMode={coverMode}
          fallbackIndex={fallbackIndex}
          position={sq ? "top" : "center"}
          filter="sepia(0.25) saturate(0.9) contrast(1.05)"
        />
      </div>
      <Grain />
      <div
        style={{
          position: "absolute",
          inset: 0,
          bottom: footH,
          background: washGradient(theme, wash),
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: sq ? 48 : 64,
          left: sq ? 56 : 72,
          zIndex: 2,
        }}
      >
        <Crest size={sq ? 84 : 112} />
      </div>
      {showDetail && (
        <div
          style={{
            position: "absolute",
            top: sq ? 56 : 72,
            right: sq ? 56 : 72,
            zIndex: 2,
            background: `rgba(${washRgb(theme)},0.88)`,
            padding: sq ? "10px 16px" : "16px 24px",
          }}
        >
          <Detail content={content} color={text} size={sq ? 0.6 : 0.85} />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: sq ? 56 : 72,
          right: sq ? 56 : 72,
          bottom: footH + (sq ? 56 : 88),
          display: "flex",
          flexDirection: "column",
          gap: sq ? 22 : 34,
          zIndex: 2,
        }}
      >
        {content.detail === "quote" && (
          <Detail
            content={content}
            color={accentOf(theme)}
            size={sq ? 0.6 : 1}
          />
        )}
        <span
          style={{
            alignSelf: "flex-start",
            background: content.fill,
            color: content.onFill,
            border:
              content.fill === TOKENS.cream
                ? `4px solid ${TOKENS.ink}`
                : "none",
            padding: sq ? "10px 20px" : "14px 28px",
            fontFamily: MONO_FONT,
            fontWeight: 700,
            fontSize: sq ? 26 : 34,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {content.label}
        </span>
        <Title
          runs={content.title}
          size={sq ? 84 : 124}
          color={text}
          accent={accentOf(theme)}
        />
        <Info
          lines={content.info}
          color={dark ? "rgba(245,241,230,0.88)" : TOKENS.inkSoft}
          size={sq ? 26 : 34}
        />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: footH,
          height: sq ? 20 : 28,
          backgroundImage: `repeating-linear-gradient(-45deg, ${TOKENS.cream} 0 16px, ${TOKENS.jerseyDeep} 16px 32px)`,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: footH,
          background: TOKENS.jerseyDeep,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: sq ? "0 56px" : "0 72px",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: MONO_FONT,
            fontWeight: 700,
            fontSize: sq ? 22 : 28,
            letterSpacing: "0.16em",
            color: TOKENS.cream,
          }}
        >
          KCVV ELEWIJT
        </span>
        <Cta color={TOKENS.cream} size={sq ? 22 : 28} />
      </div>
    </Canvas>
  );
}
