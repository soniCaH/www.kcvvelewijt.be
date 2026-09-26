/**
 * Shared props-contract guard for `<Input>` / `<Select>` / `<Textarea>`
 * (#3188 — the VR job's axe gate fails the build on `label` /
 * `label-title-only` / `select-name` otherwise).
 *
 * None of the three atoms render their own `<label>`, and nothing stops a
 * consumer from rendering one with no accessible name at all — that's
 * exactly what the 2026-09-25 census measured across ~36 demo stories. This
 * makes `"aria-label"` a required string instead of trusting every caller
 * to remember it, so omitting it fails `type-check` instead of shipping a
 * nameless control.
 *
 * A control that's ALSO paired with an external `<label htmlFor>` (the
 * pattern `MembershipForm` and `SharePage` use) still needs this prop, set
 * to the same text as that visible label — per the accname computation
 * order, an explicit `aria-label` takes precedence over a native
 * label-`for` association, so the two must agree or the AT-announced name
 * silently diverges from what's on screen.
 *
 * A discriminated union (`id` OR `aria-label` OR `aria-labelledby`) was
 * tried first and rejected: TypeScript's `Partial<T>` computes `keyof T` as
 * the *intersection* of a union's member keys, which broke Storybook's
 * `Meta`/`StoryObj` args typing in confusing, unrelated-looking ways. A
 * single required field avoids that entirely.
 */
export interface RequiresAccessibleName {
  "aria-label": string;
}
