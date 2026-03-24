import { Effect, Layer, ManagedRuntime } from "effect";
import { BffService, BffServiceLive } from "./services/BffService";
import { SanityService, SanityServiceLive } from "./services/SanityService";
import {
  PlayerRepository,
  PlayerRepositoryLive,
} from "../repositories/player.repository";

export const AppLayer = Layer.mergeAll(
  BffServiceLive,
  SanityServiceLive,
  PlayerRepositoryLive,
);
export const runtime = ManagedRuntime.make(AppLayer);

export const runPromise = <A, E>(
  effect: Effect.Effect<A, E, BffService | SanityService | PlayerRepository>,
) => runtime.runPromise(effect);

export const runPromiseWithLogging = <A, E>(
  effect: Effect.Effect<A, E, BffService | SanityService | PlayerRepository>,
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

export { BffService, SanityService, PlayerRepository };
