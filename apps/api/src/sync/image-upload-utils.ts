/**
 * Extract a stable image URL from a PSD profilePictureURL.
 *
 * Strips ephemeral auth params (profileAccessKey) that change on every API call,
 * but retains the photo version param (?v=N) so that version changes trigger
 * re-uploads.
 *
 * @param profilePictureURL - Relative path from PSD (e.g. "/api/v2/members/profilepicture/6453?profileAccessKey=abc&v=1")
 * @param baseUrl - Base URL to prepend (e.g. "https://kcvv.prosoccerdata.com")
 * @returns Absolute stable URL, or null if profilePictureURL is falsy
 */
export function extractStableImageUrl(
  profilePictureURL: string | null,
  baseUrl: string,
): string | null {
  if (!profilePictureURL) return null;

  const path = profilePictureURL.split("?")[0];
  const v = new URLSearchParams(profilePictureURL.split("?")[1] ?? "").get("v");
  return v !== null ? `${baseUrl}${path}?v=${v}` : `${baseUrl}${path}`;
}

/**
 * Determine whether a player image needs to be uploaded to Sanity.
 *
 * Upload is needed when:
 * - There is a new image from PSD (stableUrl is non-null) AND
 * - Either no existing image in Sanity, or the stored URL differs (version change)
 *
 * @param stableUrl - Stable image URL from PSD (output of extractStableImageUrl), or null if no profile picture
 * @param existingPsdImageUrl - Currently stored psdImageUrl in Sanity, or null/undefined if none
 */
export function needsUpload(
  stableUrl: string | null,
  existingPsdImageUrl: string | null | undefined,
): boolean {
  if (!stableUrl) return false;
  return !existingPsdImageUrl || existingPsdImageUrl !== stableUrl;
}
