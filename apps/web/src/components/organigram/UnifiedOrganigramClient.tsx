"use client";

/**
 * UnifiedOrganigramClient Component
 *
 * Unified interface combining three organigram views into a single tabbed experience:
 * - Card Hierarchy: Collapsible card-based hierarchical view
 * - Interactive Chart: D3-based visual organizational diagram
 * - Responsibility Finder: Help system to find the right contact person
 *
 * Features:
 * - View toggle: Cards, Chart, Verantwoordelijkheden (Responsibilities)
 * - Responsive defaults: Mobile → Cards, Desktop → Chart
 * - Shared state across all views
 * - localStorage preference persistence
 * - User-friendly for ages 6-99 on all devices
 * - Seamless integration with responsibility finder
 * - URL state management for shareable links
 * - Deep linking to specific members
 * - Mobile optimizations: Bottom nav, swipe gestures, lazy loading (Phase 4)
 * - Accessibility: Keyboard navigation, screen reader support (Phase 5)
 */

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutGrid, Network, CircleHelp } from "@/lib/icons";
import { CardHierarchy } from "./card-hierarchy/CardHierarchy";
import { MemberDetailsModal } from "./MemberDetailsModal";
import { FilterTabs } from "../design-system/FilterTabs";
import { UnifiedSearchBar } from "./shared/UnifiedSearchBar";
import { MobileBottomNav } from "./shared/MobileBottomNav";
import { KeyboardShortcuts, SkipLink, ScreenReaderAnnouncer } from "./shared";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useOrganigramAnalytics } from "@/hooks/useOrganigramAnalytics";
import {
  findMemberById,
  buildOrganigramUrl,
  parseOrganigramParams,
} from "@/lib/organigram-utils";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import type { FilterTab } from "../design-system/FilterTabs/FilterTabs";

// Lazy load heavy components for better performance (Phase 4)
const EnhancedOrgChart = lazy(() =>
  import("./chart/EnhancedOrgChart").then((mod) => ({
    default: mod.EnhancedOrgChart,
  })),
);
const ResponsibilityFinder = lazy(() =>
  import("../responsibility/ResponsibilityFinder").then((mod) => ({
    default: mod.ResponsibilityFinder,
  })),
);

type ViewType = "cards" | "chart" | "responsibilities";

export interface UnifiedOrganigramClientProps {
  members: OrgChartNode[];
  responsibilityPaths?: ResponsibilityPath[];
  className?: string;
}

const VIEW_PREFERENCE_KEY = "kcvv-organigram-view-preference";

/**
 * Get initial view based on URL or default (without localStorage to avoid hydration mismatch)
 */
function getInitialView(urlView: string | null): ViewType {
  // URL parameter takes precedence
  if (urlView && ["cards", "chart", "responsibilities"].includes(urlView)) {
    return urlView as ViewType;
  }

  // Default to chart for consistent SSR/CSR
  // localStorage preference will be synced via useEffect after mount
  return "chart";
}

/**
 * Renders a unified organigram UI that lets users switch between cards, chart, and responsibilities views, search members or responsibilities, and inspect member details.
 *
 * Synchronizes the active view and selected member with the URL, persists the user's view preference to localStorage, and supports deep links that open the member details modal.
 *
 * @param members - Organization members used to populate the views and search
 * @param responsibilityPaths - Optional responsibility paths used by the Responsibilities view and search
 * @param className - Optional additional CSS classes applied to the root container
 * @returns The rendered unified organigram React element
 */
export function UnifiedOrganigramClient({
  members,
  responsibilityPaths = [],
  className = "",
}: UnifiedOrganigramClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { trackViewChanged, trackMemberClicked } = useOrganigramAnalytics();

  // Parse URL parameters
  const urlParams = parseOrganigramParams(searchParams);

  // Initialize member from URL if present
  const urlMember = urlParams.memberId
    ? (findMemberById(members, urlParams.memberId) ?? null)
    : null;

  // Initialize view state from URL or preferences
  const [activeView, setActiveView] = useState<ViewType>(() =>
    getInitialView(urlParams.view),
  );
  const [selectedMember, setSelectedMember] = useState<OrgChartNode | null>(
    () => urlMember,
  );
  const [isModalOpen, setIsModalOpen] = useState(() => !!urlMember);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponsibilityId, setSelectedResponsibilityId] = useState<
    string | null
  >(null);
  const [selectedResponsibilityPath, setSelectedResponsibilityPath] =
    useState<ResponsibilityPath | null>(null);

  // Track member to center chart on (when navigating from Responsibility Finder)
  const [centeredMemberId, setCenteredMemberId] = useState<string | null>(null);

  // Track whether initial localStorage sync has occurred
  const hasInitializedRef = useRef(false);

  // Phase 5: Accessibility - Screen reader announcements
  const [announcement, setAnnouncement] = useState("");

  // Sync localStorage preference after mount (avoids hydration mismatch)
  useEffect(() => {
    // Only run once on initial mount
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Only apply localStorage preference if no URL view is set
    if (!urlParams.view) {
      const savedPreference = localStorage.getItem(
        VIEW_PREFERENCE_KEY,
      ) as ViewType | null;

      if (
        savedPreference &&
        ["cards", "chart", "responsibilities"].includes(savedPreference)
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing with localStorage after mount
        setActiveView(savedPreference);
      } else {
        // Apply responsive default on client
        const isMobile = window.matchMedia("(max-width: 1023px)").matches;
        const responsiveDefault = isMobile ? "cards" : "chart";
        if (responsiveDefault !== activeView) {
          setActiveView(responsiveDefault);
        }
      }
    }
  }, [urlParams.view, activeView]);

  // Sync state with URL changes (for browser back/forward navigation)
  useEffect(() => {
    const currentParams = parseOrganigramParams(searchParams);

    // Update view if it changed in the URL
    if (currentParams.view && currentParams.view !== activeView) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing with URL changes for browser navigation
      setActiveView(currentParams.view as ViewType);
    }

    // Update selected member if it changed in the URL
    const newMember = currentParams.memberId
      ? (findMemberById(members, currentParams.memberId) ?? null)
      : null;

    if (newMember?.id !== selectedMember?.id) {
      setSelectedMember(newMember);
      setIsModalOpen(!!newMember);
    }
  }, [searchParams, members, activeView, selectedMember]);

  // Update URL when view or member changes (triggers re-render via router)
  const updateUrl = (options: {
    view?: ViewType;
    memberId?: string | null;
  }) => {
    // Preserve current member when memberId is undefined, allow null to explicitly clear
    const memberIdToUse =
      options.memberId === undefined
        ? (selectedMember?.id ?? null)
        : options.memberId;

    const newUrl = buildOrganigramUrl("/club/organigram", {
      view: options.view || activeView,
      memberId: memberIdToUse,
    });
    router.push(newUrl, { scroll: false });
  };

  // Update URL silently without triggering React re-renders
  // Uses replaceState to update browser URL for sharing/bookmarking
  // without causing Next.js navigation that would reset chart state
  const updateUrlSilently = (options: { memberId?: string | null }) => {
    const newUrl = buildOrganigramUrl("/club/organigram", {
      view: activeView,
      memberId: options.memberId ?? null,
    });
    window.history.replaceState(null, "", newUrl);
  };

  // Handle view change
  const handleViewChange = (
    view: string,
    source: "tab" | "swipe" | "keyboard" = "tab",
  ) => {
    const newView = view as ViewType;
    if (newView === activeView) return;
    setActiveView(newView);
    localStorage.setItem(VIEW_PREFERENCE_KEY, newView);
    updateUrl({ view: newView });
    trackViewChanged(newView, source);

    // Clear selected responsibility when switching away from responsibilities view
    if (newView !== "responsibilities") {
      setSelectedResponsibilityId(null);
      setSelectedResponsibilityPath(null);
    }

    // Phase 5: Announce view change to screen readers
    const viewLabels = {
      cards: "Overzicht",
      chart: "Diagram",
      responsibilities: "Hulp",
    };
    setAnnouncement(
      `Weergave gewijzigd naar ${viewLabels[newView as ViewType]}`,
    );
  };

  // Handle member click from any view
  // Uses silent URL update to preserve chart state while enabling URL sharing
  const handleMemberClick = (member: OrgChartNode) => {
    trackMemberClicked(member, activeView);
    setSelectedMember(member);
    setIsModalOpen(true);
    updateUrlSilently({ memberId: member.id });
  };

  // Handle close modal
  // Uses silent URL update to preserve chart state
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
    setCenteredMemberId(null); // Clear centering after modal closes
    updateUrlSilently({ memberId: null });
  };

  // Handle deep linking from Responsibility Finder
  const handleResponsibilityMemberSelect = (memberId: string) => {
    const member = findMemberById(members, memberId);
    if (member) {
      // Switch to chart view for better visualization
      const bestView: ViewType = "chart";
      setActiveView(bestView);
      setSelectedMember(member);
      setIsModalOpen(true);

      // Set the member to center on in the chart
      setCenteredMemberId(member.id);

      // Use replaceState to update URL without triggering re-renders
      // The chart will mount fresh when switching views, so no state to preserve
      const newUrl = buildOrganigramUrl("/club/organigram", {
        view: bestView,
        memberId: member.id,
      });
      window.history.replaceState(null, "", newUrl);

      // NOTE: Intentionally NOT updating localStorage here
      // Deep-link navigation temporarily shows chart view for better visualization,
      // but preserves the user's explicit view preference (set via handleViewChange)
    }
  };

  // Handle navigation to responsibility view from member details modal
  const handleViewResponsibility = (responsibilityId: string) => {
    // Close modal and switch to responsibilities view
    setIsModalOpen(false);
    setSelectedMember(null);
    setActiveView("responsibilities");

    // Use replaceState to update URL without triggering re-renders
    const newUrl = buildOrganigramUrl("/club/organigram", {
      view: "responsibilities",
      memberId: null,
    });
    window.history.replaceState(null, "", newUrl);

    // Set the responsibility to highlight
    setSelectedResponsibilityId(responsibilityId);
    setSelectedResponsibilityPath(null); // Clear path when using ID
  };

  // Handle unified search - member selection
  const handleSearchMemberSelect = (member: OrgChartNode) => {
    handleMemberClick(member);
  };

  // Handle unified search - responsibility selection
  const handleSearchResponsibilitySelect = (path: ResponsibilityPath) => {
    // Switch to responsibilities view
    setActiveView("responsibilities");
    updateUrl({ view: "responsibilities", memberId: null });
    // Clear search query as it no longer relates to the current view
    setSearchQuery("");

    // Set the responsibility path to pre-fill
    setSelectedResponsibilityPath(path);
    setSelectedResponsibilityId(null); // Clear ID when using path object
  };

  // View tabs configuration
  const viewTabs: FilterTab[] = [
    {
      value: "cards",
      label: "Overzicht",
      icon: LayoutGrid,
    },
    {
      value: "chart",
      label: "Diagram",
      icon: Network,
    },
    {
      value: "responsibilities",
      label: "Hulp",
      icon: CircleHelp,
    },
  ];

  // Swipe gesture handlers for mobile view switching (Phase 4)
  const handleSwipeLeft = () => {
    // Swipe left → go to next view
    const viewOrder: ViewType[] = ["cards", "chart", "responsibilities"];
    const currentIndex = viewOrder.indexOf(activeView);
    if (currentIndex < viewOrder.length - 1) {
      const nextView = viewOrder[currentIndex + 1];
      handleViewChange(nextView, "swipe");
    }
  };

  const handleSwipeRight = () => {
    // Swipe right → go to previous view
    const viewOrder: ViewType[] = ["cards", "chart", "responsibilities"];
    const currentIndex = viewOrder.indexOf(activeView);
    if (currentIndex > 0) {
      const prevView = viewOrder[currentIndex - 1];
      handleViewChange(prevView, "swipe");
    }
  };

  const swipeHandlers = useSwipeGesture(
    handleSwipeLeft,
    handleSwipeRight,
    75, // threshold in pixels
  );

  // Phase 5: Keyboard navigation (Arrow keys, numbers, /, Esc)
  useKeyboardNavigation(
    (view) => handleViewChange(view, "keyboard"),
    () => {
      // Focus search input when '/' is pressed
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Zoek"]',
      );
      searchInput?.focus();
    },
    () => {
      // Close modal when Escape is pressed
      if (isModalOpen) {
        handleCloseModal();
      }
    },
    activeView,
    true, // enabled
  );

  return (
    <div className={`space-y-6 pb-20 lg:pb-6 ${className}`}>
      {/* Phase 5: Accessibility Components */}
      {/* Skip Link for keyboard users - must be first focusable element */}
      <SkipLink targetId="organigram-main-content" />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcuts />

      {/* Screen Reader Announcements */}
      <ScreenReaderAnnouncer message={announcement} />

      {/* Unified Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-bold text-kcvv-gray-blue mb-3">
          Zoek een persoon of hulpvraag
        </h3>
        <UnifiedSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          members={members}
          responsibilityPaths={responsibilityPaths}
          onSelectMember={handleSearchMemberSelect}
          onSelectResponsibility={handleSearchResponsibilitySelect}
          placeholder="Zoek op naam, functie, of hulpvraag..."
        />
      </div>

      {/* View Toggle - Desktop Only (Mobile uses bottom nav) */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <FilterTabs
          tabs={viewTabs}
          activeTab={activeView}
          onChange={handleViewChange}
          size="lg"
        />

        {/* View Description */}
        <div className="mt-3 text-sm text-kcvv-gray text-center lg:text-left">
          {activeView === "cards" && (
            <p>
              Bekijk de clubstructuur in overzichtelijke kaartjes. Klik op een
              kaartje om meer details te zien.
            </p>
          )}
          {activeView === "chart" && (
            <p>
              Bekijk de clubstructuur in een visueel diagram. Zoom, pan en klik
              voor details.
            </p>
          )}
          {activeView === "responsibilities" && (
            <p>
              Zoek snel de juiste contactpersoon voor jouw vraag of situatie.
            </p>
          )}
        </div>
      </div>

      {/* Active View - With swipe gestures on mobile (Phase 4)
          Chart and Cards views: transparent wrapper so the inner content
          (chart nodes / hierarchy cards) floats on the section background
          without a nested-card-on-card look or rounded-bottom seam.
          Responsibilities view: keep the white card frame since the
          finder UI benefits from a contained card. */}
      <div
        id="organigram-main-content"
        tabIndex={-1}
        className={`focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2 ${
          activeView === "chart" || activeView === "cards"
            ? ""
            : "bg-white rounded-xl shadow-sm border border-gray-200"
        } ${
          activeView === "responsibilities"
            ? "overflow-visible"
            : "overflow-hidden"
        }`}
        {...swipeHandlers}
        aria-label="Organigram hoofdinhoud"
      >
        {activeView === "cards" && (
          <CardHierarchy
            members={members}
            responsibilityPaths={responsibilityPaths}
            onMemberClick={handleMemberClick}
            initialExpandedDepth={2}
          />
        )}

        {activeView === "chart" && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-4 border-kcvv-green border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-kcvv-gray">Diagram laden...</p>
                </div>
              </div>
            }
          >
            <EnhancedOrgChart
              members={members}
              onMemberClick={handleMemberClick}
              centeredMemberId={centeredMemberId}
            />
          </Suspense>
        )}

        {activeView === "responsibilities" && (
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-kcvv-green border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm text-kcvv-gray">
                      Hulpsysteem laden...
                    </p>
                  </div>
                </div>
              }
            >
              <ResponsibilityFinder
                paths={responsibilityPaths}
                onMemberSelect={handleResponsibilityMemberSelect}
                initialPathId={selectedResponsibilityId ?? undefined}
                initialPath={selectedResponsibilityPath ?? undefined}
                onResultSelect={() => {
                  // Clear pre-selected responsibility once user interacts
                  setSelectedResponsibilityId(null);
                  setSelectedResponsibilityPath(null);
                }}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          member={selectedMember}
          responsibilityPaths={responsibilityPaths}
          onViewResponsibility={handleViewResponsibility}
        />
      )}

      {/* Mobile Bottom Navigation (Phase 4) */}
      <MobileBottomNav
        tabs={viewTabs}
        activeTab={activeView}
        onChange={handleViewChange}
      />
    </div>
  );
}
