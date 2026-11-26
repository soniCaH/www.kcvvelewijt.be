/**
 * The only place `NEXT_PUBLIC_*` and `NODE_ENV` are read outside the server
 * module (#3879); ESLint bans `process.env` in the rest of `src`. Safe in
 * client code: Next inlines these only when each is written out literally
 * ("dynamic lookups will not be inlined"), so every var is a literal read,
 * never a lookup on `process.env` itself. Keep this a plain module (no
 * `'use client'`): a client file may export components and types only.
 *
 * Deliberately no schema here: every var is an optional string, which cannot
 * fail to decode, and `effect`'s Schema would ship in each client bundle that
 * reads `NODE_ENV`. The one required public var (the Sanity project id) is
 * decoded in `./server`, where the Sanity client lives.
 */
export const readPublicEnv = () => ({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_TYPEKIT_ID: process.env.NEXT_PUBLIC_TYPEKIT_ID,
  NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});
