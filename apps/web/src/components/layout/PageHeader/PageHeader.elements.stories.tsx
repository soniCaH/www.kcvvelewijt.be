/**
 * PageHeader Component - Granular Element Stories
 * Each story shows individual elements and states for pixel-perfect matching with Gatsby
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
import { Menu, Search } from "@/lib/icons";

const meta = {
  title: "Layout/PageHeader/Elements",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 01. Header Container
 * Green background (#4acf52) with pattern image overlay
 * Heights: 5rem (mobile) / 7.5rem (desktop at 960px+)
 * Pattern positioned at 50% -7vw
 */
export const HeaderContainer: Story = {
  render: () => (
    <header className="bg-kcvv-green-bright relative">
      <div
        className="fixed top-0 right-0 left-0 z-[11] h-20 lg:h-[7.5rem]"
        style={{
          backgroundImage: "url(/images/header-pattern.png)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100vw auto",
          backgroundPosition: "50% -7vw",
          backgroundColor: "#4acf52",
        }}
      >
        <div className="flex h-full items-center justify-center text-sm text-white">
          Container with green background + pattern
        </div>
      </div>
    </header>
  ),
};

/**
 * 02. Logo - Desktop Size
 * Height: 7rem (112px)
 * Width: auto
 * Margin-right: 0.5rem
 */
export const LogoDesktop: Story = {
  render: () => (
    <div className="bg-kcvv-green-bright p-8">
      <div className="flex items-center">
        <Image
          src="/images/logos/kcvv-logo.png"
          alt="KCVV ELEWIJT"
          width={112}
          height={112}
          className="mr-2 h-28 w-auto transition-all duration-300"
          priority
        />
        <span className="text-xs text-white">Desktop logo (7rem height)</span>
      </div>
    </div>
  ),
};

/**
 * 03. Logo - Mobile Size
 * Width: 100px
 * Height: auto
 * Centered position
 */
export const LogoMobile: Story = {
  render: () => (
    <div className="bg-kcvv-green-bright p-8">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/images/logos/kcvv-logo.png"
          alt="KCVV ELEWIJT"
          width={100}
          height={100}
          className="h-auto w-[100px]"
          priority
        />
        <span className="text-xs text-white">Mobile logo (100px width)</span>
      </div>
    </div>
  ),
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * 04. Navigation Item - Default State
 * Font: 0.7rem (11.2px) / 0.875rem at 1240px+
 * Text-transform: uppercase
 * Font-weight: bold
 * Color: white
 */
export const NavigationItemDefault: Story = {
  render: () => (
    <div className="bg-kcvv-green-bright p-8">
      <nav>
        <ul className="flex items-center gap-6">
          <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
            <a href="#" className="whitespace-nowrap text-white no-underline">
              Club
            </a>
          </li>
          <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
            <a href="#" className="whitespace-nowrap text-white no-underline">
              Nieuws
            </a>
          </li>
          <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
            <a href="#" className="whitespace-nowrap text-white no-underline">
              Ploegen
            </a>
          </li>
        </ul>
      </nav>
    </div>
  ),
};

/**
 * 05. Navigation Item - Hover State
 * White 2px underline that animates from center
 * Transition: width 0.3s ease, left 0.3s ease
 * Width: 0 -> 100%, left: 50% -> 0
 *
 * Implementation: Uses after pseudo-element with center-out animation
 */
export const NavigationItemHover: Story = {
  render: () => (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .story-nav-link-hover {
              position: relative;
              display: inline-block;
              padding-bottom: 0.125rem;
            }
            .story-nav-link-hover::after {
              content: "";
              display: block;
              position: absolute;
              bottom: 0;
              left: 50%;
              height: 2px;
              width: 0;
              background: #fff;
              transition: width 0.3s ease 0s, left 0.3s ease 0s;
            }
            .story-nav-link-hover:hover::after {
              width: 100%;
              left: 0;
            }
          `,
        }}
      />
      <div className="bg-kcvv-green-bright p-8">
        <nav>
          <ul className="m-0 flex list-none items-center gap-6 p-0">
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="story-nav-link-hover whitespace-nowrap text-white no-underline"
              >
                Hover Me
              </a>
            </li>
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="story-nav-link-hover whitespace-nowrap text-white no-underline"
              >
                Another Link
              </a>
            </li>
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="story-nav-link-hover whitespace-nowrap text-white no-underline"
              >
                Third Link
              </a>
            </li>
          </ul>
        </nav>
        <p className="mt-4 text-xs text-white opacity-75">
          Hover over the links above to see the underline animate from center
        </p>
      </div>
    </>
  ),
};

/**
 * 06. Navigation Item - Active State
 * Same as hover: white 2px underline at 100% width
 *
 * Implementation: Permanent underline to show current page
 */
export const NavigationItemActive: Story = {
  render: () => (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .story-nav-link-active {
              position: relative;
              display: inline-block;
              padding-bottom: 0.125rem;
            }
            .story-nav-link-active::after {
              content: "";
              display: block;
              position: absolute;
              bottom: 0;
              left: 0;
              height: 2px;
              width: 100%;
              background: #fff;
            }
          `,
        }}
      />
      <div className="bg-kcvv-green-bright p-8">
        <nav>
          <ul className="m-0 flex list-none items-center gap-6 p-0">
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="whitespace-nowrap text-white no-underline opacity-60"
              >
                Home
              </a>
            </li>
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="story-nav-link-active whitespace-nowrap text-white no-underline"
              >
                Nieuws
              </a>
            </li>
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="whitespace-nowrap text-white no-underline opacity-60"
              >
                Ploegen
              </a>
            </li>
          </ul>
        </nav>
        <p className="mt-4 text-xs text-white opacity-75">
          &quot;Nieuws&quot; is the active page with permanent underline
        </p>
      </div>
    </>
  ),
};

/**
 * 07. Dropdown Menu Trigger
 * Has white chevron-down icon after text
 * Icon: 6px wide, 4px tall
 *
 * Implementation: SVG data URI in ::after pseudo-element
 */
export const DropdownTrigger: Story = {
  render: () => (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .story-dropdown-trigger::after {
              content: "";
              display: inline-block;
              margin-left: 9px;
              width: 6px;
              height: 4px;
              background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 4'%3E%3Cpath transform='translate(-586.156 -1047.28)' fill='%23fff' d='M586.171,1048l0.708-.71,2.828,2.83-0.707.71Zm4.95-.71,0.707,0.71L589,1050.83l-0.707-.71Z'/%3E%3C/svg%3E");
              background-size: 6px 4px;
              background-repeat: no-repeat;
              background-position: center center;
              position: relative;
              top: -2px;
            }
          `,
        }}
      />
      <div className="bg-kcvv-green-bright p-8">
        <nav>
          <ul className="m-0 flex list-none items-center gap-6 p-0">
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="story-dropdown-trigger whitespace-nowrap text-white no-underline"
              >
                Ploegen
              </a>
            </li>
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="story-dropdown-trigger whitespace-nowrap text-white no-underline"
              >
                Info
              </a>
            </li>
            <li className="text-[0.7rem] font-bold uppercase xl:text-[0.875rem]">
              <a
                href="#"
                className="story-dropdown-trigger whitespace-nowrap text-white no-underline"
              >
                De club
              </a>
            </li>
          </ul>
        </nav>
        <p className="mt-4 text-xs text-white opacity-75">
          Dropdown indicators (chevron-down icons) after menu items
        </p>
      </div>
    </>
  ),
};

/**
 * 08. Dropdown Menu - Submenu
 * Background: black (#1E2024)
 * Border: 1px solid gray-dark
 * Text: white, uppercase, bold
 * Font-size: 0.6875rem (11px)
 * Hover: green text
 */
export const DropdownSubmenu: Story = {
  render: () => (
    <div className="bg-gray-100 p-8">
      <div className="inline-block">
        <div className="min-w-[200px] border border-gray-700 bg-[#1E2024]">
          <ul className="m-0 list-none p-0">
            <li>
              <a
                href="#"
                className="hover:text-kcvv-green-bright block px-7 py-3 text-[0.6875rem] font-bold text-white uppercase no-underline transition-colors duration-300"
              >
                Eerste Ploeg
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-kcvv-green-bright block px-7 py-3 text-[0.6875rem] font-bold text-white uppercase no-underline transition-colors duration-300"
              >
                Beloften
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-kcvv-green-bright block px-7 py-3 text-[0.6875rem] font-bold text-white uppercase no-underline transition-colors duration-300"
              >
                U21
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-kcvv-green-bright block px-7 py-3 text-[0.6875rem] font-bold text-white uppercase no-underline transition-colors duration-300"
              >
                U19
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

/**
 * 09. Mobile Hamburger Button
 * Position: left 34px, top calc((5rem - 16px) / 2)
 * Color: white
 * Size: ~16px icon
 */
export const HamburgerButton: Story = {
  render: () => (
    <div className="bg-kcvv-green-bright relative h-20">
      <button
        className="absolute top-[calc((5rem-16px)/2)] left-[34px] flex h-6 w-6 items-center justify-center text-base text-white"
        aria-label="Toggle navigation menu"
      >
        <Menu size={16} />
      </button>
      <div className="flex h-full items-center justify-center text-xs text-white">
        Mobile header with hamburger at left
      </div>
    </div>
  ),
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * 10. Mobile Search Button
 * Position: right side
 * Color: white
 */
export const SearchButton: Story = {
  render: () => (
    <div className="bg-kcvv-green-bright relative h-20">
      <button
        className="absolute top-[calc((5rem-16px)/2)] right-[34px] flex h-6 w-6 items-center justify-center text-base text-white"
        aria-label="Search"
      >
        <Search size={16} />
      </button>
      <div className="flex h-full items-center justify-center text-xs text-white">
        Mobile header with search at right
      </div>
    </div>
  ),
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * 11. Mobile Menu Item with Active Border
 * 4px green left border on hover/active (::before pseudo-element)
 * Border-bottom: 1px solid #292c31
 *
 * Implementation: ::before pseudo-element for left border accent
 */
export const MobileMenuItem: Story = {
  render: () => (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .story-mobile-nav-link {
              position: relative;
            }
            .story-mobile-nav-link::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 4px;
              background-color: transparent;
              transition: background-color 0.3s ease;
            }
            .story-mobile-nav-link:hover::before,
            .story-mobile-nav-link.active::before {
              background-color: #4acf52;
            }
          `,
        }}
      />
      <div className="bg-[#1E2024] p-8">
        <ul className="m-0 list-none p-0">
          <li>
            <a
              href="#"
              className="story-mobile-nav-link block border-b border-[#292c31] px-8 py-4 text-[0.6875rem] font-bold text-white uppercase no-underline"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#"
              className="story-mobile-nav-link active block border-b border-[#292c31] px-8 py-4 text-[0.6875rem] font-bold text-white uppercase no-underline"
            >
              Nieuws
            </a>
          </li>
          <li>
            <a
              href="#"
              className="story-mobile-nav-link block border-b border-[#292c31] px-8 py-4 text-[0.6875rem] font-bold text-white uppercase no-underline"
            >
              Ploegen
            </a>
          </li>
        </ul>
        <p className="mt-4 text-xs text-white opacity-75">
          Hover over links or see &quot;Nieuws&quot; with 4px green left border
          (active state)
        </p>
      </div>
    </>
  ),
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * 12. Mobile Menu Submenu (Accordion)
 * Background: #292c31 (var(--color-gray--dark) - dark charcoal gray)
 * Inset shadows: top and bottom for depth
 * Border-bottom: 1px solid #62656A (var(--color-gray-medium)) between items
 * Items have same 4px green left border on hover/active
 *
 * Implementation: Accordion-style submenu that expands under parent items
 * Matches Gatsby's .is-accordion-submenu styling exactly
 */
export const MobileMenuSubmenu: Story = {
  render: () => (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .story-mobile-submenu-link {
              position: relative;
            }
            .story-mobile-submenu-link::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 4px;
              background-color: transparent;
              transition: background-color 0.3s ease;
            }
            .story-mobile-submenu-link:hover::before,
            .story-mobile-submenu-link.active::before {
              background-color: #4acf52;
            }
          `,
        }}
      />
      <div className="bg-[#1E2024] p-8">
        {/* Parent Item */}
        <div className="mb-0">
          <button className="flex w-full items-center justify-between border-b border-[#292c31] px-8 py-4 text-left text-[0.6875rem] font-bold text-white uppercase">
            <span>Ploegen</span>
            <span className="text-xs">▼</span>
          </button>
        </div>

        {/* Submenu (Expanded) */}
        <div
          className="m-0 list-none bg-[#292c31] p-0"
          style={{
            boxShadow:
              "inset 0 7px 9px -7px #1E2024, inset 0 -7px 9px -7px #1E2024",
          }}
        >
          <ul className="m-0 list-none p-0">
            <li>
              <a
                href="#"
                className="story-mobile-submenu-link block border-b border-[#62656A] px-8 py-4 text-[0.6875rem] font-bold text-white uppercase no-underline"
              >
                A-Ploeg
              </a>
            </li>
            <li>
              <a
                href="#"
                className="story-mobile-submenu-link active text-kcvv-green-bright block border-b border-[#62656A] px-8 py-4 text-[0.6875rem] font-bold uppercase no-underline"
              >
                B-Ploeg
              </a>
            </li>
            <li>
              <a
                href="#"
                className="story-mobile-submenu-link block border-b border-[#62656A] px-8 py-4 text-[0.6875rem] font-bold text-white uppercase no-underline"
              >
                U21
              </a>
            </li>
            <li>
              <a
                href="#"
                className="story-mobile-submenu-link block border-b border-[#62656A] px-8 py-4 text-[0.6875rem] font-bold text-white uppercase no-underline"
              >
                U19
              </a>
            </li>
          </ul>
        </div>

        <p className="mt-4 text-xs text-white opacity-75">
          Submenu accordion with darker background (#292c31 - dark gray) and
          inset shadows. &quot;B-Ploeg&quot; is active with green text and 4px
          left border.
        </p>
      </div>
    </>
  ),
  globals: {
    viewport: { value: "mobile1" },
  },
};
