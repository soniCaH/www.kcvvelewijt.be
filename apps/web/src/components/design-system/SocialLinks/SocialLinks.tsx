"use client";

/**
 * SocialLinks Component
 * Social media links with icon buttons
 * Supports different variants: circle (footer), inline (mobile menu), etc.
 */

import { Icon } from "@/components/design-system";
import { Facebook, Twitter, Instagram } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export interface SocialLinksProps {
  /**
   * Visual variant
   * - circle: Circular buttons with borders (footer style)
   * - inline: Simple inline links (mobile menu style)
   */
  variant?: "circle" | "inline";
  /**
   * Size of icons
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Layout direction
   */
  direction?: "horizontal" | "vertical";
}

const socialLinks = [
  {
    name: "Facebook",
    url: "https://facebook.com/KCVVElewijt/",
    icon: Facebook,
  },
  {
    name: "Twitter",
    url: "https://twitter.com/kcvve",
    icon: Twitter,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/kcvve",
    icon: Instagram,
  },
];

/**
 * Social media links component with multiple variants
 *
 * Visual specifications (matching Gatsby):
 * - Circle variant: 24/32/40px circles, 2px gray border, green hover
 * - Icon sizes: 16px (xs) for sm, 20px (sm) for md, 24px (md) for lg
 * - Hover: Border color changes to green bright
 */
export const SocialLinks = ({
  variant = "circle",
  size = "md",
  className,
  direction = "horizontal",
}: SocialLinksProps) => {
  if (variant === "circle") {
    // Size configurations for circle variant
    const sizeClasses = {
      sm: {
        container: "w-6 h-6", // 24px circle
        iconSize: "xs" as const, // 16px icon
      },
      md: {
        container: "w-8 h-8", // 32px circle (default)
        iconSize: "sm" as const, // 20px icon
      },
      lg: {
        container: "w-10 h-10", // 40px circle
        iconSize: "md" as const, // 24px icon
      },
    };

    const sizeConfig = sizeClasses[size];

    return (
      <ul
        className={cn(
          "flex list-none m-0 p-0",
          direction === "horizontal" ? "flex-row gap-3" : "flex-col gap-2",
          className,
        )}
      >
        {socialLinks.map((link) => (
          <li key={link.name}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className={cn(
                "flex items-center justify-center rounded-full",
                "border-2 border-[#787C80] text-white",
                "transition-all duration-300 hover:border-kcvv-green-bright",
                sizeConfig.container,
              )}
            >
              <Icon icon={link.icon} size={sizeConfig.iconSize} />
            </a>
          </li>
        ))}
      </ul>
    );
  }

  // Inline variant (for mobile menu)
  return (
    <div
      className={cn(
        "flex",
        direction === "horizontal" ? "flex-row gap-4" : "flex-col gap-2",
        className,
      )}
    >
      {socialLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          className="p-3 text-white hover:text-kcvv-green-bright transition-colors"
        >
          <Icon icon={link.icon} size={size} />
        </a>
      ))}
    </div>
  );
};
