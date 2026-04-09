"use client";

import { MapPin } from "@/lib/icons";
import { Icon } from "@/components/design-system";
import { trackEvent } from "@/lib/analytics/track-event";

const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Driesstraat+32,+1982+Elewijt";

export const DirectionsLink = () => (
  <a
    href={DIRECTIONS_URL}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => trackEvent("directions_clicked", { source: "footer" })}
    className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-white/70 hover:text-kcvv-green-bright transition-colors"
  >
    <Icon icon={MapPin} size="sm" />
    Routebeschrijving
  </a>
);
