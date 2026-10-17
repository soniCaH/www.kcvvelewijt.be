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
  RuleKicker,
  Tape,
  Title,
  type LookProps,
} from "./look-parts";
import { unclash } from "./share-content";

/**
 * B · Plakboek — paper ground, the photo taped on as a print. Donker is
 * dark-green paper with cream text and a warm accent (#3509).
 */
export function PlakboekLook({
  content,
  format,
  theme,
  coverMode,
  fallbackIndex,
}: LookProps) {
  const dark = theme === "donker";
  const sq = format === "square";
  const ground = dark ? TOKENS.jerseyDeepDark : TOKENS.cream;
  const text = dark ? TOKENS.cream : TOKENS.ink;
  const soft = dark ? "rgba(245,241,230,0.86)" : TOKENS.inkSoft;
  const accent = accentOf(theme);
  const chip = unclash(content, ground);

  const label = (
    <span
      style={{
        display: "inline-block",
        background: chip.fill,
        color: chip.onFill,
        border:
          chip.fill === TOKENS.cream ? `4px solid ${TOKENS.ink}` : undefined,
        transform: "rotate(-1deg)",
        boxShadow: `6px 6px 0 ${TOKENS.ink}`,
        padding: sq ? "10px 22px" : "14px 30px",
        fontFamily: MONO_FONT,
        fontWeight: 700,
        fontSize: sq ? 26 : 34,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      {content.label}
    </span>
  );

  // `h` "100%" = the print takes the room the story's text leaves.
  const print = (w: number, h: number | "100%", rotate: number) => (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        background: "#ffffff",
        padding: 22,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 18px 40px rgba(10,10,10,0.25)",
        flexShrink: 0,
      }}
    >
      <Tape color={TOKENS.warm} rotate={-8} style={{ top: -26, left: 40 }} />
      <Tape
        color={TOKENS.creamDeep}
        rotate={6}
        style={{ top: -26, right: 40 }}
      />
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <LookPhoto
          look="plakboek"
          content={content}
          coverMode={coverMode}
          fallbackIndex={fallbackIndex}
        />
      </div>
    </div>
  );

  if (sq)
    return (
      <Canvas format={format} bg={ground}>
        <Grain />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            gap: 48,
            padding: "72px 64px",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {print(500, 640, -2.5)}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div style={{ alignSelf: "flex-start" }}>{label}</div>
            {content.detail !== "none" && (
              <div style={{ alignSelf: "flex-start" }}>
                <Detail content={content} color={accent} size={0.55} />
              </div>
            )}
            <Title
              runs={content.title}
              size={66}
              color={text}
              accent={accent}
            />
            <Info lines={content.info} color={soft} size={24} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 12,
              }}
            >
              <Crest size={64} />
              <Cta color={accent} size={20} />
            </div>
          </div>
        </div>
      </Canvas>
    );

  return (
    <Canvas format={format} bg={ground}>
      <Grain />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "72px 72px 80px",
          gap: 40,
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {label}
          <Crest size={104} />
        </div>
        <Title runs={content.title} size={112} color={text} accent={accent} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 24,
            flex: 1,
            minHeight: 0,
            paddingBottom: 24,
          }}
        >
          {print(880, "100%", -2)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <Info lines={content.info} color={soft} size={32} />
            {content.detail !== "none" && (
              <Detail content={content} color={accent} size={0.7} />
            )}
          </div>
          <RuleKicker text="Meer op kcvvelewijt.be" color={accent} size={30} />
        </div>
      </div>
    </Canvas>
  );
}
