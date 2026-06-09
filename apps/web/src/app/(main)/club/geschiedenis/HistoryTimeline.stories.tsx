import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  HeritageHero,
  TimelineImage,
  TimelineItem,
  TimelineSection,
} from "./HistoryTimeline";

/**
 * VR coverage for the reskinned `/club/geschiedenis` chronicle (Phase 7,
 * design contract panel T1). Components are pure/presentational; the page-view
 * event lives in `<HistoryContent>` and is out of scope for these stories.
 */
const meta = {
  title: "Pages/Geschiedenis/Timeline",
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-[200px] py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Deterministic photo stand-in — no external image so VR baselines stay
// stable (mirrors the `<TapedFigure>` story convention).
const photoPlaceholder = (
  <div
    className="bg-ink flex h-full w-full items-center justify-center"
    style={{
      backgroundImage: "var(--pattern-jersey-stripes-tight)",
      backgroundBlendMode: "soft-light",
    }}
    aria-label="Archieffoto"
  >
    <span className="text-cream/60 font-mono text-[11px] tracking-[0.08em] uppercase">
      Archiefbeeld
    </span>
  </div>
);

export const Hero: Story = {
  render: () => <HeritageHero />,
};

export const ItemLeft: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl px-4 md:px-10">
      <TimelineSection>
        <TimelineItem date="1909 - 1935" side="left">
          <p>
            De Elewijtse voetbalgeschiedenis gaat volgens de overleveringen
            terug tot de jaren 1909-1910. De jongens speelden in witte truien
            met een rode band over de schouder — &quot;Wit en Rood&quot; met
            zwarte broek.
          </p>
        </TimelineItem>
      </TimelineSection>
    </div>
  ),
};

export const ItemRight: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl px-4 md:px-10">
      <TimelineSection>
        <TimelineItem date="Eerste wereldoorlog" side="right">
          <p>
            Na de oorlog van &apos;14-&apos;18 werd er opnieuw een club
            opgericht die de naam meekreeg van FC Leopold Elewijt — nu met de
            kleuren &quot;Geel en Rood&quot;.
          </p>
        </TimelineItem>
      </TimelineSection>
    </div>
  ),
};

export const ItemPair: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl px-4 md:px-10">
      <TimelineSection>
        <TimelineItem date="1991 - 2018" side="left">
          <p>
            Vanaf 1991-1992 werd besloten om beide Elewijtse ploegen te fuseren
            tot KCVV Elewijt; de ploeg ging verder in tweede provinciale.
          </p>
        </TimelineItem>
        <TimelineItem date="2018 - 2021" side="right">
          <p>
            In het seizoen 2018/2019 werd KCVV Elewijt kampioen met maar liefst
            79 punten, na een nek-aan-nek race tot de allerlaatste speeldag.
          </p>
        </TimelineItem>
      </TimelineSection>
    </div>
  ),
};

export const Photo: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl px-4 md:px-10">
      <TimelineImage
        caption={
          <>
            <span className="font-semibold not-italic">
              Figuur 8: KCVV Elewijt kampioen 2024-2025
            </span>
            <br />
            Titel in eerste provinciale met 58 punten — 8 punten voorsprong op
            eerste achtervolger OHR Huldenberg.
          </>
        }
      >
        {photoPlaceholder}
      </TimelineImage>
    </div>
  ),
};
