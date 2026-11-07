import { draftMode } from "next/headers";

/**
 * Whether this request is in preview mode (an editor's draft-mode cookie, set
 * by `/api/preview/enable`). Visitors never have it. Reading it needs a Next
 * request scope; `fetchGroq` calls it inside its typed-failure wrapper.
 */
export const isPreviewMode = async (): Promise<boolean> =>
  (await draftMode()).isEnabled;
