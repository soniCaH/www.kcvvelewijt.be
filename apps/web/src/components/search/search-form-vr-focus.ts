/**
 * VR determinism helper (#3033).
 *
 * `SearchForm`'s `<input autoFocus>` only paints the
 * `focus-within:ring-warm focus-within:ring-2` ring when the page rendering
 * the story actually holds window/document focus at mount time — the native
 * HTML `autofocus` attribute's focus-taking algorithm is itself gated on
 * that (https://html.spec.whatwg.org/#autofocusing-a-form-associated-element).
 * Under the headless VR runner that is an environment property of whichever
 * worker happens to render a given story, not something the story declares,
 * so the same story produces a ring-present or ring-absent baseline
 * depending on capture timing (#3033).
 *
 * A script-invoked `element.focus()` is not subject to that restriction — it
 * always sets `document.activeElement`, which is what `:focus-within`
 * matches against — so calling it explicitly in a Storybook `play` function
 * pins the ring to a state the story chooses instead of one the runner
 * happens to produce. This never touches `SearchForm`'s own `autoFocus`
 * prop, which keeps firing unaided for a real visitor on `/zoeken`.
 */
export function focusSearchInput(root: ParentNode): void {
  root.querySelector<HTMLInputElement>("input")?.focus();
}
