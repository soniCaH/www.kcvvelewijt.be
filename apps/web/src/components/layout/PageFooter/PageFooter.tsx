import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Facebook, Instagram } from "@/lib/icons";
import { CookiePreferencesButton } from "./CookiePreferencesButton";
import { cn } from "@/lib/utils/cn";

export interface PageFooterProps {
  className?: string;
}

export const PageFooter = ({ className }: PageFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "bg-kcvv-black border-t border-white/6 text-white",
        className,
      )}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo-flat.png"
                alt="KCVV Elewijt"
                width={120}
                height={48}
                className="h-14 w-auto"
              />
            </Link>
            <p className="font-bold text-white text-sm mb-0.5">
              K.C.V.V. Elewijt
            </p>
            <p className="text-white/30 text-xs mb-6">Opgericht in 1964</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span>Driesstraat 32, 1982 Elewijt</span>
              </div>
              <a
                href="mailto:info@kcvvelewijt.be"
                className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span>info@kcvvelewijt.be</span>
              </a>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com/KCVVElewijt/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Facebook"
                className="text-white/30 hover:text-kcvv-green transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/kcvve"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Instagram"
                className="text-white/30 hover:text-kcvv-green transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Link column 1 — Club */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
              Club
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/club/organigram", label: "Bestuur" },
                { href: "/sponsors", label: "Sponsors" },
                { href: "/privacy", label: "Privacy" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Link column 2 — Website */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
              Website
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/news", label: "Nieuws" },
                { href: "/calendar", label: "Kalender" },
                { href: "/jeugd", label: "Jeugd" },
                { href: "/hulp", label: "Hulp" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/25 text-xs">
            © {currentYear} K.C.V.V. Elewijt
          </p>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <Link
              href="/privacy"
              className="hover:text-white/50 transition-colors"
            >
              Privacyverklaring
            </Link>
            <CookiePreferencesButton />
          </div>
        </div>
      </div>
    </footer>
  );
};
