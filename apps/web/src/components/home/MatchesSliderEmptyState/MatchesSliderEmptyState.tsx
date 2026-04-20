import Image from "next/image";
import { getButtonClasses } from "@/components/design-system/Button/button-styles";
import { ExternalLink, Facebook } from "@/lib/icons";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";

const DEFAULT_IMAGE_SRC = "/images/youth-trainers.jpg";

export type MatchesSliderEmptyStateLayout = "split" | "centered";

export interface MatchesSliderEmptyStateProps {
  placeholder?: MatchesSliderPlaceholderVM | null;
  layout?: MatchesSliderEmptyStateLayout;
  className?: string;
}

export const MatchesSliderEmptyState = ({
  layout = "split",
  className,
}: MatchesSliderEmptyStateProps) => {
  // TODO(Task 11): decision rule (countdown/announcement/baseline)
  // TODO(Task 12): render countdown + announcement modes + custom image override

  return layout === "split" ? (
    <SplitLayout className={className} />
  ) : (
    <CenteredLayout className={className} />
  );
};

const SplitLayout = ({ className }: { className?: string }) => (
  <div
    className={cn("grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8", className)}
  >
    <div className="relative aspect-video overflow-hidden rounded-xl md:col-span-2">
      <Image
        src={DEFAULT_IMAGE_SRC}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 66vw"
        className="object-cover"
      />
    </div>

    <div className="flex flex-col justify-center gap-4 md:col-span-1">
      <EmptyStateContent />
      <CTAButtons />
    </div>
  </div>
);

const CenteredLayout = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "mx-auto flex max-w-2xl flex-col gap-6 py-8 text-center",
      className,
    )}
  >
    <div className="relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-xl">
      <Image
        src={DEFAULT_IMAGE_SRC}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        className="object-cover"
      />
    </div>

    <div className="flex flex-col items-center gap-4">
      <EmptyStateContent centered />
      <CTAButtons centered />
    </div>
  </div>
);

const EmptyStateContent = ({ centered = false }: { centered?: boolean }) => (
  <>
    <span
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.15em] text-kcvv-green-bright md:text-sm",
      )}
    >
      TUSSENSEIZOEN
    </span>
    <p
      className={cn(
        "text-2xl font-bold leading-tight text-white md:text-4xl lg:text-5xl",
        centered && "text-center",
      )}
    >
      Er is maar één plezante compagnie
    </p>
    <p
      className={cn(
        "text-base leading-relaxed text-white/70 md:text-lg",
        centered && "text-center",
      )}
    >
      We zijn terug in juli!
    </p>
  </>
);

const CTAButtons = ({ centered = false }: { centered?: boolean }) => (
  <div
    className={cn(
      "flex flex-col gap-3 sm:flex-row",
      centered && "justify-center",
    )}
  >
    <a
      href={EXTERNAL_LINKS.psdDashboard}
      target="_blank"
      rel="noopener noreferrer"
      className={getButtonClasses({ variant: "primary" })}
      aria-label="Bekijk op PSD (opent in nieuw tabblad)"
    >
      Bekijk op PSD
      <ExternalLink size={16} aria-hidden="true" />
    </a>
    <a
      href={EXTERNAL_LINKS.facebook}
      target="_blank"
      rel="noopener noreferrer"
      className={getButtonClasses({ variant: "ghost" })}
      aria-label="Volg ons op Facebook (opent in nieuw tabblad)"
    >
      <Facebook size={16} aria-hidden="true" />
      Volg ons op Facebook
    </a>
  </div>
);
