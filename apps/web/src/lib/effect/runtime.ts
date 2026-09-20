import { Effect, Layer, ManagedRuntime } from "effect";
import { unstable_rethrow } from "next/navigation";
import { squashFiberFailure } from "./classify-bff-failure";
import { BffService, BffServiceLive } from "./services/BffService";
import {
  PlayerRepository,
  PlayerRepositoryLive,
} from "../repositories/player.repository";
import {
  TeamRepository,
  TeamRepositoryLive,
} from "../repositories/team.repository";
import {
  ArticleRepository,
  ArticleRepositoryLive,
} from "../repositories/article.repository";
import {
  SponsorRepository,
  SponsorRepositoryLive,
} from "../repositories/sponsor.repository";
import {
  StaffRepository,
  StaffRepositoryLive,
} from "../repositories/staff.repository";
import {
  HomepageRepository,
  HomepageRepositoryLive,
} from "../repositories/homepage.repository";
import {
  EventRepository,
  EventRepositoryLive,
} from "../repositories/event.repository";
import {
  ResponsibilityRepository,
  ResponsibilityRepositoryLive,
} from "../repositories/responsibility.repository";
import {
  PageRepository,
  PageRepositoryLive,
} from "../repositories/page.repository";
import {
  PhotoGalleryRepository,
  PhotoGalleryRepositoryLive,
} from "../repositories/photoGallery.repository";

const AppLayer = Layer.mergeAll(
  BffServiceLive,
  PlayerRepositoryLive,
  TeamRepositoryLive,
  ArticleRepositoryLive,
  SponsorRepositoryLive,
  StaffRepositoryLive,
  HomepageRepositoryLive,
  EventRepositoryLive,
  ResponsibilityRepositoryLive,
  PageRepositoryLive,
  PhotoGalleryRepositoryLive,
);
const runtime = ManagedRuntime.make(AppLayer);

/**
 * Every route runs its Sanity/BFF reads through here. `E` is pinned to
 * `never`: an effect that reaches this call with an unhandled error channel
 * is a compile error, not a runtime defect discovered in production (#2864).
 * A **section** read must be routed through `degradeSection`
 * (`lib/effect/degrade.ts`) before it gets here; a **subject** read that
 * should take the page down calls `Effect.orDie` itself, at the call site,
 * with a one-line reason (#2433 rule 2/3).
 *
 * **Restores Next's own control-flow signals before they leave Effect-land
 * (#3034).** `ManagedRuntime.runPromise` never rejects with the error a
 * defect actually threw — it rejects with a fresh `FiberFailureImpl` that
 * copies only `message`/`name`/`stack` off the `Cause` (see
 * `effect/internal/runtime.ts`'s `fiberFailure`). `notFound()` throws a plain
 * `Error` whose *only* load-bearing part is a non-standard `.digest`
 * string — `isHTTPAccessFallbackError` in
 * `next/dist/client/components/http-access-fallback` keys off exactly that
 * property, which `FiberFailureImpl` drops. A route wrapping
 * `Effect.catchTag("HttpNotFound", () => Effect.sync(() => notFound()))`
 * therefore has its `notFound()` call silently turned into an unrecognised
 * error by the time it reaches `app-render.tsx`'s catch, which falls through
 * to `res.statusCode = 500` — a real 500 where a 404 (soft or hard) was
 * intended.
 *
 * `squashFiberFailure` unwraps the `FiberFailure` back to the original
 * thrown value; that value is handed to Next's own `unstable_rethrow`
 * (`next/navigation`), the public API for exactly this — a `try/catch`
 * swallowing one of Next's control-flow sentinels.
 *
 * **The actual predicate is wider than "the squashed value is one of Next's
 * signals".** `unstable_rethrow`'s own last two lines are
 * `if (error instanceof Error && 'cause' in error) unstable_rethrow(error.cause)`
 * — it walks the *whole* `.cause` chain, re-throwing on the first match
 * anywhere in it (`isRedirectError` / `isHTTPAccessFallbackError`, or a few
 * other Next-internal signals `unstable_rethrow` also recognises), with no
 * cycle guard. So a genuinely different failure whose `.cause` happens to
 * *wrap* one of Next's sentinels is reclassified as that sentinel too — the
 * outer error's own message/tag is discarded, and this repo has a real
 * carrier for that shape already: `SanityReadError`
 * (`lib/sanity/fetch-groq.ts`) is an `Error` subclass constructed with a
 * `cause` on every instance, so the chain-walk runs on every single Sanity
 * defect that reaches here (today it always bottoms out on a non-Next cause
 * and falls through unchanged — nothing in this repo constructs a
 * self-referencing `cause`, or a `cause` that is itself one of Next's own
 * errors). Deliberately not narrowed to a stricter check of our own: matching
 * `unstable_rethrow`'s actual semantics is correct — reimplementing the
 * `NEXT_HTTP_ERROR_FALLBACK`-style digest matching ourselves would silently
 * drift from Next's own on the next Next upgrade, a worse failure than the
 * latent one this fixes. Every other failure (one whose cause chain, if it
 * has one, never bottoms out on a Next signal) keeps flowing through as the
 * same `FiberFailure` it always has — `isPermanentBffFailure` and friends,
 * which key off that shape, are unaffected.
 *
 * **Only `notFound()` and `redirect()` are pinned by `runtime.test.ts`.**
 * No route in this app throws `forbidden()`/`unauthorized()` through an
 * Effect chain today, so their restoration is not asserted here — it rests
 * entirely on `unstable_rethrow` recognising them the same way, not on
 * anything this module tests or maintains itself.
 */
export const runPromise = <A>(
  effect: Effect.Effect<
    A,
    never,
    | BffService
    | PlayerRepository
    | TeamRepository
    | ArticleRepository
    | SponsorRepository
    | StaffRepository
    | HomepageRepository
    | EventRepository
    | ResponsibilityRepository
    | PageRepository
    | PhotoGalleryRepository
  >,
) =>
  runtime.runPromise(effect).catch((error: unknown) => {
    const squashed = squashFiberFailure(error);
    if (squashed !== undefined) {
      unstable_rethrow(squashed);
    }
    throw error;
  });

export {
  BffService,
  PlayerRepository,
  TeamRepository,
  ArticleRepository,
  SponsorRepository,
  StaffRepository,
  HomepageRepository,
  EventRepository,
  ResponsibilityRepository,
  PageRepository,
  PhotoGalleryRepository,
};
