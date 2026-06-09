import { TapedCard } from "@/components/design-system/TapedCard";
import { NumberDisplay } from "@/components/design-system/NumberDisplay";

/**
 * Highlighted callout for the Ultras' "Schijt je rijk" raffle (2018-2019):
 * all 500 tickets sold, €750 cheque for the winner. A `jersey-deep`
 * `<TapedCard>` with two `<NumberDisplay>` stats — replaces the inline
 * `<strong>` emphasis in the legacy prose.
 */
export function RaffleCallout() {
  return (
    <TapedCard
      bg="jersey-deep"
      shadow="soft"
      rotation="b"
      tape={{ color: "warm", length: "md", position: "left", rotation: "a" }}
      padding="lg"
      dataAttrs={{ "data-testid": "raffle-callout" }}
    >
      <p className="text-cream/80 mb-5 text-center font-mono text-[length:var(--text-label)] tracking-[0.08em] uppercase">
        Schijt je rijk · seizoen 2018-2019
      </p>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
        <NumberDisplay
          as="div"
          value={500}
          tone="cream"
          size="display-xl"
          label="lotjes — allemaal verkocht"
          className="items-center text-center"
        />
        <span
          aria-hidden="true"
          className="bg-cream/20 hidden h-12 w-px sm:block"
        />
        <NumberDisplay
          as="div"
          value={750}
          prefix="€"
          tone="cream"
          size="display-xl"
          label="cheque voor de winnaar"
          className="items-center text-center"
        />
      </div>
    </TapedCard>
  );
}
