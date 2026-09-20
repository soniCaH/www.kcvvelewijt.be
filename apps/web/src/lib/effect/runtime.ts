import { Effect, Layer, ManagedRuntime } from "effect";
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
) => runtime.runPromise(effect);

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
