import { PageContainer } from "@/components/design-system";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StripedSeam } from "@/components/design-system/StripedSeam";
import { TapedCard } from "@/components/design-system/TapedCard";
import { TapedCardGrid } from "@/components/design-system/TapedCardGrid";
import { TrackInView } from "@/components/analytics";
import { CheckCircle } from "@/lib/icons.redesign";

/** The sponsoring address, shown beside the contact role (#2594). */
const SPONSORING_EMAIL = "sponsoring@kcvvelewijt.be";

// Club policy, not CMS content (#3618 slice d): every brochure package plus
// matchbal and onderleggers, retyped from the brochure, with no price, no
// audience figure and no tier name (Kevin, 2026-11-24). Nothing here is
// invented beyond the checklist lines, which split the bundle texts.

type BundleName = "Groen" | "Wit" | "Crossing";

interface Bundle {
  name: BundleName;
  items: string[];
  /** Small mono tag on the fullest bundle. */
  badge?: string;
}

const BUNDLES: Bundle[] = [
  {
    name: "Groen",
    items: [
      "TV Tool op de 3 grote schermen",
      "Uitgaanstraining",
      "Sponsordoek op het B-veld",
    ],
  },
  {
    name: "Wit",
    items: [
      "TV Tool op de 3 grote schermen",
      "Uitgaanstraining",
      "Sponsordoek op het A-veld",
    ],
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
  },
];

/** Surface per bundle, and the colours that sit on it. Text on Groen is white,
 *  never ink. */
const TONE: Record<
  BundleName,
  {
    bg: "jersey-deep" | "cream" | "cream-soft";
    surface: string;
    text: string;
    icon: string;
    striped: boolean;
  }
> = {
  Groen: {
    bg: "jersey-deep",
    surface: "",
    text: "text-white",
    icon: "text-warm",
    striped: false,
  },
  Wit: {
    bg: "cream",
    surface: "bg-white",
    text: "text-ink",
    icon: "text-jersey-deep",
    striped: false,
  },
  Crossing: {
    bg: "cream-soft",
    surface: "",
    text: "text-ink",
    icon: "text-jersey-deep",
    striped: true,
  },
};

interface Loose {
  name: string;
  text: string;
}

const LOOSE_GROUPS: { label: string; items: Loose[] }[] = [
  {
    label: "Op het complex",
    items: [
      {
        name: "TV Tool",
        text: "Je logo of advertentie op de 3 grote schermen boven de toog. De beelden pas je zelf aan, van thuis uit.",
      },
      {
        name: "Sponsordoek",
        text: "Een winddoorlatend full-colour doek van 2 m bij 5 m langs het A-veld, het B-veld of allebei. Zichtbaar bij elke thuismatch en training.",
      },
    ],
  },
  {
    label: "Op de shirts",
    items: [
      {
        name: "Uitgaanstraining",
        text: "Je logo op de trainings- en uitgaanskledij van onze jeugdspelers en hun trainers en afgevaardigden.",
      },
      {
        name: "Wedstrijduitrusting jeugd",
        text: "Je logo op de wedstrijduitrusting van elke jeugdploeg, van U6 tot U17.",
      },
      {
        name: "Wedstrijduitrusting senior",
        text: "De vaste thuis- en uitshirts van het A-elftal, het B-elftal en de U21.",
      },
    ],
  },
  {
    label: "Online",
    items: [
      {
        name: "Sponsored posts",
        text: "12 maandelijkse posts op de Facebook en Instagram van de club.",
      },
    ],
  },
  {
    label: "Eenmalig",
    items: [
      {
        name: "Matchbal",
        text: "Een aankondiging op de site en op de kantineschermen, plus de aftrap.",
      },
      {
        name: "Onderleggers",
        text: "Je logo op de onderleggers in het steakrestaurant, op het mosselfestijn, de VIP-lunches en dergelijke.",
      },
    ],
  },
];

const OP_MAAT_TEXT =
  "Een VIP-lunch, een tombolaprijs op een festijn, goodies voor het jeugdkamp, een Sinterklaasgeschenk voor elke jeugdspeler, een themaavond. Laten we praten.";

const Checklist = ({
  items,
  textClass,
  iconClass,
}: {
  items: string[];
  textClass: string;
  iconClass: string;
}) => (
  <ul className="flex flex-col gap-2">
    {items.map((item) => (
      <li
        key={item}
        className={`text-body-sm flex items-start gap-2 ${textClass}`}
      >
        <CheckCircle
          size={18}
          className={`mt-0.5 shrink-0 ${iconClass}`}
          aria-hidden
        />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const BundleCard = ({ name, items, badge }: Bundle) => {
  const tone = TONE[name];
  return (
    <TapedCard
      bg={tone.bg}
      shadow="md"
      padding="none"
      className={`h-full ${tone.surface}`}
    >
      {tone.striped && (
        <StripedSeam colorPair="cream-jersey-deep" height="lg" />
      )}
      <div className="flex flex-col gap-4 p-8">
        <div className="flex items-center justify-between gap-3">
          <span className={`text-label font-mono uppercase ${tone.text}`}>
            Pakket
          </span>
          {badge && (
            <span className="bg-ink text-cream text-label px-2 py-1 font-mono uppercase">
              {badge}
            </span>
          )}
        </div>
        <h3
          className={`font-display-big text-display-lg font-black ${tone.text}`}
        >
          {name}
        </h3>
        <Checklist items={items} textClass={tone.text} iconClass={tone.icon} />
      </div>
    </TapedCard>
  );
};

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

/** One group of loose packages: the label sits above its rows, and the rows
 *  pack tight in two columns on desktop. */
const LooseGroup = ({ label, items }: { label: string; items: Loose[] }) => (
  <section>
    <h4 className="text-ink-muted border-paper-edge text-label mb-4 border-b pb-1.5 font-mono uppercase">
      {label}
    </h4>
    <dl className="grid gap-x-10 gap-y-5 md:grid-cols-2">
      {items.map(({ name, text }) => (
        <div key={name}>
          <dt className="font-display text-ink text-lg font-bold">{name}</dt>
          <dd className="text-ink text-body-sm mt-1">{text}</dd>
        </div>
      ))}
    </dl>
  </section>
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
 * (#2594). Fires `sponsor_packages_view` once it is 40% in view; a click on the
 * address is `sponsor_contact_click`, counted by `<SponsorsAnalytics>` through
 * the `data-sponsor-contact` marker.
 */
export const PackageExplainer = ({ contactName }: PackageExplainerProps) => {
  return (
    <TrackInView eventName="sponsor_packages_view" threshold={0.4}>
      <PageContainer
        as="section"
        width="index"
        ariaLabel="Drie pakketten of een pakket op maat"
        className="py-10 sm:py-14"
      >
        <SectionHeader
          title="Drie pakketten. Of één op maat."
          emphasis={{ text: "Of één op maat" }}
          className="mb-3 sm:mb-3"
        />
        <p className="font-display text-ink-muted mb-8 max-w-[var(--container-prose)] text-xl italic sm:mb-10">
          Kies een vast pakket, of laat ons samen iets bouwen dat bij je zaak
          past.
        </p>

        <TapedCardGrid columns={3} gap="lg" as="ul">
          {BUNDLES.map((bundle) => (
            <BundleCard key={bundle.name} {...bundle} />
          ))}
        </TapedCardGrid>

        <OpMaatBox />

        <h3 className="text-ink-muted border-paper-edge text-label mt-12 mb-6 border-b pb-1.5 font-mono uppercase">
          Of kies apart
        </h3>
        <div className="flex flex-col gap-8">
          {LOOSE_GROUPS.map((group) => (
            <LooseGroup key={group.label} {...group} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 sm:mt-12">
          <p className="font-display text-ink text-xl italic">
            Benieuwd wat er voor jouw zaak kan? Laten we praten.
          </p>
          <MonoLabel>Verantwoordelijke Sponsoring</MonoLabel>
          {contactName && (
            <p className="text-ink text-lg font-bold">{contactName}</p>
          )}
          <p>
            <a
              href={`mailto:${SPONSORING_EMAIL}`}
              className="prose-link"
              data-sponsor-contact="true"
            >
              {SPONSORING_EMAIL}
            </a>
          </p>
        </div>
      </PageContainer>
    </TrackInView>
  );
};
