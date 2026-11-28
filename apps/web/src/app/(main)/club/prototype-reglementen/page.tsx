/** PROTOTYPE — throwaway. Do not ship. See #3911. */

import type { Metadata } from "next";
import { PageContainer, StripedSeam } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { PrototypeSwitcher } from "@/components/prototype/PrototypeSwitcher";
import { VariantAPrototype } from "./__prototype__/VariantAPrototype";
import { VariantBPrototype } from "./__prototype__/VariantBPrototype";
import { VariantCPrototype } from "./__prototype__/VariantCPrototype";

export const metadata: Metadata = {
  title: "Reglementen en beleid (prototype)",
  robots: { index: false, follow: false },
};

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = { A: "Plain Page", B: "Document cards", C: "Index + list" };

const pick = <T extends string>(
  value: string | string[] | undefined,
  options: readonly T[],
): T => options.find((o) => o === value) ?? options[0];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PrototypeReglementenPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const variant = pick(params.variant, VARIANTS);
  const code = pick(params.code, ["on", "off"] as const);
  const closing = pick(params.closing, ["line", "cta"] as const);
  const props = { showCode: code === "on", closing };

  return (
    <div className="bg-cream min-h-screen">
      {/* Same opening as club/[slug]/page.tsx, so only the body differs. */}
      <PageContainer className="pb-12">
        <PageHero
          headline="Reglementen en beleid"
          upLink={{ href: "/club", label: "De club" }}
        />
      </PageContainer>
      <StripedSeam colorPair="ink-cream" height="md" />

      {variant === "A" ? <VariantAPrototype {...props} /> : null}
      {variant === "B" ? <VariantBPrototype {...props} /> : null}
      {variant === "C" ? <VariantCPrototype {...props} /> : null}

      <PrototypeSwitcher
        variants={VARIANTS}
        current={variant}
        names={NAMES}
        toggles={[
          {
            param: "code",
            label: "Ethische code",
            options: ["on", "off"],
            current: code,
          },
          {
            param: "closing",
            label: "Slot",
            options: ["line", "cta"],
            current: closing,
          },
        ]}
      />
    </div>
  );
};

export default PrototypeReglementenPage;
