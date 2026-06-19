/**
 * Pages/* assembly story for `/spelers/[slug]` — a Phase 6.A design reference.
 *
 * Renders the visible composition (PlayerHero → StripedSeam → BioBlock →
 * QuotesBlock) with fixture data. The server-only
 * `<MatchStripSlot>` and `<VerderLezenRow>` related blocks are omitted
 * here because they require runtime BFF / Sanity fetches; functional
 * smoke for the assembled page lives in the Playwright suite
 * (`apps/web/test/e2e/routes.spec.ts` → `/spelers/[slug]`).
 *
 * Per `apps/web/CLAUDE.md`, Pages/* stories are NOT VR-tested. Add or
 * change visual baselines on the per-block stories
 * (`Features/Players/PlayerHero`, `Features/Players/BioBlock`,
 * `Features/Players/QuotesBlock`) instead.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PortableTextBlock } from "@portabletext/react";
import { BioBlock, PlayerHero, QuotesBlock } from "@/components/player";
import { StripedSeam } from "@/components/design-system";

function block(
  key: string,
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${key}`,
    style: "normal",
    children: spans.map((span, i) => ({
      _type: "span",
      _key: `${key}-${i}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
    markDefs: [],
  } as unknown as PortableTextBlock;
}

const BIO_TWO_MARKS: PortableTextBlock[] = [
  block(
    "p1",
    {
      text: "Maxim groeide op in Elewijt en kreeg de liefde voor het spel met de paplepel mee. ",
    },
    {
      text: "Vanaf zijn zesde stond hij elke zaterdag bij de jeugdploegen.",
      marks: ["pullquote"],
    },
    { text: " Op zijn zeventiende debuteerde hij in de eerste ploeg." },
  ),
  block(
    "p2",
    { text: "Op het veld is hij " },
    {
      text: "een meedogenloze tackler die elk duel wint en de opbouw vanuit het midden draagt.",
      marks: ["pullquote"],
    },
    { text: " Een combinatie die hem onmisbaar maakt in het middenveld." },
  ),
];

function PlayerProfileAssembly({
  bio,
  photoUrl,
  birthDate,
}: {
  bio: PortableTextBlock[];
  photoUrl?: string;
  birthDate?: string;
}) {
  return (
    <>
      <section className="mx-auto w-full max-w-[var(--container-wide)] px-4 py-12 lg:px-8 lg:py-16">
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
          photoUrl={photoUrl}
          birthDate={birthDate}
          jerseyNumber={8}
          teamLabel="A-Ploeg"
          season="26/27"
        />
      </section>
      <StripedSeam colorPair="ink-cream" height="md" />
      <BioBlock bio={bio} playerName="Maxim Breugelmans" />
      <QuotesBlock bio={bio} playerName="Maxim Breugelmans" />
    </>
  );
}

const meta = {
  title: "Pages/Players/PlayerProfile",
  component: PlayerProfileAssembly,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase 6.A `/spelers/[slug]` composition. See the per-block stories under `Features/Players/*` for VR-tested visuals; this story exists as a design reference only.",
      },
    },
  },
} satisfies Meta<typeof PlayerProfileAssembly>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A-team player with a 2-pullquote bio, photo, and full meta. */
export const AdultWithPhotoAndBio: Story = {
  args: {
    bio: BIO_TWO_MARKS,
    photoUrl: "/images/players/placeholder-adult.png",
    birthDate: "2000-02-24",
  },
};

/** Minor player without photo or bio — hero illustration fallback. */
export const MinorWithoutPhotoOrBio: Story = {
  args: {
    bio: [],
    photoUrl: undefined,
    birthDate: "2014-09-12",
  },
};
