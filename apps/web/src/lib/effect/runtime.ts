import { Effect, Layer, ManagedRuntime, Runtime, Cause } from "effect";
import { unstable_rethrow } from "next/navigation";
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
 * `effect/internal/runtime.ts`'s `fiberFailure`). `notFound()` (and
 * `forbidden()`/`unauthorized()`/`redirect()`) throw a plain `Error` whose
 * *only* load-bearing part is a non-standard `.digest` string —
 * `isHTTPAccessFallbackError`/`isRedirectError` in
 * `next/dist/client/components/*` key off exactly that property, which
 * `FiberFailureImpl` drops. A route wrapping `Effect.catchTag("HttpNotFound",
 * () => Effect.sync(() => notFound()))` therefore has its `notFound()` call
 * silently turned into an unrecognised error by the time it reaches
 * `app-render.tsx`'s catch, which falls through to `res.statusCode = 500` —
 * a real 500 where a 404 (soft or hard) was intended.
 *
 * `Cause.squash` unwraps the `FiberFailure` back to the original thrown
 * value; `unstable_rethrow` re-throws that value only when it recognises one
 * of Next's own signals and is a no-op otherwise, so every other failure
 * (a genuine BFF/Sanity error) keeps flowing through as the same
 * `FiberFailure` it always has — `isPermanentBffFailure` and friends, which
 * key off that shape, are unaffected.
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
    if (Runtime.isFiberFailure(error)) {
      unstable_rethrow(Cause.squash(error[Runtime.FiberFailureCauseId]));
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
