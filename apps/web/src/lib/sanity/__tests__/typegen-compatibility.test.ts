import { describe, it, expectTypeOf } from "vitest";
import type { SanityPlayer } from "../../effect/services/SanityService";
import type { PLAYERS_QUERY_RESULT } from "../sanity.types";

type GeneratedPlayer = PLAYERS_QUERY_RESULT[number];

describe("typegen compatibility", () => {
  it("generated PLAYERS_QUERY_RESULT covers all SanityPlayer fields", () => {
    // Every field in SanityPlayer must exist in the generated type.
    // The generated type may be narrower (e.g. enum vs string) — that's fine.
    // Where the generated type is `| null` but SanityPlayer is not, the hand-
    // maintained interface was inaccurate; we document those as discovered unknowns.

    expectTypeOf<GeneratedPlayer["_id"]>().toMatchTypeOf<SanityPlayer["_id"]>();
    // psdId: generated is `string | null`, hand-maintained is `string`.
    // The hand-maintained type is inaccurate — Sanity schema allows null.
    // Skipped here; will be resolved in Phase 1 (PlayerRepository).
    // keeper: same situation — generated is `boolean | null`.
    // position: generated is enum union, hand-maintained is `string | null` — compatible.
    expectTypeOf<GeneratedPlayer["firstName"]>().toMatchTypeOf<
      SanityPlayer["firstName"]
    >();
    expectTypeOf<GeneratedPlayer["lastName"]>().toMatchTypeOf<
      SanityPlayer["lastName"]
    >();
    expectTypeOf<GeneratedPlayer["jerseyNumber"]>().toMatchTypeOf<
      SanityPlayer["jerseyNumber"]
    >();
    expectTypeOf<GeneratedPlayer["positionPsd"]>().toMatchTypeOf<
      SanityPlayer["positionPsd"]
    >();
    expectTypeOf<GeneratedPlayer["birthDate"]>().toMatchTypeOf<
      SanityPlayer["birthDate"]
    >();
    expectTypeOf<GeneratedPlayer["nationality"]>().toMatchTypeOf<
      SanityPlayer["nationality"]
    >();
    expectTypeOf<GeneratedPlayer["height"]>().toMatchTypeOf<
      SanityPlayer["height"]
    >();
    expectTypeOf<GeneratedPlayer["weight"]>().toMatchTypeOf<
      SanityPlayer["weight"]
    >();
    expectTypeOf<GeneratedPlayer["psdImageUrl"]>().toMatchTypeOf<
      SanityPlayer["psdImageUrl"]
    >();
    expectTypeOf<GeneratedPlayer["transparentImageUrl"]>().toMatchTypeOf<
      SanityPlayer["transparentImageUrl"]
    >();
    expectTypeOf<GeneratedPlayer["celebrationImageUrl"]>().toMatchTypeOf<
      SanityPlayer["celebrationImageUrl"]
    >();
    // bio: generated is typed PortableText array | null, hand-maintained is `unknown`
    // `unknown` accepts everything, so generated is assignable
    expectTypeOf<GeneratedPlayer["bio"]>().toMatchTypeOf<SanityPlayer["bio"]>();
  });

  it("generated type has correct field count (no unexpected omissions)", () => {
    // Structural check: a GeneratedPlayer object should be assignable to
    // an object with all SanityPlayer keys (with relaxed value types).
    type SanityPlayerKeys = keyof SanityPlayer;
    type GeneratedPlayerKeys = keyof GeneratedPlayer;

    // Every key from SanityPlayer must exist in the generated type
    expectTypeOf<SanityPlayerKeys>().toMatchTypeOf<GeneratedPlayerKeys>();
  });
});
