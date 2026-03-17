import { cn } from "@/lib/utils/cn";
import { SectionHeader } from "@/components/design-system";
import { SponsorsBlock } from "@/components/sponsors";

export interface SponsorsSectionProps {
  className?: string;
}

export async function SponsorsSection({ className }: SponsorsSectionProps) {
  return (
    <section className={cn("bg-gray-100 py-20", className)}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <SectionHeader
          title="Sponsors"
          linkText="Word sponsor"
          linkHref="/sponsors"
        />
        <SponsorsBlock
          title=""
          description=""
          showViewAll={false}
          variant="light"
          columns={5}
          className="py-0"
        />
      </div>
    </section>
  );
}
