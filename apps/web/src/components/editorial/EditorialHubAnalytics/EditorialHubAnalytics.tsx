"use client";

import { useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";

export interface EditorialHubAnalyticsProps {
  /** Event fired on a card click, e.g. `jeugd_card_click`. */
  eventName: string;
  /** Optional class on the wrapper `<div>` (e.g. layout margin). */
  className?: string;
  children: ReactNode;
}

/**
 * Client analytics shell for an `<EditorialHubCard>` nav-hub grid. Delegates
 * clicks to the data-attributed cards rendered by the (server) grid below — one
 * native listener on the container, not per-card `onClick` — so the cards stay
 * server-rendered. Reusable across the jeugd / club / hulp hubs by passing a
 * different `eventName`.
 *
 * Markers (set by `<EditorialHubCard>`): `data-card-type` (`news`|`nav`),
 * `data-tag`, and `data-article-id-hashed` (news only) → fires
 * `trackEvent(eventName, { card_type, tag, article_id_hashed? })`.
 */
export function EditorialHubAnalytics({
  eventName,
  className,
  children,
}: EditorialHubAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useDelegatedClick(ref, {
    selector: "[data-card-type]",
    onMatch: (card) => {
      const cardType = card.dataset.cardType;
      if (!cardType) return;

      const articleIdHashed = card.dataset.articleIdHashed;
      trackEvent(eventName, {
        card_type: cardType,
        tag: card.dataset.tag ?? "",
        ...(articleIdHashed ? { article_id_hashed: articleIdHashed } : {}),
      });
    },
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
