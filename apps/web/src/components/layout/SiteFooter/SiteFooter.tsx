import Link from "next/link";
import { EditorialLink } from "@/components/design-system/EditorialLink";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { SocialLinks } from "@/components/design-system/SocialLinks";
import { cn } from "@/lib/utils/cn";
import { CookiePreferencesButton } from "./CookiePreferencesButton";
import {
  FOOTER_ADDRESS_LINE,
  FOOTER_COLUMNS,
  FOOTER_FOUNDING_YEAR,
} from "./footerLinks";

export interface SiteFooterProps {
  className?: string;
}

export const SiteFooter = ({ className }: SiteFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn("bg-cream text-ink", className)}
      aria-labelledby="site-footer-wordmark"
    >
      {/* Top zone — cream paper, wordmark + motto */}
      <div className="border-paper-edge border-b">
        <div className="mx-auto max-w-[1440px] px-6 pt-14 pb-10 text-center md:px-10 md:pt-16 md:pb-12">
          <h2
            id="site-footer-wordmark"
            className="font-display text-[32px] leading-none font-black tracking-tight italic md:text-[44px]"
          >
            <span className="text-ink">KCVV </span>
            <span className="text-jersey-deep">Elewijt</span>
          </h2>
          <p className="font-display mt-4 text-[18px] leading-snug font-bold italic md:text-[21px]">
            Er is maar één <span className="text-jersey-deep">plezante</span>{" "}
            compagnie.
          </p>
        </div>
      </div>

      {/* Directory — 3-col task-oriented link grid */}
      <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-7">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <MonoLabel size="sm">{column.heading}</MonoLabel>
              <span
                aria-hidden="true"
                className="bg-jersey-deep mt-2 block h-[1.5px] w-10"
              />
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <EditorialLink
                      href={link.href}
                      variant="inline"
                      tone="light"
                      className="text-[14px] leading-snug"
                    >
                      {link.label}
                    </EditorialLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Ink bottom bar — colofon */}
      <div className="bg-ink text-cream/85">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-3 px-6 py-4 text-center md:flex-row md:justify-between md:gap-6 md:px-10 md:py-3.5 md:text-left">
          <p className="font-mono text-[10.5px] leading-snug tracking-[0.08em] uppercase">
            <span>
              © {FOOTER_FOUNDING_YEAR}–{currentYear} KCVV Elewijt
            </span>
            <span aria-hidden="true" className="text-cream/40 mx-2">
              ·
            </span>
            <span>{FOOTER_ADDRESS_LINE}</span>
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-cream/70 hover:text-cream font-mono text-[10.5px] tracking-[0.08em] uppercase transition-colors"
            >
              Privacy
            </Link>
            <CookiePreferencesButton />
            <SocialLinks variant="inline" size="sm" />
          </div>
        </div>
      </div>
    </footer>
  );
};
