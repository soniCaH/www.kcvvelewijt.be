// PROTOTYPE (#3656 / #3913) — throwaway sponsor logo looks. Never merge to main.
import { SanityImage } from "@/lib/image/sanity-image";
import { SponsorTile } from "@/components/sponsors/SponsorTile";
import type { Sponsor } from "@/components/sponsors/Sponsors";

const IMG = (n: string) =>
  `https://cdn.sanity.io/images/vhb33jaz/staging/${n}-1500x750.png?w=400&q=80&fm=webp&fit=max`;

// No staging Sponsor names a Team yet, so real Sponsors stand in.
export const STUB_TEAM_SPONSORS: Sponsor[] = [
  {
    id: "FpgS21bgw2I3VNplbIG4ZY",
    name: "Bakelants Technics",
    url: "https://www.facebook.com/BakelantsTechnics/",
    logo: IMG("adc3f79f50879347d6d251268af4081733a80e61"),
  },
  {
    id: "FpgS21bgw2I3VNplbIG4dm",
    name: "Bar-a-Vis",
    url: "https://www.facebook.com/p/Bar-a-vis-100090407893884/",
    logo: IMG("a560819bcdf8b5c522dc76a13abd5b5edabdab26"),
  },
  {
    id: "FpgS21bgw2I3VNplbIG4i0",
    name: "CNC",
    url: "https://www.cncmetal.be/en",
    logo: IMG("b27bef2b34d44c41f76437a9a533df266e6e3634"),
  },
];

// #3913 has no data yet: one stand-in matchday sponsor.
export const STUB_MATCHDAY_SPONSOR: Sponsor = {
  id: "sponsor-drupal-2035469d-386f-4566-89c0-f1bf6e4aa208",
  name: "Alupoort",
  url: "https://www.alupoort.be",
  logo: IMG("8851b7089995ac3772f0090601e265fdcbe1e704"),
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-ink-muted text-label font-mono font-semibold uppercase">
    {children}
  </p>
);

const Logo = ({ s, h = 40 }: { s: Sponsor; h?: number }) => (
  <a href={s.url} target="_blank" rel="noopener noreferrer" className="block">
    <SanityImage
      src={s.logo}
      alt={s.name}
      width={200}
      height={100}
      style={{ maxHeight: h }}
      className="h-auto w-auto max-w-[240px] object-contain"
      sizes="240px"
    />
  </a>
);

/** Team look A: a label and a bare row of colour logos, no frames. */
export const LogoRow = ({
  sponsors,
  label = "Gesteund door",
  stacked = false,
}: {
  sponsors: Sponsor[];
  label?: string;
  /** Label always on its own row (narrow columns). */
  stacked?: boolean;
}) => (
  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
    <div className={stacked ? "basis-full" : "basis-full sm:basis-auto"}>
      <Label>{label}</Label>
    </div>
    {sponsors.map((s) => (
      <Logo key={s.id} s={s} />
    ))}
  </div>
);

/** Team look B: the /sponsors framed tiles, in colour, three across. */
export const LogoTiles = ({ sponsors }: { sponsors: Sponsor[] }) => (
  <div>
    <Label>Gesteund door</Label>
    <div className="mt-3 grid grid-cols-3 gap-3">
      {sponsors.map((s) => (
        <SponsorTile key={s.id} sponsor={s} framed colorAtRest />
      ))}
    </div>
  </div>
);

/** Team look C: one paper card with a green tab, logos inside. */
export const LogoCard = ({
  sponsors,
  tab = "Gesteund door",
}: {
  sponsors: Sponsor[];
  tab?: string;
}) => (
  <div className="bg-cream-soft border-ink shadow-paper-sm border-2">
    <div className="bg-jersey-deep border-ink border-b-2 px-4 py-2">
      <span className="text-cream text-label font-mono font-semibold uppercase">
        {tab}
      </span>
    </div>
    <div className="flex flex-wrap items-center justify-around gap-6 px-6 py-6">
      {sponsors.map((s) => (
        <Logo key={s.id} s={s} h={96} />
      ))}
    </div>
  </div>
);

/** Matchday look: a full-width strip, "Matchbal aangeboden door" + one big logo. */
export const MatchdayStrip = ({ sponsor }: { sponsor: Sponsor }) => (
  <div className="border-ink flex flex-wrap items-center justify-between gap-4 border-y-2 py-4">
    <div>
      <Label>Matchbal aangeboden door</Label>
      <p className="font-display text-ink mt-1 text-xl italic">
        {sponsor.name}
      </p>
    </div>
    <Logo s={sponsor} h={80} />
  </div>
);
