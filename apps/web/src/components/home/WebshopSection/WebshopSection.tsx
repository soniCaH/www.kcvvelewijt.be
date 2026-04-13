import Image from "next/image";
import { ExternalLink } from "@/lib/icons";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { getButtonClasses } from "@/components/design-system/Button/button-styles";
import { cn } from "@/lib/utils/cn";

export interface WebshopSectionProps {
  className?: string;
}

export const WebshopSection = ({ className }: WebshopSectionProps) => {
  return (
    <section
      className={cn("bg-gray-100 py-16 md:py-20 text-center", className)}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <Image
          src="/images/jerseys.svg"
          alt="Clubkledij — drie truien van KCVV Elewijt"
          width={672}
          height={420}
          className="max-w-2xl w-full mx-auto mb-8"
          priority={false}
        />
        <div className="max-w-2xl mx-auto">
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
            className={getButtonClasses({ variant: "primary" })}
          >
            Naar de webshop
            <ExternalLink
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  );
};
