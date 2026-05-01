import { cn } from "@/lib/utils/cn";
import {
  EditorialHeading,
  type EditorialHeadingEmphasis,
  type EditorialHeadingSize,
} from "../EditorialHeading";
import { EditorialLink } from "../EditorialLink";
import { MonoLabelRow, type MonoLabelRowItem } from "../MonoLabelRow";

type SectionHeaderCta = { linkText: string; linkHref: string };

export type SectionHeaderBase = {
  title: string;
  /** Optional uppercase mono kicker rendered above the heading via <MonoLabelRow> */
  kicker?: MonoLabelRowItem[];
  /** Optional italic emphasis pass-through to the underlying <EditorialHeading> */
  emphasis?: EditorialHeadingEmphasis;
  /** Size of the underlying <EditorialHeading>. Default: 'display-lg' */
  size?: EditorialHeadingSize;
  /** "light" = ink on cream (default); "dark" = cream on ink */
  variant?: "light" | "dark";
  /** Override the rendered heading level. Default: h2 */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export type SectionHeaderProps = SectionHeaderBase &
  ({ linkText?: never; linkHref?: never } | SectionHeaderCta);

function headingLevelFor(as: SectionHeaderProps["as"]): 1 | 2 | 3 {
  switch (as) {
    case "h1":
      return 1;
    case "h3":
      return 3;
    case "h2":
    case undefined:
      return 2;
    default: {
      // Exhaustiveness check — TypeScript narrows `as` to `never` here, so
      // adding a new tag variant to SectionHeaderProps['as'] without a case
      // becomes a compile-time error.
      const _exhaustive: never = as;
      throw new Error(`headingLevelFor: unhandled value ${_exhaustive}`);
    }
  }
}

/**
 * Section header reworked in Phase 1 to compose <EditorialHeading> +
 * <MonoLabelRow>. Drops the legacy `font-body!` / `font-black!` / `mb-0!` /
 * green-left-border treatment in favour of the redesign editorial vocabulary.
 *
 * All existing call sites continue to work — `kicker` and `emphasis` are
 * additive opt-in props.
 */
export const SectionHeader = ({
  title,
  kicker,
  emphasis,
  size = "display-lg",
  linkText,
  linkHref,
  variant = "light",
  as = "h2",
  className,
}: SectionHeaderProps) => {
  const isDark = variant === "dark";

  return (
    <header className={cn("mb-10 flex flex-col gap-3", className)}>
      {kicker && kicker.length > 0 && <MonoLabelRow items={kicker} />}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <EditorialHeading
          level={headingLevelFor(as)}
          size={size}
          emphasis={emphasis}
          tone={isDark ? "cream" : "ink"}
        >
          {title}
        </EditorialHeading>
        {linkText && linkHref && (
          <EditorialLink
            href={linkHref}
            variant="cta"
            tone={isDark ? "dark" : "light"}
          >
            {linkText}
          </EditorialLink>
        )}
      </div>
    </header>
  );
};
