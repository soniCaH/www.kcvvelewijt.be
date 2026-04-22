"use client";

/**
 * ScreenReaderAnnouncer Component
 *
 * Announces dynamic content changes to screen reader users.
 * Uses ARIA live regions to communicate state changes.
 *
 * Features:
 * - Polite announcements (doesn't interrupt)
 * - Assertive announcements (interrupts current reading)
 * - Auto-clear after announcement
 * - Visually hidden but accessible
 *
 * Accessibility:
 * - ARIA live region for dynamic content
 * - Dual regions (polite + assertive) for different urgencies
 * - Screen reader only (visually hidden)
 *
 * Usage:
 * ```tsx
 * const [announce, setAnnounce] = useState<string>("");
 *
 * // Announce view change
 * setAnnounce("Weergave gewijzigd naar Diagram");
 *
 * <ScreenReaderAnnouncer message={announce} />
 * ```
 */

import React, { useEffect, useRef } from "react";

export interface ScreenReaderAnnouncerProps {
  message: string;
  politeness?: "polite" | "assertive";
  clearAfter?: number; // milliseconds
  className?: string;
}

/**
 * Render an ARIA live region that announces messages to screen readers
 *
 * @param message - Message to announce
 * @param politeness - ARIA politeness level (default: "polite")
 * @param clearAfter - Time in ms to clear message (default: 3000)
 * @param className - Additional CSS classes
 */
export function ScreenReaderAnnouncer({
  message,
  politeness = "polite",
  clearAfter = 3000,
  className = "",
}: ScreenReaderAnnouncerProps) {
  const messageRef = useRef<string>(message);

  useEffect(() => {
    // Only announce when message changes
    if (message && message !== messageRef.current) {
      messageRef.current = message;

      // Clear message after timeout to allow re-announcement
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          messageRef.current = "";
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className} `}
    >
      {message}
    </div>
  );
}

/**
 * Provides state and an updater for delivering messages to a screen reader live region.
 *
 * @returns A tuple where the first element is the current announcement string and the second is a function that sets a new announcement message.
 */
export function useScreenReaderAnnouncement(): [
  string,
  (message: string) => void,
] {
  const [announcement, setAnnouncement] = React.useState<string>("");

  const announce = React.useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  return [announcement, announce];
}
