/**
 * The search lanes' response parsers (#3878). Plain functions: a body that does
 * not match is `null`, never a throw.
 *
 * Client code loads this module with `import("@/lib/search/search-decoders")`
 * next to its request, never with a static import: it pulls `effect` and the
 * contract's schemas in, and a static import would put them in the First Load JS
 * of `/zoeken` and `/hulp`. A failed chunk load rejects that `import()`, which
 * the caller's `catch` turns into its error state.
 */
import { Option, Schema as S } from "effect";
import { SearchResponse, TeamGuessResponse } from "@kcvv/api-contract";
import { LexicalSearchResponse } from "@/types/search";

const decodeLexical = S.decodeUnknownOption(LexicalSearchResponse);
const decodeSemantic = S.decodeUnknownOption(SearchResponse);
const decodeGuess = S.decodeUnknownOption(TeamGuessResponse);

/** `GET /api/search`: the site's own title search. */
export const decodeLexicalSearchResponse = (body: unknown) =>
  Option.getOrNull(decodeLexical(body));

/** `POST /api/search`: the BFF's semantic search. */
export const decodeSemanticSearchResponse = (body: unknown) =>
  Option.getOrNull(decodeSemantic(body));

/** `POST /api/search/team-guess`. */
export const decodeTeamGuess = (body: unknown) =>
  Option.getOrNull(decodeGuess(body));
