"use client";

/**
 * SkipLink Component
 *
 * Provides a "skip to content" link for keyboard users.
 * Appears when focused via Tab key, hidden visually otherwise.
 *
 * Features:
 * - Only visible when focused (keyboard navigation)
 * - Jumps to main content area
 * - Meets WCAG 2.1 Level A requirement
 * - Fixed positioning for consistent placement
 *
 * Accessibility:
 * - First focusable element on page
 * - Clear, descriptive label
 * - High contrast colors
 * - Large enough for easy interaction
 */

export interface SkipLinkProps {
  targetId: string;
  label?: string;
  className?: string;
}

/**
 * Render a skip link that appears when focused via keyboard navigation
 *
 * @param targetId - ID of the element to skip to (e.g., "main-content")
 * @param label - Text label for the link (default: "Ga naar hoofdinhoud")
 * @param className - Additional CSS classes
 */
export function SkipLink({
  targetId,
  label = "Ga naar hoofdinhoud",
  className = "",
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`bg-kcvv-green-bright focus:ring-kcvv-green fixed top-4 left-4 z-[9999] -translate-y-24 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:ring-4 focus:ring-offset-2 focus:outline-none ${className} `}
    >
      {label}
    </a>
  );
}
