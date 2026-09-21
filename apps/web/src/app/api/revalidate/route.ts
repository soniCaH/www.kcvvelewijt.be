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
 * The contents page (#2622) lists ploegen, nieuws, evenementen and the
 * editorial clubpagina's, so all four of those types bust it.
 *
 * It is the one index that could not rely on its own `revalidate`: of its four
 * reads only the teams list is tagged, so a deleted article would have left
 * `/inhoud` pointing at a 404 for up to an hour — which is exactly the drift
 * the route exists to prevent.
 */
const CONTENTS = "/inhoud";

/**
 * The hulp finder (#2495) renders every active `responsibility` and resolves
 * each contact through its `organigramNode`, so both types change what that
 * page says. RESPONSIBILITY_PATHS_QUERY carries no tag and the page leans on
 * `revalidate = 3600` alone, so busting the path is the only lever for it.
 */
const HULP = "/hulp";

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
        paths: ["/", "/nieuws", CONTENTS, ...detail("/nieuws")],
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
        paths: ["/ploegen", CONTENTS, ...detail("/ploegen")],
        tags: [SANITY_TAGS.teams],
      };
    case "staffMember":
      return {
        paths: psdId ? [`/staf/${psdId}`] : [],
        tags: [SANITY_TAGS.staff],
      };
    case "sponsor":
      return { paths: ["/sponsors"], tags: [SANITY_TAGS.sponsors] };
    // The homepage read (HOMEPAGE_QUERY — banners + the off-season placeholder,
    // one fetch since #2858) is tagged 'banners' and lives on '/'; it derefs
    // `banner` docs from the `homePage` document, so either type changing
    // must bust it.
    case "homePage":
    case "banner":
      return { paths: ["/"], tags: [SANITY_TAGS.banners] };
    case "page":
      return { paths: [CONTENTS, ...detail("/club")], tags: [] };
    // The homepage's FeaturedEventBand reads the next upcoming event
    // (NEXT_FEATURED_EVENT_QUERY), so publishing one must bust '/' too — that
    // read is untagged, so without this a new event stayed invisible on the
    // homepage until the segment's own 15-minute `revalidate` came round.
    case "event":
      return {
        paths: ["/", "/evenementen", CONTENTS, ...detail("/evenementen")],
        tags: [],
      };
    case "photoGallery":
      return {
        paths: ["/galerij", ...detail("/galerij")],
        tags: [SANITY_TAGS.galleries],
      };
    case "responsibility":
      return { paths: [HULP], tags: [] };
    // An organigram edit also moves the org chart, and that read
    // (ORGANIGRAM_NODES_QUERY, via StaffRepository.findAll) is the one thing
    // carrying the `staff` tag — `/hulp`'s structuur panel and the search
    // index both consume it.
    case "organigramNode":
      return { paths: [HULP], tags: [SANITY_TAGS.staff] };
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
