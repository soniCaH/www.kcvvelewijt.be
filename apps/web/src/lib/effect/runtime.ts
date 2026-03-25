import { Effect, Layer, ManagedRuntime } from "effect";
import { BffService, BffServiceLive } from "./services/BffService";
import { SanityService, SanityServiceLive } from "./services/SanityService";
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

export const AppLayer = Layer.mergeAll(
  BffServiceLive,
  SanityServiceLive,
  PlayerRepositoryLive,
  TeamRepositoryLive,
  ArticleRepositoryLive,
  SponsorRepositoryLive,
  StaffRepositoryLive,
  HomepageRepositoryLive,
);
export const runtime = ManagedRuntime.make(AppLayer);

export const runPromise = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    | BffService
    | SanityService
    | PlayerRepository
    | TeamRepository
    | ArticleRepository
    | SponsorRepository
    | StaffRepository
    | HomepageRepository
  >,
) => runtime.runPromise(effect);

export const runPromiseWithLogging = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    | BffService
    | SanityService
    | PlayerRepository
    | TeamRepository
    | ArticleRepository
    | SponsorRepository
    | StaffRepository
    | HomepageRepository
  >,
) =>
  runtime.runPromise(
    effect.pipe(
      Effect.tapError((error) =>
        Effect.sync(() => {
          console.error("[Effect Error]", error);
        }),
      ),
    ),
  );

export const provideServices = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.provide(effect, AppLayer);

export {
  BffService,
  SanityService,
  PlayerRepository,
  TeamRepository,
  ArticleRepository,
  SponsorRepository,
  StaffRepository,
  HomepageRepository,
};
