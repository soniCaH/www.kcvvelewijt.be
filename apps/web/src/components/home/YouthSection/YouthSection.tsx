import { cn } from "@/lib/utils/cn";
import {
  EditorialHeading,
  LinkButton,
  MonoLabel,
} from "@/components/design-system";

export interface YouthSectionProps {
  className?: string;
}

export const YouthSection = ({ className }: YouthSectionProps) => (
  <section className={cn("text-cream text-left", className)}>
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <div className="mb-4">
        <MonoLabel size="md" tone="cream">
          Word jeugdspeler
        </MonoLabel>
      </div>

      <EditorialHeading
        level={2}
        size="display-lg"
        tone="cream"
        emphasis={{ text: "De toekomst", tone: "warm" }}
        className="mb-6 max-w-3xl"
      >
        De toekomst van Elewijt.
      </EditorialHeading>

      <p className="text-cream/90 mb-6 max-w-xl text-base leading-relaxed">
        Onze jeugdwerking groeit elk jaar. Bovenbouw, Middenbouw en Onderbouw
        delen één doel: voetbal als zelfontplooiing — nooit als prestatie
        alleen.
      </p>

      <div className="mb-8">
        <MonoLabel size="md" tone="cream">
          220+ spelers · 16 ploegen
        </MonoLabel>
      </div>

      <LinkButton href="/jeugd" variant="primary" withArrow>
        Ontdek onze jeugd
      </LinkButton>
    </div>
  </section>
);
