"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import { setDefaultConsent } from "@/lib/analytics/gtm-consent";

export function GoogleTagManagerLoader({ gtmId }: { gtmId?: string }) {
  if (!gtmId) return null;

  setDefaultConsent();

  return <GoogleTagManager gtmId={gtmId} />;
}
