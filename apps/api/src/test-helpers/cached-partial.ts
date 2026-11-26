import { Schema as S } from "effect";

/** The `partial` flag on a cached fan-out entry, read back from its stored JSON. */
export const decodeCachedPartial = S.decodeUnknownSync(
  S.parseJson(S.Struct({ partial: S.optional(S.Boolean) })),
);
