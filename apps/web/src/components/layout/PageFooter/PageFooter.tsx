"use client";

/**
 * PageFooter Component
 * Site footer with contact info, social links, and sponsors
 * Matches Gatsby visual: black background with SVG wavy top edge
 */

import Link from "next/link";
import * as CookieConsent from "vanilla-cookieconsent";
import Image from "next/image";
import { SocialLinks } from "@/components/design-system";
import { SponsorsBlock } from "@/components/sponsors";
import { cn } from "@/lib/utils/cn";

export interface PageFooterProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface ContactRow {
  label: string;
  value: string | React.ReactNode;
}

const contactRows: ContactRow[] = [
  {
    label: "KCVV Elewijt",
    value: "Driesstraat 30, 1982 Elewijt",
  },
  {
    label: "Voorzitter",
    value: "Rudy Bautmans",
  },
  {
    label: "GC",
    value: (
      <a
        href="mailto:gc@kcvvelewijt.be"
        className="text-kcvv-green-bright hover:underline"
      >
        John De Ron
      </a>
    ),
  },
  {
    label: "Algemeen contact",
    value: (
      <a
        href="mailto:info@kcvvelewijt.be"
        className="text-kcvv-green-bright hover:underline"
      >
        info@kcvvelewijt.be
      </a>
    ),
  },
  {
    label: "Jeugdwerking",
    value: (
      <a
        href="mailto:jeugd@kcvvelewijt.be"
        className="text-kcvv-green-bright hover:underline"
      >
        jeugd@kcvvelewijt.be
      </a>
    ),
  },
  {
    label: "Verhuur kantine",
    value: (
      <a
        href="mailto:verhuur@kcvvelewijt.be"
        className="text-kcvv-green-bright hover:underline"
      >
        Ann Walgraef
      </a>
    ),
  },
  {
    label: "Website",
    value: (
      <a
        href="mailto:kevin@kcvvelewijt.be"
        className="text-kcvv-green-bright hover:underline"
      >
        Kevin Van Ransbeeck
      </a>
    ),
  },
  {
    label: "Privacy & cookies",
    value: (
      <a href="/privacy" className="text-kcvv-green-bright hover:underline">
        Privacyverklaring
      </a>
    ),
  },
  {
    label: "Cookie-instellingen",
    value: (
      <button
        type="button"
        onClick={() => CookieConsent.showPreferences()}
        className="text-kcvv-green-bright hover:underline cursor-pointer bg-transparent border-0 p-0 text-[0.875rem]"
      >
        Cookie-instellingen
      </button>
    ),
  },
];

/**
 * Site footer component
 *
 * Visual specifications (matching Gatsby):
 * - Background: Black (#1E2024) with SVG wavy top edge
 * - Text: White
 * - Contact table: 0.875rem (14px), uppercase labels
 * - Social links: Circle variant with gray borders
 * - Sponsors: 4-column grid, inverted logos, opacity 0.5→1
 * - Bottom motto: "Er is maar één plezante compagnie" with gradient line
 * - Padding: 75px top (to accommodate SVG wave), 2em sides
 * - Margin-top: 50px
 */
export const PageFooter = ({ className }: PageFooterProps) => {
  return (
    <footer
      className={cn("relative z-10 mt-[50px] text-white", className)}
      style={{
        background:
          "linear-gradient(to bottom, transparent 0%, transparent 50px, #1E2024 50px 100%), url(/images/footer-top.svg) top center no-repeat",
        backgroundSize: "100%",
        padding: "75px 2rem 2rem",
      }}
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Section - 5 columns */}
          <div className="lg:col-span-5">
            {/* Logo and Social */}
            <div className="flex flex-row items-center mb-8">
              <div className="mr-6">
                <Link href="/">
                  <Image
                    src="/images/logo-flat.png"
                    alt="KCVV ELEWIJT"
                    width={150}
                    height={60}
                    className="h-auto w-auto"
                  />
                </Link>
              </div>
              <SocialLinks variant="circle" />
            </div>

            {/* Contact Details Table */}
            <table className="w-full text-[0.875rem]">
              <tbody>
                {contactRows.map((row, index) => (
                  <tr
                    key={index}
                    className="lg:table-row flex flex-col lg:flex-row mb-2 lg:mb-0"
                  >
                    <th className="text-left font-normal uppercase p-0 lg:pr-4 lg:pb-1 lg:align-top lg:w-[180px] underline lg:no-underline">
                      {row.label}
                    </th>
                    <td className="p-0 lg:pb-1 lg:align-top text-white">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vertical Divider - 1 column */}
          <div className="hidden lg:block lg:col-span-1 relative">
            <div
              className="absolute h-full w-px top-0 left-1/2"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 100%)",
              }}
            />
          </div>

          {/* Sponsors Section - 6 columns */}
          <div className="lg:col-span-6">
            <SponsorsBlock variant="dark" columns={4} className="py-0" />
          </div>
        </div>
      </div>

      {/* Bottom Motto - Desktop only */}
      <div
        className="hidden lg:block relative pt-12 -mb-8 -mx-8"
        style={{
          width: "100vw",
          marginLeft: "-2rem",
        }}
      >
        {/* Gradient top border */}
        <div
          className="absolute top-4 left-0 w-full h-px"
          style={{
            background:
              "linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 33%, rgba(255, 255, 255, 0.2) 66%, rgba(255, 255, 255, 0) 100%)",
          }}
        />

        {/* Motto Text */}
        <p className="text-center text-white/60 text-sm italic py-4">
          Er is maar één plezante compagnie
        </p>
      </div>
    </footer>
  );
};
