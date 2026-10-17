import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LOOKS } from "./looks";
import {
  H,
  W,
  type LookId,
  type ShareFormat,
  type ShareTheme,
} from "./look-parts";
import { buildMatchContent, type TemplateId } from "./share-content";

// Every match moment in one look, side by side, so the owner can tune the
// moment table (label, fill, detail — `MOMENT_STYLE` in share-content.ts) by
// eye (#3536). Not VR-tagged: a tuning surface, not a baseline.

const SCALE = 0.2;

const MOMENTS: TemplateId[] = [
  "kickoff",
  "halftime",
  "goal-kcvv",
  "goal-opponent",
  "full-time",
  "yellow-card-kcvv",
  "yellow-card-opponent",
  "red-card-kcvv",
  "red-card-opponent",
  "square-pre-game",
  "square-result",
];

function MomentTable({
  look,
  format,
  theme,
  mood,
}: {
  look: LookId;
  format: ShareFormat;
  theme: ShareTheme;
  mood: "win" | "draw" | "loss";
}) {
  const Look = LOOKS.find((l) => l.id === look)!.Component;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 16 }}>
      {MOMENTS.map((template) => (
        <div
          key={template}
          style={{
            width: W * SCALE,
            height: H[format] * SCALE,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              transform: `scale(${SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <Look
              content={buildMatchContent({
                template,
                matchName: "KCVV Elewijt — FC Opponent",
                score: "2 - 1",
                minute: "67",
                mood,
                competition: "3de Provinciale B",
                dateTime: "Zaterdag · 20:00",
                awayLogo: "/images/logo-flat.png",
                squad: "A",
                playerName: "Jan Peeters",
              })}
              format={format}
              theme={theme}
              wash="normaal"
              coverMode="foto"
              blocks={{}}
              fallbackIndex={0}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Features/Share/Match moments",
  component: MomentTable,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { look: "kaart", format: "story", theme: "licht", mood: "win" },
  argTypes: {
    look: { control: "inline-radio", options: LOOKS.map((l) => l.id) },
    format: { control: "inline-radio", options: ["story", "square"] },
    theme: { control: "inline-radio", options: ["licht", "donker"] },
    mood: { control: "inline-radio", options: ["win", "draw", "loss"] },
  },
} satisfies Meta<typeof MomentTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kaart: Story = {};
export const Plakboek: Story = { args: { look: "plakboek" } };
export const Affiche: Story = { args: { look: "affiche" } };
export const Ticket: Story = { args: { look: "ticket" } };
export const SquareDonker: Story = {
  args: { format: "square", theme: "donker" },
};
export const Verloren: Story = { args: { mood: "loss" } };
