/**
 * Shared edge-fade width for the "control" register's scroll cues
 * (`<ScrollOverlay>`, `<ScrollRail>`). Both pass this as `useScrollHint`'s
 * `maxRemainingPx` rather than clamping `remainingLeft`/`remainingRight` at
 * the call site — that way the hook's own capped output already matches the
 * fade's rendered width, and stops changing (so the consumer stops
 * re-rendering) once the fade has reached full width. Declared once; do not
 * re-declare a duplicate constant at either call site (#2860).
 */
export const MAX_FADE_PX = 24;
