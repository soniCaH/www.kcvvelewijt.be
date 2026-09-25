/**
 * VR determinism helper (#3033 pattern), shared across `<Input>`,
 * `<Textarea>`, `<Select>` — the three atoms whose focus chrome comes from
 * `fieldChrome.ts`.
 *
 * Chromium only paints `:focus` when the frame rendering the page is
 * itself focused/active, not merely when `document.activeElement` is set
 * inside it. An `autoFocus` prop still calls the real DOM `.focus()` (React
 * performs that call imperatively on mount; it never emits the native
 * `autofocus` HTML attribute on a client render), but whether the ring
 * actually paints depends on whether the headless VR worker's page holds
 * real frame focus at screenshot time — an environment property of
 * whichever worker renders a given story, not something a story can force
 * by calling `.focus()` again. See `search-form-vr-focus.ts` for the
 * original write-up of this exact race (#3033).
 *
 * The fix bypasses `:focus` for the VR render entirely: `fieldChrome.ts`
 * carries a `data-[vr-force-ring=true]:` variant mirroring every `focus:`
 * rule, which none of these components ever set themselves. A story's
 * `play` function calls `forceFieldFocusRing` to set the attribute directly
 * on the rendered field, painting the ring from a state the story chooses
 * instead of one dependent on the runner's real frame focus. Storybook-only
 * — a real visitor's `focus:` behaviour is untouched.
 */
export function forceFieldFocusRing(root: ParentNode): void {
  root
    .querySelectorAll<HTMLElement>("input, textarea, select")
    .forEach((el) => el.setAttribute("data-vr-force-ring", "true"));
}
