import { Effect, Layer, ManagedRuntime } from "effect";
import { DrupalService, DrupalServiceLive } from "./services/DrupalService";
import { BffService, BffServiceLive } from "./services/BffService";
import { SanityService, SanityServiceLive } from "./services/SanityService";

export const AppLayer = Layer.mergeAll(
  DrupalServiceLive,
  BffServiceLive,
  SanityServiceLive,
);
export const runtime = ManagedRuntime.make(AppLayer);

export const runPromise = <A, E>(
  effect: Effect.Effect<A, E, DrupalService | BffService | SanityService>,
) => runtime.runPromise(effect);

export const runPromiseWithLogging = <A, E>(
  effect: Effect.Effect<A, E, DrupalService | BffService | SanityService>,
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

export { DrupalService, BffService, SanityService };
