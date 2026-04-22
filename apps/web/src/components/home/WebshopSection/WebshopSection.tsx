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
      className={cn("bg-gray-100 py-16 text-center md:py-20", className)}
    >
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <Image
          src="/images/jerseys.png"
          alt="Clubkledij — drie truien van KCVV Elewijt"
          width={1280}
          height={720}
          className="mx-auto mb-8 w-full max-w-2xl"
          priority={false}
        />
        <div className="mx-auto max-w-2xl">
          <h2 className="font-title text-kcvv-black mb-4 text-2xl font-black tracking-tight uppercase md:text-3xl">
            Clubkledij
          </h2>
          <p className="mb-8 text-base leading-relaxed text-gray-600">
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
