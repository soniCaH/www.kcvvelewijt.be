import { Effect } from "effect";
import type { DurableKv } from "../cache/kv-cache";

/**
 * A no-op `DurableKv` for the many `KvCacheInterface` mocks scattered across
 * this test tree that only ever exercise get/set/delete/increment (the SWR
 * path) and have no interest in the durable operations added by #2873. Every
 * one of those mocks now needs a `durable` field to satisfy the widened
 * interface — spreading this in keeps each of them a one-line change instead
 * of a hand-rolled implementation nobody in that test actually calls.
 */
export const noopDurableKv: DurableKv = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  setForever: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
  list: () => Effect.succeed({ keys: [], complete: true }),
  forDataset: (dataset) => ({
    get: () => Effect.succeed(null),
    set: () => Effect.succeed(undefined),
    setForever: () => Effect.succeed(undefined),
    delete: () => Effect.succeed(undefined),
    list: () => Effect.succeed({ keys: [], complete: true }),
    dataset,
  }),
};
