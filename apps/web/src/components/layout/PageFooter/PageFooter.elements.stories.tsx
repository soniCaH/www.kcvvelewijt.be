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
  tags: ["autodocs"],
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
      <div className="h-32 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Page content (gray-100)</p>
      </div>
      <SectionTransition
        from="gray-100"
        to="kcvv-green-dark"
        type="diagonal"
        direction="left"
      />
      <div className="h-32 bg-kcvv-green-dark" />
    </div>
  ),
};

/**
 * 02. Green Hero Zone
 * Bold display text in stenciletta, right-aligned
 */
export const GreenHeroZone: Story = {
  render: () => (
    <div className="w-[800px] bg-kcvv-green-dark">
      <div className="max-w-outer mx-auto px-10 pt-12 pb-10 text-right">
        <p className="font-alt font-black text-kcvv-black uppercase leading-[0.9] tracking-tight text-[clamp(3rem,10vw,8rem)]">
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
    <div className="bg-kcvv-black p-8 w-[300px]">
      <h3 className="text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-white/50 mb-[1.125rem]">
        Club
      </h3>
      <ul className="flex flex-col gap-[0.625rem]">
        {["Nieuws", "Kalender", "Ploegen", "Sponsors", "Bestuur"].map(
          (label) => (
            <li key={label}>
              <Link
                href="#"
                className="text-[0.8125rem] text-white/55 hover:text-kcvv-green-bright transition-colors"
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
    <div className="bg-kcvv-black p-8 w-[300px]">
      <h3 className="text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-white/50 mb-[1.125rem]">
        Contact
      </h3>
      <p className="text-[0.8125rem] text-white/55 leading-relaxed mb-4">
        Driesstraat 32
        <br />
        1982 Elewijt
      </p>
      <a
        href="mailto:info@kcvvelewijt.be"
        className="text-[0.8125rem] font-semibold text-white/70 hover:text-kcvv-green-bright transition-colors"
      >
        info@kcvvelewijt.be
      </a>
      <div className="flex gap-[0.625rem] mt-5">
        <a
          href="#"
          aria-label="Facebook"
          className="text-white/30 hover:text-kcvv-green-bright transition-colors"
        >
          <Facebook className="w-[18px] h-[18px]" />
        </a>
        <a
          href="#"
          aria-label="Instagram"
          className="text-white/30 hover:text-kcvv-green-bright transition-colors"
        >
          <Instagram className="w-[18px] h-[18px]" />
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
      <div className="border-t border-white/6 flex items-center justify-center gap-6 px-8 py-3.5 text-[0.6875rem] text-white/35 tracking-wide">
        <span>© 2026 KCVV Elewijt</span>
        <span className="text-white/12" aria-hidden="true">
          ·
        </span>
        <a
          href="#"
          className="text-[0.6875rem] text-white/35 hover:text-white/65 transition-colors"
        >
          Privacyverklaring
        </a>
        <span className="text-white/12" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="text-[0.6875rem] text-white/35 hover:text-white/65 transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          Cookie-instellingen
        </button>
      </div>
    </div>
  ),
};
