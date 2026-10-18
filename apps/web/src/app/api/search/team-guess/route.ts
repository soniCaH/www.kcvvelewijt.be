/**
 * POST /api/search/team-guess — the `/hulp` team card's AI fallback (#3559),
 * proxied to the BFF's `/search/team-guess`. Body `{ query, ages }`, answer
 * `{ age: string | null }`.
 */

import type { NextRequest } from "next/server";
import { proxyPostToBff } from "@/lib/server/bff-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxyPostToBff(request, "/search/team-guess");
}
