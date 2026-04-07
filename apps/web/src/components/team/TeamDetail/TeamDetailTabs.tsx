"use client";

/**
 * TeamDetailTabs — Client tab switcher for the team detail page
 *
 * Wraps `BrandedTabs` with URL state synchronization (`?tab=…`) so
 * deep-linking and browser back/forward navigation work. Each tab's
 * content is passed as a pre-rendered React node from the parent
 * server component, so server-side data fetching can run before this
 * client island ever mounts.
 */

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  BrandedTabs,
  type BrandedTab,
} from "@/components/design-system/BrandedTabs";

export interface TeamDetailTabPanel {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TeamDetailTabsProps {
  /** Tabs in display order. Only tabs with content should be passed in. */
  panels: TeamDetailTabPanel[];
  /** Tab to show when no `?tab=` query param is set */
  defaultTabId: string;
  /** Query parameter name (default: `tab`) */
  paramName?: string;
}

export function TeamDetailTabs({
  panels,
  defaultTabId,
  paramName = "tab",
}: TeamDetailTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const validIds = useMemo(() => panels.map((p) => p.id), [panels]);
  const requestedTab = searchParams.get(paramName);
  const activeTabId =
    requestedTab && validIds.includes(requestedTab)
      ? requestedTab
      : defaultTabId;

  const tabs: BrandedTab[] = useMemo(
    () => panels.map((p) => ({ id: p.id, label: p.label })),
    [panels],
  );

  const handleTabChange = useCallback(
    (id: string) => {
      if (id === activeTabId) return;
      const params = new URLSearchParams(searchParams.toString());
      if (id === defaultTabId) {
        params.delete(paramName);
      } else {
        params.set(paramName, id);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [activeTabId, defaultTabId, paramName, pathname, router, searchParams],
  );

  const activePanel = panels.find((p) => p.id === activeTabId) ?? panels[0];

  return (
    <>
      <BrandedTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        ariaLabel="Team detail secties"
        className="mb-8"
      />
      <div role="tabpanel" aria-labelledby={activePanel?.id}>
        {activePanel?.content}
      </div>
    </>
  );
}
