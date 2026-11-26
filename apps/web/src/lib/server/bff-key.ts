import { BFF_KEY_HEADER } from "@kcvv/api-contract";

/**
 * The header the BFF worker requires on every request (#3485), built from the
 * decoded `BFF_SHARED_SECRET` (`readBffEnv`).
 */
export const bffKeyHeader = (secret: string): Record<string, string> => ({
  [BFF_KEY_HEADER]: secret,
});
