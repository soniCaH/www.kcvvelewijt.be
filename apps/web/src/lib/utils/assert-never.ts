/**
 * The exhaustiveness escape `apps/web/CLAUDE.md`'s "Discriminated union
 * branching must be exhaustive" rule names — a `default`/`else` branch that
 * calls this instead of falling through silently, so a future union member
 * is a compile error at every `switch`/`if`-chain that narrows on it, not a
 * runtime value nobody wrote a case for.
 *
 * One shared definition (#2802 review) — eight identical copies existed
 * across the codebase before this one.
 */
export const assertNever = (value: never): never => {
  throw new Error(`Unhandled variant: ${String(value)}`);
};
