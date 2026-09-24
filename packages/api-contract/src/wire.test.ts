import { describe, it, expect } from "vitest";
import { Arbitrary, FastCheck as fc, Option, Schema as S } from "effect";
import { HttpApi } from "@effect/platform";
import * as Contract from "./index";
import { PsdApi } from "./api";

/**
 * The BFF seam, as a fast test (#3144). A value is encoded by one side, sent
 * through JSON, and decoded by the other — the producer (`apps/api`) sends
 * responses and errors, the consumer (`apps/web`) sends payloads, paths and
 * query params. Both sides use these same schemas, so a value that does not
 * survive `encode → JSON → decode` is a page that breaks. Red means the wire
 * is wrong.
 */
type AnySchema = S.Schema.AnyNoContext;

const toWire = (schema: AnySchema, value: unknown): unknown =>
  JSON.parse(JSON.stringify(S.encodeSync(schema)(value)));

// The receiving side must decode what arrived, and sending it on again must
// give the same wire. Compared on the wire, not with `toEqual` on the value:
// JSON sends `-0` as `0`, and the contract treats those as the same number.
const roundTrip = (schema: AnySchema, value: unknown) => {
  const wire = toWire(schema, value);
  expect(toWire(schema, S.decodeUnknownSync(schema)(wire))).toEqual(wire);
};

const assertRoundTrips = (schema: AnySchema) =>
  fc.assert(
    fc.property(Arbitrary.make(schema), (value) => roundTrip(schema, value)),
  );

// Read off the API definition, so a new endpoint is covered without touching
// this file — including the inline success, path and query schemas no export
// names. Error classes are all exported, so the sweep below covers them; the
// platform's own 400 (`HttpApiDecodeError`) is not ours and is left out.
const producerSends: Array<[string, AnySchema]> = [];
const consumerSends: Array<[string, AnySchema]> = [];
HttpApi.reflect(PsdApi, {
  onGroup() {},
  onEndpoint({ endpoint, successes }) {
    for (const [status, { ast }] of successes)
      Option.map(ast, (a) =>
        producerSends.push([`${endpoint.name} ${status}`, S.make(a)]),
      );
    for (const [part, schema] of [
      ["payload", endpoint.payloadSchema],
      ["path", endpoint.pathSchema],
      ["urlParams", endpoint.urlParamsSchema],
    ] as const)
      Option.map(schema, (s) =>
        consumerSends.push([`${endpoint.name} ${part}`, S.make(s.ast)]),
      );
  },
});

// Every exported schema too — the nested ones and the error classes.
const exported = Object.entries(Contract).filter(([, value]) =>
  S.isSchema(value),
) as Array<[string, AnySchema]>;

describe("the BFF wire round-trips every api-contract schema", () => {
  it.each(producerSends)(
    "producer encodes, consumer decodes: %s",
    (_, schema) => assertRoundTrips(schema),
  );

  it.each(consumerSends)(
    "consumer encodes, producer decodes: %s",
    (_, schema) => assertRoundTrips(schema),
  );

  it.each(exported)("exported schema: %s", (_, schema) =>
    assertRoundTrips(schema),
  );
});

describe("a wire-shape change fails the round-trip", () => {
  it("fails on a field JSON turns into another type", () => {
    // `encode` leaves the Date object as it is; JSON turns it into a string,
    // and `DateFromSelf` on the other side rejects a string.
    expect(() =>
      assertRoundTrips(S.Struct({ kickoff: S.DateFromSelf })),
    ).toThrow();
  });

  it("fails on a number JSON cannot carry", () => {
    // JSON has no NaN or Infinity: both arrive as `null`. This is why the
    // contract uses `S.Finite`, not `S.Number`.
    expect(() =>
      roundTrip(S.Struct({ n: S.Number }), { n: Number.NaN }),
    ).toThrow();
  });
});
