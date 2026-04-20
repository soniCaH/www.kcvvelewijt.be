import Image from "next/image";
import { getButtonClasses } from "@/components/design-system/Button/button-styles";
import { ExternalLink, Facebook } from "@/lib/icons";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";

const DEFAULT_IMAGE_SRC = "/images/youth-trainers.jpg";

export interface MatchesSliderEmptyStateProps {
  placeholder?: MatchesSliderPlaceholderVM | null;
  className?: string;
}

export const MatchesSliderEmptyState = ({
  className,
}: MatchesSliderEmptyStateProps) => {
  // TODO(Task 11): decision rule (countdown/announcement/baseline)
  // TODO(Task 12): render countdown + announcement modes + custom image override

  return (
    <div
      className={cn(
        "mx-auto flex max-w-2xl flex-col items-center gap-6 py-8 text-center",
        className,
      )}
    >
      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl">
        <Image
          src={DEFAULT_IMAGE_SRC}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
      </div>

      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-kcvv-green-bright md:text-sm">
        TUSSENSEIZOEN
      </span>
      <p className="font-title text-3xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
        Er is maar één plezante compagnie
      </p>
      <p className="text-base leading-relaxed text-white/70 md:text-lg">
        We zijn terug in juli!
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={EXTERNAL_LINKS.psdDashboard}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            getButtonClasses({ variant: "primary" }),
            "whitespace-nowrap",
          )}
          aria-label="Bekijk op PSD (opent in nieuw tabblad)"
        >
          Bekijk op PSD
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <a
          href={EXTERNAL_LINKS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            getButtonClasses({ variant: "ghost" }),
            "whitespace-nowrap",
          )}
          aria-label="Volg ons op Facebook (opent in nieuw tabblad)"
        >
          <Facebook size={16} aria-hidden="true" />
          Volg ons op Facebook
        </a>
      </div>
    </div>
  );
};
