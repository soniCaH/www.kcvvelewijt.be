import Image from "next/image";
import Link from "next/link";
import { getButtonClasses } from "@/components/design-system/Button/button-styles";
import { ExternalLink, Facebook } from "@/lib/icons";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { formatMatchDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";
import { resolveContent, type ResolvedContent } from "./decisionRule";

const DEFAULT_IMAGE_SRC = "/images/youth-trainers.jpg";
const MOTTO = "Er is maar één plezante compagnie";

export interface MatchesSliderEmptyStateProps {
  placeholder?: MatchesSliderPlaceholderVM | null;
  className?: string;
}

export const MatchesSliderEmptyState = ({
  placeholder,
  className,
}: MatchesSliderEmptyStateProps) => {
  const content = resolveContent(placeholder);
  const image = placeholder?.highlightImage;
  const imageSrc = image?.url ?? DEFAULT_IMAGE_SRC;
  const imageAlt = image?.alt ?? "";

  return (
    <div
      className={cn(
        "mx-auto flex max-w-2xl flex-col items-center gap-6 py-8 text-center",
        className,
      )}
    >
      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
      </div>

      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-kcvv-green-bright md:text-sm">
        {content.eyebrow}
      </span>

      <MainLines content={content} />

      <CTAButtons />
    </div>
  );
};

const MainLines = ({ content }: { content: ResolvedContent }) => {
  switch (content.mode) {
    case "baseline":
      return (
        <>
          <Title>{MOTTO}</Title>
          <Secondary>We zijn terug in juli!</Secondary>
        </>
      );
    case "countdown": {
      const dayWord = content.daysUntil === 1 ? "dag" : "dagen";
      const dateLabel = formatMatchDate(content.kickoffDate);
      return (
        <>
          <Title
            aria-label={`Nog ${content.daysUntil} ${dayWord} tot het nieuwe seizoen, aftrap op ${dateLabel}`}
          >
            Nog{" "}
            <strong className="text-kcvv-green-bright">
              {content.daysUntil} {dayWord}
            </strong>{" "}
            tot het nieuwe seizoen
          </Title>
          <Secondary>Aftrap op {dateLabel}</Secondary>
          {content.secondary && <AnnouncementNote text={content.secondary} />}
        </>
      );
    }
    case "today": {
      const dateLabel = formatMatchDate(content.kickoffDate);
      return (
        <>
          <Title
            aria-label={`Het seizoen start vandaag, aftrap op ${dateLabel}`}
          >
            Het seizoen start{" "}
            <strong className="text-kcvv-green-bright">vandaag!</strong>
          </Title>
          <Secondary>Aftrap op {dateLabel}</Secondary>
          {content.secondary && <AnnouncementNote text={content.secondary} />}
        </>
      );
    }
    case "announcement":
      return (
        <>
          <Title>{content.text}</Title>
          <Secondary>{MOTTO}</Secondary>
          {content.href && <AnnouncementLink href={content.href} />}
        </>
      );
    default:
      return assertUnreachable(content);
  }
};

function assertUnreachable(x: never): never {
  throw new Error(
    `Unhandled MatchesSliderEmptyState mode: ${JSON.stringify(x)}`,
  );
}

const Title = ({
  children,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  "aria-label"?: string;
}) => (
  // h3 sits under the SectionHeader's h2 ("Wedstrijden"), giving the empty
  // state a proper outline entry without duplicating the section heading.
  <h3
    className="font-title text-3xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl"
    aria-label={ariaLabel}
  >
    {children}
  </h3>
);

const Secondary = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base leading-relaxed text-white/70 md:text-lg">
    {children}
  </p>
);

const AnnouncementNote = ({ text }: { text: string }) => (
  <p className="text-sm text-white/60 md:text-base">{text}</p>
);

// Sanity's announcementHref allows relative URLs (allowRelative: true).
// Render internal paths via next/link for client-side navigation +
// prefetching; external URLs get the standard new-tab anchor.
const AnnouncementLink = ({ href }: { href: string }) => {
  const linkClasses =
    "text-sm font-semibold text-kcvv-green-bright underline-offset-4 hover:underline";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={linkClasses}>
        Meer info
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClasses}
    >
      Meer info
    </a>
  );
};

const CTAButtons = () => (
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
);
