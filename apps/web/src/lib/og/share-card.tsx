/**
 * Shared Open Graph share card — the retro-terrace fanzine on a 1200×630 sheet.
 *
 * Every dynamic OG route (`/spelers`, `/ploegen`, `/staf`) renders this one
 * card, so a link shared to Facebook or WhatsApp arrives in the same visual
 * world as the site it points at.
 *
 * Anatomy: cream sheet, a rotated jersey-deep stamp carrying the subject's
 * identifier (shirt number, else the club crest), the name in two weights, a
 * mono meta line, and a full-bleed striped seam along the bottom edge.
 *
 * Satori constraints worth knowing before editing:
 * - No CSS custom properties — colours are concrete literals mirroring the
 *   `@theme` block in `globals.css` (same reason `share/constants.ts` does it).
 * - Fonts must be supplied as buffers. Freight is a Typekit face and cannot be
 *   self-hosted, so the card speaks in IBM Plex Mono — the one face in the
 *   approved set that is OFL-licensed and therefore embeddable. See DESIGN.md
 *   "Typography".
 * - `woff2` is not supported; these are `woff`.
 */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { TOKENS as SHARE_TOKENS } from "@/components/share/constants";

/**
 * Satori cannot read CSS custom properties, so the card needs concrete values.
 * Borrows the /share palette rather than re-declaring it — same constraint, same
 * literals, one fewer mirror to keep in step with `globals.css`. Only
 * `onJerseyDeep` is specific to this card.
 */
const TOKENS = {
  ...SHARE_TOKENS,
  /**
   * Pure white on a jersey-deep fill, inherited from the pre-#2395 green — see
   * DESIGN.md "Chips / Labels", which carries the open reconcile-to-cream
   * question.
   */
  onJerseyDeep: "#ffffff",
} as const;

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const SHEET_PADDING_X = 88;
const STAMP_SIZE = 200;
const STAMP_GUTTER = 64;
/** Horizontal room the name column actually gets. */
const NAME_COLUMN =
  OG_SIZE.width - SHEET_PADDING_X * 2 - STAMP_SIZE - STAMP_GUTTER;

/**
 * IBM Plex Mono advances every glyph at exactly 0.6em, so the largest size that
 * fits a name is arithmetic rather than a guess — which is what keeps
 * "Vanden Bossche" and "Jan" on the same card without a measurement pass.
 */
export function fitNameSize(lines: readonly string[]): number {
  const longest = Math.max(...lines.map((line) => line.length), 1);
  return Math.max(28, Math.min(64, Math.floor(NAME_COLUMN / (longest * 0.6))));
}

/** The stamp is a fixed square; long identifiers step down to stay inside it. */
function fitStampSize(value: string): number {
  if (value.length <= 2) return 104;
  if (value.length === 3) return 76;
  return 56;
}

function readPublicAsset(relativePath: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "public", relativePath));
}

/**
 * Read once per lambda instance. The card is regenerated rarely (OG images are
 * cached at the edge), but re-reading three files per request is pure waste.
 */
const assetsCache: { promise?: Promise<OgAssets> } = {};

interface OgAssets {
  fonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[];
  crest: string;
}

function loadAssets(): Promise<OgAssets> {
  assetsCache.promise ??= Promise.all([
    readPublicAsset("fonts/ibm-plex-mono-400.woff"),
    readPublicAsset("fonts/ibm-plex-mono-700.woff"),
    readPublicAsset("images/logos/kcvv-logo.png"),
  ]).then(([regular, bold, crest]) => ({
    fonts: [
      {
        name: "IBM Plex Mono",
        data: regular,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "IBM Plex Mono",
        data: bold,
        weight: 700 as const,
        style: "normal" as const,
      },
    ],
    crest: `data:image/png;base64,${crest.toString("base64")}`,
  }));
  return assetsCache.promise;
}

export interface ShareCardProps {
  /**
   * Identifier printed in the stamp — a shirt number. Omitted subjects (teams,
   * staff, players without a number) get the club crest instead, so the stamp
   * is never empty and never invents a token the data doesn't have.
   */
  stampText?: string;
  /** First line of the name, set at regular weight. */
  nameTop: string;
  /** Second line, set bold — the one that has to survive a feed thumbnail. */
  nameBottom: string;
  /** Optional mono line beneath: position, division, role. */
  meta?: string;
}

/**
 * Render a share card to a PNG response.
 *
 * @param props - The subject's stamp, two name lines, and an optional meta line
 * @returns A 1200×630 `image/png` {@link ImageResponse}
 */
export async function renderShareCard(
  props: ShareCardProps,
): Promise<ImageResponse> {
  const { stampText, nameTop, nameBottom, meta } = props;
  const { fonts, crest } = await loadAssets();
  const nameSize = fitNameSize([nameTop, nameBottom]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: TOKENS.cream,
        fontFamily: "IBM Plex Mono",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: `0 ${SHEET_PADDING_X}px`,
        }}
      >
        {/* Stamp badge — sharp corners, ink border, hard offset shadow, ~2° */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: STAMP_SIZE,
            height: STAMP_SIZE,
            marginRight: STAMP_GUTTER,
            backgroundColor: TOKENS.jerseyDeep,
            border: `3px solid ${TOKENS.ink}`,
            boxShadow: `10px 10px 0 0 ${TOKENS.ink}`,
            transform: "rotate(-2deg)",
          }}
        >
          {stampText ? (
            <div
              style={{
                color: TOKENS.onJerseyDeep,
                fontSize: fitStampSize(stampText),
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {stampText}
            </div>
          ) : (
            // Satori renders raw elements; next/image has no meaning here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={crest} width={150} height={150} alt="" />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              color: TOKENS.ink,
              fontSize: nameSize,
              fontWeight: 400,
              lineHeight: 1.08,
              textTransform: "uppercase",
            }}
          >
            {nameTop}
          </div>
          <div
            style={{
              color: TOKENS.ink,
              fontSize: nameSize,
              fontWeight: 700,
              lineHeight: 1.08,
              textTransform: "uppercase",
            }}
          >
            {nameBottom}
          </div>
          {meta ? (
            <div
              style={{
                marginTop: 26,
                color: TOKENS.inkMuted,
                fontSize: 24,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {meta}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 92,
          padding: `0 ${SHEET_PADDING_X}px`,
          borderTop: `3px solid ${TOKENS.ink}`,
          color: TOKENS.ink,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.14em",
        }}
      >
        KCVV ELEWIJT
      </div>

      {/* Striped seam — the section rule from DESIGN.md, full-bleed */}
      <div
        style={{
          height: 26,
          width: "100%",
          backgroundImage: `repeating-linear-gradient(45deg, ${TOKENS.ink} 0px, ${TOKENS.ink} 14px, ${TOKENS.cream} 14px, ${TOKENS.cream} 28px)`,
        }}
      />
    </div>,
    { ...OG_SIZE, fonts },
  );
}
