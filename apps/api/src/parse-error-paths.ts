import { ParseResult } from "effect";

/**
 * The failing paths of a decode, never its message: a ParseError message
 * embeds the offending value, which here can be a captain's name or e-mail.
 */
export const parseErrorPaths = (error: ParseResult.ParseError): string =>
  ParseResult.ArrayFormatter.formatErrorSync(error)
    .map((issue) => issue.path.join(".") || "(root)")
    .join(", ");
