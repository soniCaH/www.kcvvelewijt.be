import { BFF_KEY_HEADER } from "@kcvv/api-contract";

/**
 * The header the BFF worker requires on every request (#3485), or
 * `undefined` when `BFF_SHARED_SECRET` is unset. Each caller decides what a
 * missing secret means for it.
 */
export const bffKeyHeader = (): Record<string, string> | undefined => {
  const key = process.env.BFF_SHARED_SECRET?.trim();
  return key ? { [BFF_KEY_HEADER]: key } : undefined;
};
