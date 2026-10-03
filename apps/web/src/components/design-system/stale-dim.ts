/**
 * Stale content while its replacement loads (#3396, #3380, #3399): half opacity
 * at the Chrome speed (`150ms`, `ease-out`) after a 150 ms delay, the same delay
 * as the waiting device, so a fast answer shows neither. Apply it only while
 * stale: removing it makes the arrival an instant swap back to full opacity.
 * No `motion-reduce` opt-out: opacity is not travel (Reduced-Motion Rule).
 * Keep it a full literal: Tailwind's scanner has to see it.
 */
export const STALE_DIM =
  "opacity-50 transition-opacity delay-150 duration-150 ease-out";
