import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram } from "@/lib/icons";
import { CookiePreferencesButton } from "./CookiePreferencesButton";
import { DirectionsLink } from "./DirectionsLink";
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
      {/*
        Self-owning diagonal into the green footer.

        `overlap="full"` pulls the transition up by DIAGONAL_HEIGHT so the
        strip physically sits over the last body section and its upper
        triangle is left transparent — whatever color that section paints
        shows through. The footer therefore composes cleanly against every
        page with no pathname registry or per-page `from` color.

        `from="transparent"` documents intent only: in overlap mode
        `SectionTransition` ignores the `from` prop and always paints the
        upper triangle transparent. Do not try to "fix" this by changing it.
      */}
      <SectionTransition
        from="transparent"
        to="kcvv-green-dark"
        type="diagonal"
        direction="left"
        overlap="full"
      />

      {/* Zone 1 — Green hero */}
      <div className="bg-kcvv-green-dark">
        <div className="max-w-outer mx-auto px-10 pt-12 pb-10 text-right max-md:px-6 max-md:pt-10 max-md:pb-8 max-md:text-center">
          <p className="font-title text-kcvv-black text-[clamp(3rem,10vw,8rem)] leading-[0.9] font-black tracking-tight uppercase">
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
        <div className="max-w-outer mx-auto grid grid-cols-3 items-start gap-8 px-10 py-10 max-md:grid-cols-1 max-md:gap-8 max-md:px-6 max-md:py-8">
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
            <p className="font-title mb-[1.125rem] text-[0.6875rem] font-extrabold tracking-[0.16em] text-white/50 uppercase">
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
                      className="hover:text-kcvv-green-bright text-[0.8125rem] leading-snug text-white/55 transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-kcvv-green-bright text-[0.8125rem] leading-snug text-white/55 transition-colors"
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
            <p className="font-title mb-[1.125rem] text-[0.6875rem] font-extrabold tracking-[0.16em] text-white/50 uppercase">
              Contact
            </p>
            <p className="mb-3 text-[0.8125rem] leading-relaxed text-white/55">
              Driesstraat 32
              <br />
              1982 Elewijt
            </p>
            <div className="mb-4">
              <DirectionsLink />
            </div>
            <a
              href="mailto:info@kcvvelewijt.be"
              className="hover:text-kcvv-green-bright text-[0.8125rem] font-semibold text-white/70 transition-colors"
            >
              info@kcvvelewijt.be
            </a>
            <div className="mt-5 flex gap-2.5 max-md:justify-center">
              <a
                href={EXTERNAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Facebook"
                className="hover:text-kcvv-green-bright text-white/30 transition-colors"
              >
                <Facebook className="h-[18px] w-[18px]" />
              </a>
              <a
                href={EXTERNAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Instagram"
                className="hover:text-kcvv-green-bright text-white/30 transition-colors"
              >
                <Instagram className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>
        </div>

        {/* Zone 3 — Bottom bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/6 px-8 py-3.5 text-[0.6875rem] tracking-wide text-white/35 max-md:flex-col max-md:gap-1.5 max-md:px-6">
          <span>© {currentYear} KCVV Elewijt</span>
          <span className="text-white/12 max-md:hidden" aria-hidden="true">
            ·
          </span>
          <Link
            href="/privacy"
            className="text-[0.6875rem] text-white/35 transition-colors hover:text-white/65"
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
