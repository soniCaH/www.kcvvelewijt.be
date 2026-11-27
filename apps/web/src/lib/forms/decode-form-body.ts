import { Either, Schema as S } from "effect";
import { HttpBadRequest } from "@kcvv/api-contract";

/**
 * What a refused form POST carries: `error` (authored Dutch copy) and, on a 400,
 * the per-field messages. The BFF declares it as `HttpBadRequest` (`HttpServiceUnavailable`
 * is its `error` alone); the Next proxy (`lib/server/form-proxy.ts`) forwards it, and
 * answers `{ ok: false, error }` itself when the BFF is unreachable. Built from the
 * contract's own fields so a change there reaches the forms. `_tag` is the BFF's
 * wire discriminator, not something a form reads.
 */
const FormRefusal = S.Struct(HttpBadRequest.fields).pipe(S.omit("_tag"));

const decodeRefusal = S.decodeUnknownEither(FormRefusal);

/**
 * Decodes a form POST's parsed body (`await response.json().catch(() => null)`)
 * against the endpoint's success schema and the declared refusal. Each half is
 * `undefined` when the body does not match it, so a body that matches neither
 * reads as the generic error the forms already show. Never throws.
 */
export const makeFormBodyDecoder = <A, I>(success: S.Schema<A, I>) => {
  const decodeSuccess = S.decodeUnknownEither(success);
  return (body: unknown) => ({
    success: Either.getOrUndefined(decodeSuccess(body)),
    refusal: Either.getOrUndefined(decodeRefusal(body)),
  });
};
