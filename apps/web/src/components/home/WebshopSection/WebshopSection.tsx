import { ExternalLink } from "@/lib/icons";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface WebshopSectionProps {
  className?: string;
}

export const WebshopSection = ({ className }: WebshopSectionProps) => {
  return (
    <section
      className={cn("bg-gray-100 py-16 md:py-20 text-center", className)}
    >
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        <h2 className="font-title text-2xl md:text-3xl font-black text-kcvv-black uppercase tracking-tight mb-4">
          Clubkledij
        </h2>
        <p className="text-base text-gray-600 leading-relaxed mb-8">
          Van extra kousen tot een volledig clubpakket — ontdek ons volledige
          aanbod aan clubkledij en accessoires.
        </p>
        <a
          href={EXTERNAL_LINKS.webshop}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-6 py-3 bg-kcvv-green-dark text-white font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-kcvv-green transition-colors"
        >
          Naar de webshop
          <ExternalLink
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  );
};
