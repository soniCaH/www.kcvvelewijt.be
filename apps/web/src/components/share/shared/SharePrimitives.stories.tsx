import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "../constants";
import {
  ShareFrame,
  ShareTop,
  ShareMid,
  ShareFoot,
  type ShareFrameProps,
} from "./ShareFrame";
import {
  Headline,
  Kicker,
  Meta as MetaLine,
  NumDisc,
  Scoreline,
  Seam,
  ShareName,
} from "./ShareElements";

/**
 * The shared building blocks behind every /share template, shown in each of the
 * three voice registers (cream sheet · jersey-deep poster · fullscreen image).
 */
const meta = {
  title: "Features/Share/_Primitives",
  component: ShareFrame,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ShareFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

const base: Pick<ShareFrameProps, "width" | "height"> = {
  width: CAPTURE_WIDTH,
  height: CAPTURE_HEIGHT,
};

export const RegisterACream: Story = {
  args: {
    ...base,
    register: "cream",
    children: (
      <>
        <ShareTop />
        <ShareMid center>
          <Kicker>Aftrap · 2e Provinciale</Kicker>
          <ShareName fontSize={130} style={{ marginTop: "32px" }}>
            KCVV Elewijt
          </ShareName>
          <MetaLine style={{ margin: "24px 0" }}>tegen</MetaLine>
          <ShareName fontSize={130} accent>
            Eppegem
          </ShareName>
          <Seam width="78%" style={{ margin: "48px 0 32px" }} />
          <MetaLine>Zaterdag · 20:00 · Terrein A</MetaLine>
        </ShareMid>
        <ShareFoot />
      </>
    ),
  },
};

export const RegisterBDark: Story = {
  args: {
    ...base,
    register: "dark",
    children: (
      <>
        <ShareTop />
        <ShareMid center>
          <Kicker>Eindstand</Kicker>
          <Scoreline fontSize={460} style={{ marginTop: "16px" }}>
            3 - 1
          </Scoreline>
          <Headline
            punctuation="bang"
            fontSize={200}
            style={{ marginTop: "40px" }}
          >
            Gewonnen
          </Headline>
          <MetaLine style={{ marginTop: "56px" }}>
            KCVV Elewijt — Eppegem
          </MetaLine>
          <MetaLine style={{ marginTop: "16px" }}>2e Provinciale</MetaLine>
        </ShareMid>
        <ShareFoot />
      </>
    ),
  },
};

export const ImageRegister: Story = {
  args: {
    ...base,
    register: "image",
    overlay: "shout",
    imageUrl:
      "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
    children: (
      <>
        <ShareTop />
        <ShareMid>
          <Kicker>Doelpunt · 67&apos;</Kicker>
          <Headline
            punctuation="bang"
            fontSize={320}
            style={{ marginTop: "8px" }}
          >
            Goal
          </Headline>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              gap: "40px",
            }}
          >
            <NumDisc>9</NumDisc>
            <div>
              <ShareName fontSize={108}>Mertens</ShareName>
              <MetaLine style={{ marginTop: "12px" }}>Stand 1–0</MetaLine>
            </div>
          </div>
        </ShareMid>
        <ShareFoot left="KCVV Elewijt — Eppegem" />
      </>
    ),
  },
};
