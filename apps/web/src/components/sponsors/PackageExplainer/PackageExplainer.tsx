import { PageContainer } from "@/components/design-system";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StripedSeam } from "@/components/design-system/StripedSeam";
import { TapedCard } from "@/components/design-system/TapedCard";
import type { TapedCardBg } from "@/components/design-system/TapedCard/TapedCard";
import { TapedCardGrid } from "@/components/design-system/TapedCardGrid";
import { TrackInView } from "@/components/analytics";
import { CheckCircle } from "@/lib/icons.redesign";
import { ALaCarteList, PackageContact } from "./PackageExplainerTail";

// Club policy, not CMS content (#3618 slice d): every brochure package plus
// matchbal and onderleggers, retyped from the brochure, with no price, no
// audience figure and no tier name (Kevin, 2026-11-24). Nothing here is
// invented beyond the checklist lines, which split the bundle texts.

interface Bundle {
  name: string;
  items: string[];
  /** Small mono tag on the fullest bundle. */
  badge?: string;
  /** The card surface, and the colours that sit on it. Text on Groen is full
   *  cream (The Whole-Cream Rule). */
  bg: TapedCardBg;
  surface: string;
  text: string;
  icon: string;
  striped: boolean;
}

const BUNDLES: Bundle[] = [
  {
    name: "Groen",
    items: [
      "TV Tool op de 3 grote schermen",
      "Uitgaanstraining",
      "Sponsordoek op het B-veld",
    ],
    bg: "jersey-deep",
    surface: "",
    text: "text-cream",
    icon: "text-warm",
    striped: false,
  },
  {
    name: "Wit",
    items: [
      "TV Tool op de 3 grote schermen",
      "Uitgaanstraining",
      "Sponsordoek op het A-veld",
    ],
    bg: "cream",
    // The one white surface in the system (DESIGN.md, No-Grey-UI Rule).
    surface: "bg-white",
    text: "text-ink",
    icon: "text-jersey-deep",
    striped: false,
  },
  {
    name: "Crossing",
    items: [
      "TV Tool op de 3 grote schermen",
      "Uitgaanstraining",
      "Sponsordoek op beide velden",
      "Onderleggers op de festijnen",
    ],
    badge: "Meest compleet",
    bg: "cream-soft",
    surface: "",
    text: "text-ink",
    icon: "text-jersey-deep",
    striped: true,
  },
];

const OP_MAAT_TEXT =
  "Een VIP-lunch, een tombolaprijs op een festijn, goodies voor het jeugdkamp, een Sinterklaasgeschenk voor elke jeugdspeler, een themaavond.";

const BundleCard = ({
  name,
  items,
  badge,
  bg,
  surface,
  text,
  icon,
  striped,
}: Bundle) => (
  <TapedCard bg={bg} shadow="md" padding="none" className={`h-full ${surface}`}>
    {/* Laid over the card's top padding, so it takes no height and the three
        titles line up. */}
    {striped && (
      <div className="absolute inset-x-0 top-0">
        <StripedSeam colorPair="cream-jersey-deep" height="lg" />
      </div>
    )}
    <div className="flex flex-col gap-4 p-8">
      {/* Fixed height: the badge on Crossing is taller than the label alone,
          and the three titles must line up. */}
      <div className="flex h-6 items-center justify-between gap-3">
        <span className={`text-label font-mono uppercase ${text}`}>Pakket</span>
        {badge && (
          <span className="bg-ink text-cream text-label px-2 py-1 font-mono uppercase">
            {badge}
          </span>
        )}
      </div>
      <h3 className={`font-display-big text-display-lg font-black ${text}`}>
        {name}
      </h3>
      {/* `role="list"`: Safari drops the list role under preflight (#3188). */}
      <ul role="list" className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={`text-body-sm flex items-start gap-2 ${text}`}
          >
            <CheckCircle
              size={18}
              className={`mt-0.5 shrink-0 ${icon}`}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </TapedCard>
);

/** The made-to-measure box: a dashed ink outline, built together, not fixed. */
const OpMaatBox = () => (
  <div className="border-ink mt-8 flex flex-col gap-4 border-2 border-dashed p-8">
    <span className="text-ink text-label font-mono uppercase">
      Samen gebouwd
    </span>
    <h3 className="font-display-big text-ink text-display-lg font-black">
      Op maat
    </h3>
    <p className="text-ink text-body-sm max-w-[var(--container-prose)]">
      {OP_MAAT_TEXT}
    </p>
  </div>
);

export interface PackageExplainerProps {
  /** Name of the contact person. Shown only when passed; the page passes none
   *  (a name needs board approval, #3618). */
  contactName?: string;
}

/**
 * <PackageExplainer> — the package block on `/sponsors` (#3654). It reads as a
 * choice: three fixed bundles, an "Op maat" box, or loose packages. No price,
 * no tier names and no tier-to-placement promise: the brochure names no tiers
 * (#2594).
 *
 * `sponsor_packages_view` fires once the heading, intro and the three bundle
 * cards are 40% in view. Only that top part is observed: the whole block is
 * taller than a phone screen, so 40% of it could never be on screen at once.
 * A click on the address is `sponsor_contact_click` (see `<PackageContact>`).
 */
export const PackageExplainer = ({ contactName }: PackageExplainerProps) => (
  <PageContainer
    as="section"
    width="index"
    ariaLabel="Drie pakketten of een pakket op maat"
    className="py-10 sm:py-14"
  >
    <TrackInView eventName="sponsor_packages_view" threshold={0.4}>
      <SectionHeader
        title="Drie pakketten. Of één op maat."
        emphasis={{ text: "Of één op maat" }}
      />
      <p className="text-ink text-body-md max-w-[var(--container-prose)]">
        Kies een vast pakket, of laat ons samen iets bouwen dat bij je zaak
        past.
      </p>
      <div className="mt-8">
        {/* Two columns at `sm`: the last card (Crossing) spans both, so it
            never sits alone on a second row; three across from `lg`. */}
        <TapedCardGrid
          columns={3}
          gap="lg"
          as="ul"
          className="sm:[&>li:last-child]:col-span-2 lg:[&>li:last-child]:col-span-1"
        >
          {BUNDLES.map((bundle) => (
            <BundleCard key={bundle.name} {...bundle} />
          ))}
        </TapedCardGrid>
      </div>
    </TrackInView>

    <OpMaatBox />
    <ALaCarteList />
    <PackageContact contactName={contactName} />
  </PageContainer>
);
