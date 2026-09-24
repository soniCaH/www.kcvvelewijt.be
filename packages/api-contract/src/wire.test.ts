import { describe, it, expect } from "vitest";
import {
  Arbitrary,
  FastCheck as fc,
  Option,
  Schema as S,
  SchemaAST as AST,
} from "effect";
import { HttpApi, HttpApiError } from "@effect/platform";
import * as Contract from "./index";
import { PsdApi } from "./api";

/**
 * The BFF seam, as a fast test (#3144). A value is encoded by one side, sent
 * through JSON, and decoded by the other — the producer (`apps/api`) sends
 * responses and errors, the consumer (`apps/web`) sends payloads, paths and
 * query params. Both sides use these same schemas, so a value that does not
 * survive `encode → JSON → decode` is a page that breaks. Red means the wire
 * is wrong.
 *
 * Paths and query params travel as URL strings, not JSON. Their encoded side
 * is a record of strings, which JSON leaves as it is, so for them this checks
 * `decode(encode(x))` only — not URL escaping.
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

/**
 * Every place the encoded side holds a bare `number`. The generated values
 * reach NaN or Infinity only by chance — about half the runs — so this walk
 * is the deterministic guard: JSON has no NaN or Infinity, and a number the
 * wire sends must be refined (`S.Finite`, `S.Int`, `S.between`, …).
 */
const bareNumbers = (
  ast: AST.AST,
  path = "",
  seen = new Set<AST.AST>(),
): Array<string> => {
  if (seen.has(ast)) return [];
  seen.add(ast);
  switch (ast._tag) {
    case "NumberKeyword":
      return [path || "(root)"];
    case "Refinement":
      return AST.isNumberKeyword(ast.from)
        ? []
        : bareNumbers(ast.from, path, seen);
    case "Transformation":
      return bareNumbers(ast.from, path, seen);
    case "Suspend":
      return bareNumbers(ast.f(), path, seen);
    case "Union":
      return ast.types.flatMap((t) => bareNumbers(t, path, seen));
    case "TupleType":
      return [...ast.elements, ...ast.rest].flatMap((e) =>
        bareNumbers(e.type, `${path}[]`, seen),
      );
    case "TypeLiteral":
      return [
        ...ast.propertySignatures.flatMap((p) =>
          bareNumbers(p.type, `${path}.${String(p.name)}`, seen),
        ),
        ...ast.indexSignatures.flatMap((i) =>
          bareNumbers(i.type, `${path}[key]`, seen),
        ),
      ];
    default:
      return [];
  }
};

// The platform adds its own 400 to every endpoint. It is not ours, and its
// issue path can hold a symbol, which JSON cannot carry — so it is left out.
const withoutPlatformError = (ast: AST.AST): Option.Option<AST.AST> => {
  const platform = HttpApiError.HttpApiDecodeError.ast;
  if (ast === platform) return Option.none();
  if (!AST.isUnion(ast)) return Option.some(ast);
  const ours = ast.types.filter((t) => t !== platform);
  return ours.length === 0 ? Option.none() : Option.some(AST.Union.make(ours));
};

// Read off the API definition, so a new endpoint is covered without touching
// this file — including the inline schemas no export names.
const producerSends: Array<[string, AnySchema]> = [];
const consumerSends: Array<[string, AnySchema]> = [];
HttpApi.reflect(PsdApi, {
  onGroup() {},
  onEndpoint({ endpoint, successes, errors }) {
    for (const [status, { ast }] of [...successes, ...errors]) {
      const ours = Option.flatMap(ast, withoutPlatformError);
      if (Option.isSome(ours))
        producerSends.push([`${endpoint.name} ${status}`, S.make(ours.value)]);
    }
    for (const [part, schema] of [
      ["payload", endpoint.payloadSchema],
      ["path", endpoint.pathSchema],
      ["urlParams", endpoint.urlParamsSchema],
    ] as const)
      if (Option.isSome(schema))
        consumerSends.push([
          `${endpoint.name} ${part}`,
          S.make(schema.value.ast),
        ]);
  },
});

// Every exported schema the endpoints above do not already name — the nested
// ones, and any not on an endpoint yet.
const onEndpoint = new Set(
  [...producerSends, ...consumerSends].map(([, s]) => s.ast),
);
const exported = (
  Object.entries(Contract).filter(([, value]) => S.isSchema(value)) as Array<
    [string, AnySchema]
  >
).filter(([, schema]) => !onEndpoint.has(schema.ast));

const all = [...producerSends, ...consumerSends, ...exported];

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

describe("no schema sends a number JSON cannot carry", () => {
  it.each(all)("%s", (_, schema) => {
    expect(bareNumbers(schema.ast)).toEqual([]);
  });
});

describe("a wire-shape change fails the layer", () => {
  it("fails on a field JSON turns into another type", () => {
    // `encode` leaves the Date object as it is; JSON turns it into a string,
    // and `DateFromSelf` on the other side rejects a string.
    expect(() =>
      assertRoundTrips(S.Struct({ kickoff: S.DateFromSelf })),
    ).toThrow(/Expected DateFromSelf/);
  });

  it("fails on a number JSON cannot carry", () => {
    // JSON sends NaN as `null`.
    expect(() =>
      roundTrip(S.Struct({ n: S.Number }), { n: Number.NaN }),
    ).toThrow(/Expected number, actual null/);
  });

  it("finds a bare number every time, at any depth", () => {
    const Drifted = S.Struct({
      ok: S.Finite,
      rows: S.Array(S.Struct({ n: S.optional(S.Number) })),
    });
    expect(bareNumbers(Drifted.ast)).toEqual([".rows[].n"]);
  });
});
