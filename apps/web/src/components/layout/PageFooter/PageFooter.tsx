import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram } from "@/lib/icons";
import { CookiePreferencesButton } from "./CookiePreferencesButton";
import { DirectionsLink } from "./DirectionsLink";
import { FooterTransition } from "./FooterTransition";
import { SectionTransition } from "@/components/design-system/SectionTransition/SectionTransition";
import { cn } from "@/lib/utils/cn";
import { EXTERNAL_LINKS } from "@/lib/constants";

export interface PageFooterProps {
  className?: string;
}

const clubLinks = [
  { href: "/nieuws", label: "Nieuws" },
  { href: "/kalender", label: "Kalender" },
  { href: "/ploegen", label: "Ploegen" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/club/organigram", label: "Bestuur" },
  { href: EXTERNAL_LINKS.webshop, label: "Webshop", external: true },
] as const;

export const PageFooter = ({ className }: PageFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={cn(className)}>
      {/* Diagonal: adapts based on the last section of the current page */}
      <FooterTransition />

      {/* Zone 1 — Green hero */}
      <div className="bg-kcvv-green-dark">
        <div className="max-w-outer mx-auto px-10 pt-12 pb-10 text-right max-md:text-center max-md:px-6 max-md:pt-10 max-md:pb-8">
          <p className="font-title font-black text-kcvv-black uppercase leading-[0.9] tracking-tight text-[clamp(3rem,10vw,8rem)]">
            KCVV Elewijt
          </p>
        </div>
      </div>

      {/* Diagonal between green hero and info zone — eliminates the
          previous hard-color seam between green and black */}
      <SectionTransition
        from="kcvv-green-dark"
        to="kcvv-black"
        type="diagonal"
        direction="right"
      />

      {/* Zone 2 — Info zone */}
      <footer className="bg-kcvv-black text-white">
        <div className="max-w-outer mx-auto px-10 py-10 grid grid-cols-3 gap-8 items-start max-md:grid-cols-1 max-md:px-6 max-md:py-8 max-md:gap-8">
          {/* Col 1 — Logo */}
          <div className="flex items-start max-md:justify-center">
            <Image
              src="/images/logos/kcvv-logo.png"
              alt="KCVV Elewijt"
              width={104}
              height={104}
              className="h-[104px] w-auto"
            />
          </div>

          {/* Col 2 — Club links */}
          <div className="max-md:text-center">
            <p className="font-title text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-white/50 mb-[1.125rem]">
              Club
            </p>
            <ul className="flex flex-col gap-2.5">
              {clubLinks.map((item) => (
                <li key={item.label}>
                  {"external" in item ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.8125rem] leading-snug text-white/55 hover:text-kcvv-green-bright transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-[0.8125rem] leading-snug text-white/55 hover:text-kcvv-green-bright transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Contact */}
          <div className="max-md:text-center">
            <p className="font-title text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-white/50 mb-[1.125rem]">
              Contact
            </p>
            <p className="text-[0.8125rem] text-white/55 leading-relaxed mb-3">
              Driesstraat 32
              <br />
              1982 Elewijt
            </p>
            <div className="mb-4">
              <DirectionsLink />
            </div>
            <a
              href="mailto:info@kcvvelewijt.be"
              className="text-[0.8125rem] font-semibold text-white/70 hover:text-kcvv-green-bright transition-colors"
            >
              info@kcvvelewijt.be
            </a>
            <div className="flex gap-2.5 mt-5 max-md:justify-center">
              <a
                href={EXTERNAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Facebook"
                className="text-white/30 hover:text-kcvv-green-bright transition-colors"
              >
                <Facebook className="w-[18px] h-[18px]" />
              </a>
              <a
                href={EXTERNAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Instagram"
                className="text-white/30 hover:text-kcvv-green-bright transition-colors"
              >
                <Instagram className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>
        </div>

        {/* Zone 3 — Bottom bar */}
        <div className="border-t border-white/6 flex items-center justify-center gap-6 px-8 py-3.5 flex-wrap text-[0.6875rem] text-white/35 tracking-wide max-md:flex-col max-md:gap-1.5 max-md:px-6">
          <span>© {currentYear} KCVV Elewijt</span>
          <span className="text-white/12 max-md:hidden" aria-hidden="true">
            ·
          </span>
          <Link
            href="/privacy"
            className="text-[0.6875rem] text-white/35 hover:text-white/65 transition-colors"
          >
            Privacyverklaring
          </Link>
          <span className="text-white/12 max-md:hidden" aria-hidden="true">
            ·
          </span>
          <CookiePreferencesButton />
        </div>
      </footer>
    </div>
  );
};
