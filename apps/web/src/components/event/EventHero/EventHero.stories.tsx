import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventDetailCtas } from "@/app/(main)/evenementen/[slug]/EventDetailCtas";
import { EventHero, type EventHeroProps } from "./EventHero";

// `cover` and `ctas` are `ReactNode` slots — not serialisable. Per the Storybook
// authoring rule (apps/web/CLAUDE.md §"Story authoring rules"), override them
// with serialisable flags and build the JSX in a named render helper.
type StoryArgs = Omit<EventHeroProps, "cover" | "ctas"> & {
  /** Render the tilted+taped cover figure (placeholder image). */
  withCover?: boolean;
  /** Also render the external "Reserveer ↗" CTA (the agenda CTA is always present). */
  hasExternalLink?: boolean;
};

// Deterministic stand-in for an editorial cover photograph — no network image,
// so VR baselines stay stable (mirrors the <TapedFigure> story placeholder).
const coverPlaceholder = (
  <div
    className="bg-ink flex h-full w-full items-center justify-center"
    style={{
      backgroundImage: "var(--pattern-jersey-stripes-tight)",
      backgroundBlendMode: "soft-light",
    }}
    aria-label="Sample event cover"
  >
    <span className="text-cream/60 font-mono text-[11px] tracking-[0.08em] uppercase">
      Coverbeeld
    </span>
  </div>
);

const renderEventHero = ({
  withCover,
  hasExternalLink,
  ...heroArgs
}: StoryArgs) => {
  const slug =
    heroArgs.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "") || "evenement";
  return (
    <EventHero
      {...heroArgs}
      cover={withCover ? coverPlaceholder : undefined}
      ctas={
        <EventDetailCtas
          eventSlug={slug}
          eventTitle={heroArgs.title}
          dateStart={heroArgs.dateStart}
          dateEnd={heroArgs.dateEnd}
          location={heroArgs.location}
          canonicalUrl={`https://kcvvelewijt.be/evenementen/${slug}`}
          externalUrl={
            hasExternalLink ? "https://tickets.example.com" : undefined
          }
        />
      }
    />
  );
};

const meta = {
  title: "Features/Calendar/EventHero",
  component: EventHero,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream py-12">
        <Story />
      </div>
    ),
  ],
  render: renderEventHero,
  args: {
    title: "Mosselfeest 2026",
    eventType: "Clubevent",
    dateStart: "2026-09-12T16:00:00Z",
    location: "Kantine KCVV",
  },
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full hero: cover + both CTAs (external Reserveer + Zet in agenda). */
export const Default: Story = {
  args: { withCover: true, hasExternalLink: true },
};

/** No cover (the common case) — centred text block + both CTAs, no figure. */
export const NoCover: Story = {
  args: { hasExternalLink: true },
};

/** No external link — only the always-present "Zet in agenda" CTA shows. */
export const NoExternalLink: Story = {
  args: { withCover: true },
};

/** Minimal: no cover, no external link — text + the agenda CTA only. */
export const NoCoverNoExternalLink: Story = {};

/** Multi-day event — the kicker shows a weekday-stamped day range. */
export const MultiDay: Story = {
  args: {
    title: "Jeugdkamp",
    eventType: "Jeugdwerking",
    location: "Sportpark Driesput, Elewijt",
    dateStart: "2026-09-14T08:00:00Z",
    dateEnd: "2026-09-15T14:00:00Z",
  },
};

/** All-day event (Brussels midnight) — the kicker drops the time. */
export const AllDay: Story = {
  args: {
    title: "Opendeurdag",
    eventType: "Supportersactiviteit",
    // 2026-09-11T22:00Z === 2026-09-12T00:00 Brussels (CEST).
    dateStart: "2026-09-11T22:00:00Z",
  },
};
