import { proxyFormGet } from "@/lib/server/form-proxy";

// Fresh on every call, and not ISR: a route handler with `force-dynamic`
// writes nothing to the ISR cache, which Vercel Hobby caps (#3812).
export const dynamic = "force-dynamic";

/**
 * Spots left for EK Darts, counted live from Sanity by the BFF. The page is
 * static; its signup block reads this once on mount.
 */
export const GET = () => proxyFormGet("/forms/darts/spots", "Darts spots API");
