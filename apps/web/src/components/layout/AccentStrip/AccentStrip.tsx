/**
 * AccentStrip
 * A 3px kcvv-green decorative bar pinned to the top of the viewport.
 * Sits above the sticky nav (z-[51] > nav z-50).
 * Purely decorative — hidden from screen readers.
 */
export const AccentStrip = () => (
  <div
    aria-hidden="true"
    className="bg-kcvv-green-bright fixed top-0 right-0 left-0 z-[51] h-[3px]"
  />
);
