import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LOOKS } from "./looks";
import { H, W, type LookId, type LookProps } from "./look-parts";
import {
  buildArticleContent,
  buildEventContent,
  fieldsOf,
} from "./share-content";
import type { ShareItem } from "./share-content";

// Fits the whole 1080-wide canvas inside the narrowest VR viewport (375 px),
// so a baseline shows the story, not its top-left corner.
const SCALE = 0.33;

/** A news or event story in one of the four new looks (#3540). */
function LookStory({ look, ...props }: LookProps & { look: LookId }) {
  const Look = LOOKS.find((l) => l.id === look)!.Component;
  return (
    <div
      style={{
        width: W * SCALE,
        height: H[props.format] * SCALE,
        overflow: "hidden",
      }}
    >
      <div
        style={{ transform: `scale(${SCALE})`, transformOrigin: "top left" }}
      >
        <Look {...props} />
      </div>
    </div>
  );
}

// VR rule (#3535): a flat, same-origin colour block — never a photo or a
// fallback webp (photo decode flakes) and never a blur (GPU-dependent).
// Base64 so the `<img>` sink's `encodeURI` leaves it untouched.
const FLAT = `data:image/svg+xml;base64,${btoa(
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='16' height='16' fill='#7a8f80'/></svg>",
)}`;

const INTERVIEW: ShareItem = {
  kind: "article",
  slug: "interview",
  type: "interview",
  title: "Jan Peeters over zijn eerste seizoen",
  spans: [
    { text: "Jan Peeters over zijn ", accent: false },
    { text: "eerste seizoen", accent: true },
  ],
  date: "vrijdag 17 oktober",
  time: "",
  location: "",
  day: "17",
  month: "okt",
  cover: null,
};

const QUIZ: ShareItem = {
  kind: "event",
  slug: "quiz",
  type: "Supportersactiviteit",
  title: "Grote supportersquiz",
  spans: [],
  date: "zaterdag 25 oktober",
  time: "20:00",
  location: "Kantine Driesstraat",
  day: "25",
  month: "okt",
  cover: null,
};

const flat = (item: ShareItem) => {
  const build =
    item.kind === "article" ? buildArticleContent : buildEventContent;
  return {
    ...build(item, fieldsOf(item)),
    photo: { src: FLAT, source: "own" as const, focal: { x: 0.5, y: 0.5 } },
  };
};

const meta = {
  title: "Features/Share/Looks",
  component: LookStory,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    look: "kaart",
    content: flat(INTERVIEW),
    format: "story",
    theme: "licht",
    wash: "normaal",
    coverMode: "foto",
    blocks: {},
    fallbackIndex: 0,
  },
} satisfies Meta<typeof LookStory>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── The six VR baselines (#3535 Testing Decisions) ─────────────────────────
export const KaartStoryLicht: Story = { tags: ["vr"] };
export const PlakboekStoryLicht: Story = {
  tags: ["vr"],
  args: { look: "plakboek" },
};
export const AfficheStoryLicht: Story = {
  tags: ["vr"],
  args: { look: "affiche", content: flat(QUIZ) },
};
export const AfficheStoryDonker: Story = {
  tags: ["vr"],
  args: { look: "affiche", content: flat(QUIZ), theme: "donker" },
};
export const AfficheSquare: Story = {
  tags: ["vr"],
  args: { look: "affiche", format: "square" },
};
export const TicketStoryLicht: Story = {
  tags: ["vr"],
  args: { look: "ticket", content: flat(QUIZ) },
};

// ── Not screenshotted: for tuning by eye ───────────────────────────────────
/** Whole flyer taped over its own blur — CSS blur is GPU-dependent, so no VR. */
export const AfficheWazig: Story = {
  args: {
    look: "plakboek",
    coverMode: "affiche_wazig",
    content: buildArticleContent(
      {
        ...INTERVIEW,
        cover: {
          url: "/images/event-fallback.jpg",
          hotspot: { x: 0.5, y: 0.5 },
        },
      },
      fieldsOf(INTERVIEW),
    ),
  },
};
export const KaartDonker: Story = { args: { theme: "donker" } };
export const PlakboekSquare: Story = {
  args: { look: "plakboek", format: "square" },
};
export const TicketDonker: Story = {
  args: { look: "ticket", content: flat(QUIZ), theme: "donker" },
};
