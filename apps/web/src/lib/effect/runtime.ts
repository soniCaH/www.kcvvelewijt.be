import { Effect, Layer, ManagedRuntime } from "effect";
import { BffService, BffServiceLive } from "./services/BffService";
import { SanityService, SanityServiceLive } from "./services/SanityService";

export const AppLayer = Layer.mergeAll(BffServiceLive, SanityServiceLive);
export const runtime = ManagedRuntime.make(AppLayer);

export const runPromise = <A, E>(
  effect: Effect.Effect<A, E, BffService | SanityService>,
) => runtime.runPromise(effect);

export const runPromiseWithLogging = <A, E>(
  effect: Effect.Effect<A, E, BffService | SanityService>,
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

export { BffService, SanityService };
