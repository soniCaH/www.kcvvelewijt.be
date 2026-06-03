import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventDetailCtas } from "@/app/(main)/evenementen/[slug]/EventDetailCtas";
import { EventHero } from "./EventHero";

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
  args: {
    title: "Mosselfeest 2026",
    eventType: "Clubevent",
    dateStart: "2026-09-12T16:00:00Z",
    location: "Kantine KCVV",
  },
} satisfies Meta<typeof EventHero>;

export default meta;
type Story = StoryObj<typeof meta>;

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

const ctas = (externalUrl?: string) => (
  <EventDetailCtas
    eventSlug="mosselfeest"
    eventTitle="Mosselfeest 2026"
    dateStart="2026-09-12T16:00:00Z"
    location="Kantine KCVV"
    canonicalUrl="https://kcvvelewijt.be/evenementen/mosselfeest"
    externalUrl={externalUrl}
  />
);

/** Full hero: cover + both CTAs (external Reserveer + Zet in agenda). */
export const Default: Story = {
  args: {
    cover: coverPlaceholder,
    ctas: ctas("https://tickets.example.com"),
  },
};

/** No cover (the common case) — centred text block + both CTAs, no figure. */
export const NoCover: Story = {
  args: { ctas: ctas("https://tickets.example.com") },
};

/** No external link — only the always-present "Zet in agenda" CTA shows. */
export const NoExternalLink: Story = {
  args: { cover: coverPlaceholder, ctas: ctas() },
};

/** Minimal: no cover, no external link — text + the agenda CTA only. */
export const NoCoverNoExternalLink: Story = {
  args: { ctas: ctas() },
};

/** Multi-day event — the kicker shows a weekday-stamped day range. */
export const MultiDay: Story = {
  args: {
    title: "Jeugdkamp",
    eventType: "Jeugdwerking",
    location: "Sportpark Driesput, Elewijt",
    dateStart: "2026-09-14T08:00:00Z",
    dateEnd: "2026-09-15T14:00:00Z",
    ctas: (
      <EventDetailCtas
        eventSlug="jeugdkamp"
        eventTitle="Jeugdkamp"
        dateStart="2026-09-14T08:00:00Z"
        dateEnd="2026-09-15T14:00:00Z"
        location="Sportpark Driesput, Elewijt"
        canonicalUrl="https://kcvvelewijt.be/evenementen/jeugdkamp"
      />
    ),
  },
};

/** All-day event (Brussels midnight) — the kicker drops the time. */
export const AllDay: Story = {
  args: {
    title: "Opendeurdag",
    eventType: "Supportersactiviteit",
    // 2026-09-11T22:00Z === 2026-09-12T00:00 Brussels (CEST).
    dateStart: "2026-09-11T22:00:00Z",
    ctas: (
      <EventDetailCtas
        eventSlug="opendeurdag"
        eventTitle="Opendeurdag"
        dateStart="2026-09-11T22:00:00Z"
        location="Kantine KCVV"
        canonicalUrl="https://kcvvelewijt.be/evenementen/opendeurdag"
      />
    ),
  },
};
