/**
 * Club Geschiedenis Redesign — Visual Prototype
 *
 * Brings /club/geschiedenis into the site design language while keeping
 * the production vertical timeline:
 *
 * - PageHero with the team photo and a diagonal transition into content
 * - Vertical timeline (alternating left/right cards on a green center line)
 *   restyled with the design-system tokens (rounded-sm, green left-border
 *   accent, kcvv-black title)
 * - Milestones strip removed
 * - Closing CTA on dark background
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { SectionHeader } from "@/components/design-system/SectionHeader/SectionHeader";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";

/* ---------------------------------------------------------------------------
 * Restyled vertical timeline primitives — same structure as the production
 * HistoryContent but with design-system tokens (rounded-sm, green left
 * accent bar, kcvv-black headings).
 * --------------------------------------------------------------------------- */

function TimelineLine() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-1 -translate-x-0.5 bg-kcvv-green-bright/40 md:block"
      aria-hidden="true"
    />
  );
}

function TimelineDot() {
  return (
    <div className="absolute left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full bg-kcvv-green-bright shadow-[0_0_0_4px_rgba(243,244,246,1)] md:block" />
  );
}

function TimelineCard({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border-l-4 border-kcvv-green-bright bg-white p-6 shadow-sm">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-kcvv-green-dark">
        {date}
      </div>
      <div className="text-sm leading-relaxed text-kcvv-black">{children}</div>
    </div>
  );
}

interface TimelineRowProps {
  date: string;
  side: "left" | "right";
  children: React.ReactNode;
}

/**
 * Timeline row with an alternating left/right card. The opposite side
 * keeps a hidden-but-block placeholder so flex justify-between positions
 * the visible card on the correct side. The class order matters here:
 * `hidden md:block md:invisible` = hidden on mobile, then on md+ becomes
 * a block element that takes layout space but is visually hidden.
 */
function TimelineRow({ date, side, children }: TimelineRowProps) {
  return (
    <div className="relative mb-10 md:flex md:items-start md:justify-between">
      <div
        className={`w-full md:w-[45%] ${
          side === "right" ? "hidden md:block md:invisible" : ""
        }`}
      >
        {side === "left" && <TimelineCard date={date}>{children}</TimelineCard>}
      </div>
      <TimelineDot />
      <div
        className={`mt-6 w-full md:mt-0 md:w-[45%] ${
          side === "left" ? "hidden md:block md:invisible" : ""
        }`}
      >
        {side === "right" && (
          <TimelineCard date={date}>{children}</TimelineCard>
        )}
      </div>
    </div>
  );
}

/** Full-width image with caption between timeline sections — no card
 * background, image sits directly on the section bg so there's no nested
 * "card on card" look when the image's aspect ratio doesn't match the
 * container.
 */
function TimelineImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="my-12">
      <div className="relative mx-auto w-full max-w-3xl">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          sizes="(min-width: 1024px) 768px, 100vw"
          className="h-auto w-full"
        />
      </div>
      <figcaption className="mt-3 text-center text-sm italic text-kcvv-gray">
        {caption}
      </figcaption>
    </figure>
  );
}

interface MockTimelineEntry {
  date: string;
  side: "left" | "right";
  body: string;
}

const TIMELINE_ENTRIES: MockTimelineEntry[] = [
  {
    date: "1909 — 1935",
    side: "left",
    body: "De Elewijtse voetbalgeschiedenis gaat terug tot 1909-1910. Onder de naam 'De Jonge Footbalclub' speelden de jongens in witte truien met rode band — de eerste stappen van wat later KCVV Elewijt zou worden.",
  },
  {
    date: "Eerste wereldoorlog",
    side: "right",
    body: "Na de oorlog werd FC Leopold Elewijt opgericht in geel-rood. Het terrein verhuisde meermaals tot het zich uiteindelijk bij de Voetbalstraat vestigde.",
  },
  {
    date: "1935",
    side: "left",
    body: "Onenigheid leidde tot de oprichting van twee clubs: SK Elewijt (groen-wit, stamnummer 2415) en FC Elewijt (rood-geel, stamnummer 2416).",
  },
  {
    date: "1971 — 1983",
    side: "right",
    body: "In 1971 fuseerden SK en FC tot VV Elewijt. De fusieclub haalde in 1973-1974 de titel en promoveerde naar tweede provinciale.",
  },
  {
    date: "1983 — 1991",
    side: "left",
    body: "Stamnummer 55 van Crossing Schaarbeek werd overgenomen, waardoor de club Crossing Elewijt aantrad in eerste provinciale. In 1988 won Crossing de Beker van Brabant.",
  },
  {
    date: "1991 — 2018",
    side: "right",
    body: "Crossing Elewijt en VV Elewijt fuseerden tot KCVV Elewijt. Na enkele degradaties speelde de club lange tijd in vierde provinciale, met geleidelijke groei.",
  },
  {
    date: "2018 — 2021",
    side: "left",
    body: "KCVV Elewijt werd kampioen in 2018-2019 met 79 punten en promoveerde naar tweede provinciale A.",
  },
  {
    date: "2021 — 2024",
    side: "right",
    body: "Promotie via eindronde naar eerste provinciale en gestage groei tot vaste waarde in de hoogste provinciale reeks.",
  },
  {
    date: "2024 — 2025",
    side: "left",
    body: "Titel in eerste provinciale met 58 punten en 8 punten voorsprong op OHR Huldenberg. Voor het eerst sinds Crossing Schaarbeek mag stamnummer 55 aantreden op nationaal niveau.",
  },
  {
    date: "2025 — ...",
    side: "right",
    body: "De ploeg wordt ingedeeld in derde afdeling VV reeks B. Voor het eerst in de moderne clubgeschiedenis speelt KCVV Elewijt op het nationale toneel.",
  },
];

function VerticalTimeline() {
  // Timeline entries grouped into "chapters" with an image between each chapter
  const chapters: {
    entries: MockTimelineEntry[];
    image?: { src: string; alt: string; caption: string };
  }[] = [
    {
      entries: TIMELINE_ENTRIES.slice(0, 3),
      image: {
        src: "/images/history/history-52-53.png",
        alt: "SK Elewijt kampioen 52-53",
        caption: "SK Elewijt kampioen 52-53",
      },
    },
    {
      entries: TIMELINE_ENTRIES.slice(3, 5),
      image: {
        src: "/images/history/history-fusie.png",
        alt: "VV Elewijt fusie",
        caption: "De fusieclub VV Elewijt — sinds 1971-1972 in competitie",
      },
    },
    {
      entries: TIMELINE_ENTRIES.slice(5, 8),
      image: {
        src: "/images/history/history-2018.jpeg",
        alt: "Kampioen 2018-2019",
        caption:
          "KCVV Elewijt speelt kampioen in 2018-2019 met 79 punten op 90",
      },
    },
    {
      entries: TIMELINE_ENTRIES.slice(8),
      image: {
        src: "/images/history/history-24-25.jpg",
        alt: "Kampioen 2024-2025",
        caption:
          "KCVV Elewijt kampioen 2024-2025 — promotie naar nationaal voetbal",
      },
    },
  ];

  return (
    <div>
      {chapters.map((chapter, i) => (
        <div key={i}>
          <div className="relative py-4">
            <TimelineLine />
            {chapter.entries.map((entry) => (
              <TimelineRow key={entry.date} date={entry.date} side={entry.side}>
                <p>{entry.body}</p>
              </TimelineRow>
            ))}
          </div>
          {chapter.image && (
            <TimelineImage
              src={chapter.image.src}
              alt={chapter.image.alt}
              caption={chapter.image.caption}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Meta + story
 * --------------------------------------------------------------------------- */

const meta = {
  title: "Pages/Club Geschiedenis Redesign",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Redesigned: Story = {
  render: () => {
    const sections: SectionConfig[] = [
      {
        key: "hero",
        bg: "kcvv-black",
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        content: (
          <PageHero
            image="/images/history/history-24-25.jpg"
            imageAlt="KCVV Elewijt door de jaren heen"
            label="Onze club"
            headline={
              <>
                Onze <span className="text-kcvv-green">geschiedenis</span>
              </>
            }
            body="Van 1909 tot vandaag — meer dan een eeuw voetbalpassie in Elewijt."
          />
        ),
        transition: { type: "diagonal", direction: "right", overlap: "full" },
      },
      {
        key: "timeline",
        bg: "gray-100",
        content: (
          <div className="mx-auto max-w-5xl px-4 md:px-10">
            <SectionHeader title="Tijdlijn" />
            <VerticalTimeline />
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      {
        key: "cta",
        bg: "kcvv-black",
        paddingTop: "pt-16",
        paddingBottom: "pb-16",
        content: (
          <SectionCta
            variant="dark"
            heading="Maak deel uit van ons verhaal"
            body="Kom langs op een wedstrijd of word lid van de plezantste compagnie."
            buttonLabel="Word lid"
            buttonHref="/hulp"
          />
        ),
      },
    ];

    return <SectionStack sections={sections} />;
  },
};
