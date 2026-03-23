import { cn } from "@/lib/utils/cn";
import { SectionHeader } from "@/components/design-system";
import { SponsorsBlock } from "@/components/sponsors";

export interface SponsorsSectionProps {
  className?: string;
}

export async function SponsorsSection({ className }: SponsorsSectionProps) {
  return (
    <section className={cn("py-6", className)}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title="Onze sponsors"
          linkText="Alle partners"
          linkHref="/sponsors"
          variant="dark"
        />
        <SponsorsBlock
          title=""
          description=""
          showViewAll={false}
          variant="dark"
          columns={5}
          className="py-0"
        />
      </div>
    </section>
  );
}
