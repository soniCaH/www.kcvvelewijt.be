import Link from "next/link";
import { Facebook, Instagram } from "@/lib/icons";
import { EXTERNAL_LINKS } from "@/lib/constants";
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
            className="font-display text-[32px] leading-none font-black tracking-[-0.01em] italic md:text-[44px]"
          >
            <span className="text-ink">KCVV </span>
            <span className="text-jersey-deep">Elewijt</span>
          </h2>
          <p className="font-display text-ink mt-4 text-[18px] leading-snug font-bold italic md:text-[21px]">
            Er is maar één{" "}
            <em className="text-jersey-deep font-extrabold">plezante</em>{" "}
            compagnie.
          </p>
        </div>
      </div>

      {/* Directory — 3-col task-oriented link grid */}
      <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-7">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="border-jersey-deep text-ink mb-3 border-b-[1.5px] pb-2 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
                {column.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-ink-soft hover:text-jersey-deep hover:border-jersey-deep inline-block border-b border-transparent text-[14px] leading-snug font-medium transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Ink bottom bar — colofon */}
      <div className="bg-ink text-cream">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-3 px-6 py-3.5 leading-none md:flex-row md:items-center md:justify-between md:gap-6 md:px-10">
          <p className="m-0 flex h-6 items-center font-mono text-[9.5px] font-medium tracking-[0.06em] uppercase md:text-[10.5px]">
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
              className="text-cream/85 hover:text-cream inline-flex h-6 items-center font-mono text-[9.5px] font-medium tracking-[0.06em] uppercase transition-colors md:text-[10.5px]"
            >
              Privacy
            </Link>
            <CookiePreferencesButton />
            <ul className="m-0 flex list-none gap-2 p-0">
              <li>
                <a
                  href={EXTERNAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="KCVV Elewijt op Facebook"
                  className="border-cream/85 text-cream/85 hover:border-cream hover:text-cream inline-flex h-6 w-6 items-center justify-center border transition-colors"
                >
                  <Facebook className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={EXTERNAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="KCVV Elewijt op Instagram"
                  className="border-cream/85 text-cream/85 hover:border-cream hover:text-cream inline-flex h-6 w-6 items-center justify-center border transition-colors"
                >
                  <Instagram className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
