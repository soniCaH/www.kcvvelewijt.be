"use client";

/**
 * ArticleFooter Component
 * Related content section with green background
 * Matches Gatsby visual: bright green bg, white text, grid layout, content type icons
 */

import Link from "next/link";
import { Icon } from "@/components/design-system";
import { Newspaper, User, Users, Activity } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export interface RelatedContent {
  /**
   * Content title
   */
  title: string;
  /**
   * URL path
   */
  href: string;
  /**
   * Content type
   */
  type: "article" | "player" | "staff" | "team";
}

export interface ArticleFooterProps {
  /**
   * Related content items
   */
  relatedContent: RelatedContent[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

const contentTypeIcons = {
  article: Newspaper,
  player: User,
  staff: Users,
  team: Activity,
};

/**
 * Article footer with related content
 *
 * Visual specifications (matching Gatsby):
 * - Background: Bright green (#4acf52)
 * - Padding: 1rem 0.75rem 50px (mobile) / 1rem 0 50px (desktop)
 * - Margin-top: 1rem
 * - Margin-bottom: -125px (overlaps next section)
 * - Max-width: 70rem
 * - Heading: Uppercase, white text
 * - Grid: 3 columns on desktop (60rem+), masonry if supported
 * - Links: White with underline on hover
 * - Icons: Dark green circle background, white icons
 */
export const ArticleFooter = ({
  relatedContent,
  className,
}: ArticleFooterProps) => {
  if (!relatedContent || relatedContent.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-kcvv-green-bright mt-4", "py-6", className)}>
      <section className="max-w-inner-lg mx-auto w-full px-3 lg:px-0">
        <h3 className="mb-4 text-white uppercase">Gerelateerde inhoud</h3>

        <div
          className={cn(
            "grid gap-4",
            relatedContent.length === 1
              ? "grid-cols-1"
              : "grid-cols-1 lg:grid-cols-3",
          )}
        >
          {relatedContent.map((item, index) => (
            <article
              key={index}
              className={cn(
                "flex items-start gap-2",
                relatedContent.length === 1 && "lg:col-span-3",
              )}
            >
              {/* Content type icon */}
              <div className="bg-kcvv-green-dark flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm text-white">
                <Icon icon={contentTypeIcons[item.type]} size="xs" />
              </div>

              {/* Link */}
              <Link
                href={item.href}
                className="relative flex-1 break-words text-white transition-all duration-400"
                style={{
                  color: "#FFF",
                  textDecoration: "underline",
                  textDecorationColor: "transparent",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "3px",
                  transition: "text-decoration-color 0.4s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecorationColor = "#FFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecorationColor = "transparent";
                }}
              >
                {item.title}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
