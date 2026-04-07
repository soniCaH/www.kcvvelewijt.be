/**
 * PlayerCard Redesign — Visual Prototype
 *
 * Diagonal-cut card design that embraces non-transparent player photos
 * (squad shots, headshots in jerseys) rather than expecting alpha cutouts.
 *
 * The story renders a Players grid + Staff grid using the same card
 * component. Staff cards differ only in the badge content ("T1" function
 * title instead of jersey number) and a navy badge color instead of green.
 *
 * Picsum portrait photos act as realistic stand-ins for "photos with
 * backgrounds" so the design can be evaluated against worst-case content.
 *
 * Includes the green-hover top-accent bar from the existing PlayerCard
 * (scaleX animation from 50% to 100% width on hover).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";

/* ---------------------------------------------------------------------------
 * Shared person data type — players and staff use the same card components
 * --------------------------------------------------------------------------- */

type PersonKind = "player" | "staff";

interface PersonData {
  id: string;
  firstName: string;
  lastName: string;
  /** Jersey number for players, function title (T1/TK/...) for staff */
  badge: string;
  /** Position for players, role for staff */
  subtitle: string;
  photo: string;
  kind: PersonKind;
}

/* ---------------------------------------------------------------------------
 * Mock data — players + staff
 * --------------------------------------------------------------------------- */

const mockPlayers: PersonData[] = [
  {
    id: "p1",
    badge: "1",
    firstName: "Kevin",
    lastName: "Van Ransbeeck",
    subtitle: "Keeper",
    photo: "https://picsum.photos/seed/kcvv-p1/400/520",
    kind: "player",
  },
  {
    id: "p2",
    badge: "4",
    firstName: "Thomas",
    lastName: "Maes",
    subtitle: "Verdediger",
    photo: "https://picsum.photos/seed/kcvv-p2/400/520",
    kind: "player",
  },
  {
    id: "p3",
    badge: "2",
    firstName: "Jan",
    lastName: "Peeters",
    subtitle: "Verdediger",
    photo: "https://picsum.photos/seed/kcvv-p3/400/520",
    kind: "player",
  },
  {
    id: "p4",
    badge: "5",
    firstName: "Pieter",
    lastName: "Janssens",
    subtitle: "Verdediger",
    photo: "https://picsum.photos/seed/kcvv-p4/400/520",
    kind: "player",
  },
  {
    id: "p5",
    badge: "8",
    firstName: "Stijn",
    lastName: "Claes",
    subtitle: "Middenvelder",
    photo: "https://picsum.photos/seed/kcvv-p5/400/520",
    kind: "player",
  },
  {
    id: "p6",
    badge: "10",
    firstName: "Raf",
    lastName: "Wouters",
    subtitle: "Middenvelder",
    photo: "https://picsum.photos/seed/kcvv-p6/400/520",
    kind: "player",
  },
  {
    id: "p7",
    badge: "9",
    firstName: "Bert",
    lastName: "Goossens",
    subtitle: "Aanvaller",
    photo: "https://picsum.photos/seed/kcvv-p7/400/520",
    kind: "player",
  },
  {
    id: "p8",
    badge: "11",
    firstName: "Lars",
    lastName: "Mertens",
    subtitle: "Aanvaller",
    photo: "https://picsum.photos/seed/kcvv-p8/400/520",
    kind: "player",
  },
];

const mockStaff: PersonData[] = [
  {
    id: "s1",
    badge: "T1",
    firstName: "Marc",
    lastName: "Van den Berg",
    subtitle: "Hoofdtrainer",
    photo: "https://picsum.photos/seed/kcvv-s1/400/520",
    kind: "staff",
  },
  {
    id: "s2",
    badge: "T2",
    firstName: "Dirk",
    lastName: "Hermans",
    subtitle: "Assistent-trainer",
    photo: "https://picsum.photos/seed/kcvv-s2/400/520",
    kind: "staff",
  },
  {
    id: "s3",
    badge: "TK",
    firstName: "Peter",
    lastName: "Jacobs",
    subtitle: "Keeperstrainer",
    photo: "https://picsum.photos/seed/kcvv-s3/400/520",
    kind: "staff",
  },
  {
    id: "s4",
    badge: "TVJO",
    firstName: "Johan",
    lastName: "De Vries",
    subtitle: "TV Jeugdopleiding",
    photo: "https://picsum.photos/seed/kcvv-s4/400/520",
    kind: "staff",
  },
];

/** Color tokens per person kind */
function badgeColors(kind: PersonKind) {
  return kind === "player"
    ? {
        bg: "bg-kcvv-green-bright",
        text: "text-kcvv-black",
        accent: "text-kcvv-green-bright",
        accentDark: "text-kcvv-green-dark",
      }
    : {
        bg: "bg-kcvv-gray-blue",
        text: "text-white",
        accent: "text-white/70",
        accentDark: "text-kcvv-gray-blue",
      };
}

/* ---------------------------------------------------------------------------
 * Diagonal Cut card (most on-brand)
 * --------------------------------------------------------------------------- */

/**
 * Photo with a CSS clip-path diagonal cut — no SVG, no sub-pixel seam.
 * The image is clipped to a quadrilateral; the parent card's white bg fills
 * the cut-away area, so the diagonal flows seamlessly into the white name
 * section below. A stencil badge sits on the diagonal seam.
 */
function PersonCardDiagonal({ person }: { person: PersonData }) {
  const fullName = `${person.firstName} ${person.lastName}`;
  const c = badgeColors(person.kind);
  const seamColor =
    person.kind === "player" ? "text-kcvv-green-bright" : "text-kcvv-gray-blue";
  return (
    <a
      href="#"
      className="group relative flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-hover"
      title={fullName}
    >
      {/* Green hover top accent bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] origin-center scale-x-0 bg-kcvv-green-bright transition-transform duration-300 ease-out group-hover:scale-x-100" />

      {/* Photo wrapper - aspect ratio. The image is clipped via clip-path,
          and the parent <a>'s white bg fills the cut-away area. No SVG,
          no seam. */}
      <div className="relative shrink-0" style={{ aspectRatio: "4 / 5" }}>
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 86%, 0 100%)" }}
        >
          <Image
            src={person.photo}
            alt={fullName}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
          />
        </div>

        {/* Stencil badge on the diagonal seam — overflows into the name area */}
        <div
          className={`pointer-events-none absolute right-3 z-10 select-none font-black leading-none ${seamColor}`}
          style={{
            bottom: "-1rem",
            fontFamily: "stenciletta, sans-serif",
            fontSize: person.badge.length > 2 ? "3rem" : "5.5rem",
            WebkitTextStroke: "2px white",
          }}
          aria-hidden="true"
        >
          {person.badge}
        </div>
      </div>

      {/* Name section */}
      <div className="flex-1 px-4 pb-5 pt-3">
        <div
          className={`text-[0.625rem] font-bold uppercase tracking-[0.15em] ${c.accentDark}`}
        >
          {person.subtitle}
        </div>
        <h3 className="mt-1 font-title text-lg uppercase leading-tight text-kcvv-black">
          <span className="font-semibold">{person.firstName}</span>
          <br />
          <span className="font-thin">{person.lastName}</span>
        </h3>
      </div>
    </a>
  );
}

/* ---------------------------------------------------------------------------
 * Shared layout — section header + grid
 * --------------------------------------------------------------------------- */

interface SectionProps {
  Card: React.FC<{ person: PersonData }>;
  title: string;
  people: PersonData[];
  variant?: "dark" | "light";
}

function Section({ Card, title, people, variant = "dark" }: SectionProps) {
  const isDark = variant === "dark";
  return (
    <div className="mx-auto max-w-inner-lg px-4 md:px-10">
      <h2
        className={`mb-8 border-l-4 border-kcvv-green-bright pl-4 font-body text-2xl font-black uppercase tracking-tight ${
          isDark ? "text-white" : "text-kcvv-black"
        }`}
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {people.map((p) => (
          <Card key={p.id} person={p} />
        ))}
      </div>
    </div>
  );
}

interface PageProps {
  Card: React.FC<{ person: PersonData }>;
  variant: "dark" | "light";
}

function Page({ Card, variant }: PageProps) {
  const bg = variant === "dark" ? "bg-kcvv-black" : "bg-gray-100";
  return (
    <div className={`${bg} space-y-16 py-16`}>
      <Section
        Card={Card}
        title="Spelers"
        people={mockPlayers}
        variant={variant}
      />
      <Section
        Card={Card}
        title="Technische Staf"
        people={mockStaff}
        variant={variant}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Meta
 * --------------------------------------------------------------------------- */

const meta = {
  title: "Pages/PlayerCard Redesign",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------------------
 * Story — renders both light and dark contexts
 * --------------------------------------------------------------------------- */

/**
 * Approach B — Diagonal cut. Photo on top, diagonal white wedge at the
 * bottom matching the page diagonal language. Stencil badge on the seam.
 */
export const ApproachB_DiagonalCut: Story = {
  render: () => (
    <>
      <Page Card={PersonCardDiagonal} variant="light" />
      <Page Card={PersonCardDiagonal} variant="dark" />
    </>
  ),
};
