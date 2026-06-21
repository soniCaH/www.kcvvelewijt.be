import { NextResponse } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidatePath, revalidateTag } from "next/cache";
import { SANITY_TAGS } from "@/lib/sanity/cache-tags";

/**
 * Sanity → Next.js on-demand revalidation (issue #1921, Scope E). A Sanity
 * webhook POSTs here on publish/delete; we verify its HMAC signature and
 * revalidate the affected paths + content tags so editor changes appear
 * immediately despite the long ISR intervals (Scope A) and tagged repo caches
 * (Scope B).
 *
 * The webhook itself is configured by hand in the Sanity console — see the
 * issue's "Scope E manual step" for the exact URL / projection / secret.
 */

interface WebhookBody {
  _type?: string;
  /** Current `slug.current` from the webhook projection. */
  slug?: string;
  /** Previous slug on a rename (`before().slug.current`), if projected. */
  previousSlug?: string;
  /** Player/staff detail pages route by PSD id, not a Sanity slug. */
  psdId?: string | number;
}

/**
 * Maps a document `_type` to the paths + content tags to revalidate. `slugs`
 * holds every slug to bust a detail page for (current + previous, so renames
 * and deletes clear the stale URL too).
 */
function targets(
  type: string,
  slugs: string[],
  psdId: string | undefined,
): { paths: string[]; tags: string[] } | null {
  const detail = (prefix: string) => slugs.map((s) => `${prefix}/${s}`);
  switch (type) {
    case "article":
      return {
        paths: ["/", "/nieuws", ...detail("/nieuws")],
        tags: [SANITY_TAGS.articles],
      };
    case "player":
      // Player + staff detail pages route by psdId, not a Sanity slug.
      return {
        paths: psdId ? [`/spelers/${psdId}`] : [],
        tags: [SANITY_TAGS.players],
      };
    case "team":
      return {
        paths: ["/ploegen", ...detail("/ploegen")],
        tags: [SANITY_TAGS.teams],
      };
    case "staffMember":
      return {
        paths: psdId ? [`/staf/${psdId}`] : [],
        tags: [SANITY_TAGS.staff],
      };
    case "sponsor":
      return { paths: ["/sponsors"], tags: [SANITY_TAGS.sponsors] };
    // The homepage banners read (HOMEPAGE_BANNERS_QUERY) is tagged 'banners'
    // and lives on '/'; it derefs `banner` docs from the `homePage` document,
    // so either type changing must bust it.
    case "homePage":
    case "banner":
      return { paths: ["/"], tags: [SANITY_TAGS.banners] };
    case "page":
      return { paths: detail("/club"), tags: [] };
    case "event":
      return {
        paths: ["/evenementen", ...detail("/evenementen")],
        tags: [],
      };
    case "photoGallery":
      return {
        paths: ["/galerij", ...detail("/galerij")],
        tags: [SANITY_TAGS.galleries],
      };
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Revalidation not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? "";
  if (!(await isValidSignature(rawBody, signature, secret))) {
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 },
    );
  }

  let payload: WebhookBody;
  try {
    payload = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const type = payload._type;
  if (!type) {
    return NextResponse.json(
      { ok: false, error: "Missing _type" },
      { status: 400 },
    );
  }

  const slugs = [
    ...new Set(
      [payload.slug, payload.previousSlug].filter(
        (s): s is string => typeof s === "string" && s.length > 0,
      ),
    ),
  ];
  const psdId = payload.psdId != null ? String(payload.psdId) : undefined;

  const target = targets(type, slugs, psdId);
  if (!target) {
    // Unknown type — ack with 200 so Sanity doesn't retry, but revalidate
    // nothing.
    return NextResponse.json({ ok: true, revalidated: false, type });
  }

  for (const path of target.paths) revalidatePath(path);
  // Next 16 requires a cache-life profile; "max" is the documented value for
  // an on-demand purge from a route handler (updateTag is Server-Action only).
  for (const tag of target.tags) revalidateTag(tag, "max");

  return NextResponse.json({
    ok: true,
    revalidated: true,
    type,
    paths: target.paths,
    tags: target.tags,
  });
}
