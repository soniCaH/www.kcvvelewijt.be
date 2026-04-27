/**
 * PageFooter Element Stories
 * Granular stories showing individual footer elements for visual verification
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram } from "@/lib/icons";
import { SectionTransition } from "@/components/design-system/SectionTransition/SectionTransition";

const meta = {
  title: "Layout/PageFooter/Elements",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Individual elements from the redesigned PageFooter for visual verification",
      },
    },
  },
  tags: ["autodocs", "vr"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 01. Diagonal Transition
 * SectionTransition from gray-100 to kcvv-green-dark, direction=left
 */
export const DiagonalTransition: Story = {
  render: () => (
    <div className="w-[800px]">
      <div className="flex h-32 items-center justify-center bg-gray-100">
        <p className="text-gray-600">Page content (gray-100)</p>
      </div>
      <SectionTransition
        from="gray-100"
        to="kcvv-green-dark"
        type="diagonal"
        direction="left"
      />
      <div className="bg-kcvv-green-dark h-32" />
    </div>
  ),
};

/**
 * 02. Green Hero Zone
 * Bold display text in font-title (quasimoda), right-aligned
 */
export const GreenHeroZone: Story = {
  render: () => (
    <div className="bg-kcvv-green-dark w-[800px]">
      <div className="max-w-outer mx-auto px-10 pt-12 pb-10 text-right">
        <p className="font-title text-kcvv-black text-[clamp(3rem,10vw,8rem)] leading-[0.9] font-black tracking-tight uppercase">
          KCVV Elewijt
        </p>
      </div>
    </div>
  ),
};

/**
 * 03. Club Crest Logo
 * Logo at 104px height in the info grid
 */
export const ClubCrestLogo: Story = {
  render: () => (
    <div className="bg-kcvv-black p-8">
      <Image
        src="/images/logos/kcvv-logo.png"
        alt="KCVV Elewijt"
        width={104}
        height={104}
        className="h-[104px] w-auto"
      />
    </div>
  ),
};

/**
 * 04. Club Links Column
 * Heading + navigation links with green hover
 */
export const ClubLinksColumn: Story = {
  render: () => (
    <div className="bg-kcvv-black w-[300px] p-8">
      <p className="font-title mb-[1.125rem] text-[0.6875rem] font-extrabold tracking-[0.16em] text-white/50 uppercase">
        Club
      </p>
      <ul className="flex flex-col gap-2.5">
        {["Nieuws", "Kalender", "Ploegen", "Sponsors", "Bestuur"].map(
          (label) => (
            <li key={label}>
              <Link
                href="#"
                className="hover:text-kcvv-green-bright text-[0.8125rem] leading-snug text-white/55 transition-colors"
              >
                {label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  ),
};

/**
 * 05. Contact Column
 * Address, email, and social icons
 */
export const ContactColumn: Story = {
  render: () => (
    <div className="bg-kcvv-black w-[300px] p-8">
      <p className="font-title mb-[1.125rem] text-[0.6875rem] font-extrabold tracking-[0.16em] text-white/50 uppercase">
        Contact
      </p>
      <p className="mb-4 text-[0.8125rem] leading-relaxed text-white/55">
        Driesstraat 32
        <br />
        1982 Elewijt
      </p>
      <a
        href="mailto:info@kcvvelewijt.be"
        className="hover:text-kcvv-green-bright text-[0.8125rem] font-semibold text-white/70 transition-colors"
      >
        info@kcvvelewijt.be
      </a>
      <div className="mt-5 flex gap-2.5">
        <a
          href="#"
          aria-label="Facebook"
          className="hover:text-kcvv-green-bright text-white/30 transition-colors"
        >
          <Facebook className="h-[18px] w-[18px]" />
        </a>
        <a
          href="#"
          aria-label="Instagram"
          className="hover:text-kcvv-green-bright text-white/30 transition-colors"
        >
          <Instagram className="h-[18px] w-[18px]" />
        </a>
      </div>
    </div>
  ),
};

/**
 * 06. Bottom Bar
 * Copyright, privacy link, and cookie button with dot separators
 */
export const BottomBar: Story = {
  render: () => (
    <div className="bg-kcvv-black w-[800px]">
      <div className="flex items-center justify-center gap-6 border-t border-white/6 px-8 py-3.5 text-[0.6875rem] tracking-wide text-white/35">
        <span>© {new Date().getFullYear()} KCVV Elewijt</span>
        <span className="text-white/12" aria-hidden="true">
          ·
        </span>
        <a
          href="#"
          className="text-[0.6875rem] text-white/35 transition-colors hover:text-white/65"
        >
          Privacyverklaring
        </a>
        <span className="text-white/12" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 text-[0.6875rem] text-white/35 transition-colors hover:text-white/65"
        >
          Cookie-instellingen
        </button>
      </div>
    </div>
  ),
};
