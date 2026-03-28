"use client";

/**
 * EnhancedOrgChart Component
 *
 * Interactive D3-based organizational chart with enhanced mobile UX.
 * Provides visual diagram view of organizational hierarchy.
 *
 * Mobile Enhancements:
 * - Mobile navigation drawer (off-canvas)
 * - Contact overlay on node hover/tap
 * - Improved mobile controls (larger touch targets)
 * - Search highlighting with auto-zoom
 * - Simplified zoom controls
 * - Clearer visual hierarchy
 * - Better responsive behavior
 *
 * Features:
 * - Hierarchical org chart visualization (d3-org-chart)
 * - Search with autocomplete
 * - Department filtering
 * - Zoom/pan controls
 * - Expand/collapse nodes
 * - Fullscreen mode
 * - Export as high-quality PNG image
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { OrgChart } from "d3-org-chart";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Expand,
  Minimize,
  Download,
} from "lucide-react";
import { Menu } from "@/lib/icons";
import { SearchBar } from "../shared/SearchBar";
import { DepartmentFilter } from "../shared/DepartmentFilter";
import { MobileNavigationDrawer } from "./MobileNavigationDrawer";
import { ContactOverlay } from "./ContactOverlay";
import { renderNode, renderCompactNode, type NodeData } from "./NodeRenderer";
import type { OrgChartNode } from "@/types/organigram";
import { useOrganigramAnalytics } from "@/hooks/useOrganigramAnalytics";

export interface EnhancedOrgChartProps {
  members: OrgChartNode[];
  onMemberClick?: (member: OrgChartNode) => void;
  isLoading?: boolean;
  className?: string;
  /** Member ID to center the chart on (e.g., when navigating from Responsibility Finder) */
  centeredMemberId?: string | null;
}

/**
 * Render an interactive organizational chart UI with search, department filters, mobile navigation, zoom/fit controls, expand/collapse, fullscreen, and image export.
 *
 * @param members - Complete list of organization members used to build the chart and to resolve ancestor nodes for search results
 * @param onMemberClick - Optional callback invoked with the selected member when a chart node is clicked
 * @param isLoading - When true, renders loading placeholders instead of the chart
 * @param className - Optional additional CSS classes applied to the component container
 * @param centeredMemberId - Optional member ID to center the chart on after render
 * @returns The React element that renders the enhanced organizational chart UI
 */
export function EnhancedOrgChart({
  members,
  onMemberClick,
  isLoading = false,
  className = "",
  centeredMemberId,
}: EnhancedOrgChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<OrgChart<NodeData> | null>(null);
  // Store callback in ref to avoid re-initializing chart when callback changes
  const onMemberClickRef = useRef(onMemberClick);
  const { trackSearchUsed, trackDepartmentFiltered, trackExportPng } =
    useOrganigramAnalytics();

  // Keep ref updated with latest callback (must be in useEffect per React rules)
  useEffect(() => {
    onMemberClickRef.current = onMemberClick;
  }, [onMemberClick]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeDepartment, setActiveDepartment] = useState<
    "all" | "hoofdbestuur" | "jeugdbestuur"
  >("all");

  const handleDepartmentChange = (
    department: "all" | "hoofdbestuur" | "jeugdbestuur",
  ) => {
    setActiveDepartment(department);
    trackDepartmentFiltered(department);
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [contactOverlay, setContactOverlay] = useState<{
    member: OrgChartNode;
    position: { x: number; y: number };
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Filter by department
  const departmentFilteredMembers = useMemo(() => {
    if (activeDepartment === "all") {
      return members;
    }

    return members.filter((member) => {
      if (activeDepartment === "hoofdbestuur") {
        return (
          member.department === "hoofdbestuur" ||
          member.department === "algemeen"
        );
      }
      return member.department === activeDepartment;
    });
  }, [members, activeDepartment]);

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return departmentFilteredMembers;
    }

    const query = searchQuery.toLowerCase();
    return departmentFilteredMembers.filter((member) => {
      return (
        member.members.some((m) => m.name.toLowerCase().includes(query)) ||
        member.title.toLowerCase().includes(query) ||
        member.roleCode?.toLowerCase().includes(query) ||
        member.members.some((m) => m.email?.toLowerCase().includes(query))
      );
    });
  }, [departmentFilteredMembers, searchQuery]);

  // Transform data for d3-org-chart
  const chartData = useMemo<NodeData[]>(() => {
    if (searchResults.length === 0) {
      return [];
    }

    // IMPORTANT: Always use the FULL members list (not filtered) to look up ancestors
    // This ensures we can always find parent nodes even when filtering
    const fullMembersList = members;

    // Build a complete set of nodes including all necessary ancestors
    const nodeMap = new Map<string, OrgChartNode>();

    // Function to add a node and all its ancestors
    const addNodeWithAncestors = (nodeId: string) => {
      if (nodeMap.has(nodeId)) return;

      // Look up in FULL members list, not filtered results
      const node = fullMembersList.find((m) => m.id === nodeId);
      if (!node) return;

      nodeMap.set(nodeId, node);

      // Recursively add parent
      if (node.parentId) {
        addNodeWithAncestors(node.parentId);
      }
    };

    // Add all search results and their ancestors
    searchResults.forEach((member) => {
      addNodeWithAncestors(member.id);
    });

    // Convert to array and add d3-org-chart properties
    return Array.from(nodeMap.values()).map((member) => ({
      ...member,
      _expanded: true,
      children: [],
    }));
  }, [searchResults, members]);

  // Initialize d3-org-chart (only once or when mobile state changes)
  useEffect(() => {
    const containerElement = chartContainerRef.current;
    if (!containerElement) return;

    // Clear any existing chart
    if (chartRef.current) {
      containerElement.innerHTML = "";
      chartRef.current = null;
    }

    // Create new chart instance
    const chart = new OrgChart<NodeData>()
      .container("#enhanced-org-chart-container")
      .nodeWidth(() => (isMobile ? 200 : 280))
      .nodeHeight(() => (isMobile ? 100 : 140))
      .childrenMargin(() => 50)
      .compactMarginBetween(() => 35)
      .compactMarginPair(() => 50)
      .neighbourMargin(() => 50)
      .siblingsMargin(() => 50)
      .nodeContent((d) => {
        const hasChildren =
          members.filter((m) => m.parentId === d.data.id).length > 0;
        return isMobile
          ? renderCompactNode(d.data, hasChildren)
          : renderNode(d.data, hasChildren);
      })
      .onNodeClick((node: unknown) => {
        const hierarchyNode = node as { data: NodeData };
        const member = members.find((m) => m.id === hierarchyNode.data.id);
        if (member && onMemberClickRef.current) {
          onMemberClickRef.current(member);
        }
      });

    chartRef.current = chart;

    // Note: You may see "translate(NaN,NaN)" warnings in console during d3-org-chart's
    // initial layout calculations. These are harmless and don't affect functionality.

    return () => {
      // Cleanup: clear container innerHTML
      if (containerElement) {
        containerElement.innerHTML = "";
      }
      chartRef.current = null;
    };
    // Note: onMemberClick is stored in a ref to avoid re-initializing the chart when callback changes
  }, [members, isMobile]);

  // Track previous chart data IDs to avoid unnecessary re-renders
  const prevChartDataIdsRef = useRef<string>("");

  // Track which member ID we've already centered on to avoid re-centering
  const lastCenteredIdRef = useRef<string | null>(null);

  // Update chart data when chartData changes, and center on member if specified
  useEffect(() => {
    // Reset the hash when chartData becomes empty to force re-render when data returns
    if (chartData.length === 0) {
      prevChartDataIdsRef.current = "";
      return;
    }

    if (!chartRef.current) return;

    // Create a deterministic hash including relevant fields to detect actual changes
    // Sort by id for consistency, then serialize id + key fields
    const currentDataHash = chartData
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(
        (d) =>
          `${d.id}|${d.members[0]?.name ?? ""}|${d.title}|${d.department}|${d.parentId ?? ""}`,
      )
      .join(",");

    // Skip re-render if data hasn't actually changed
    if (currentDataHash === prevChartDataIdsRef.current) {
      // But still center if we have a new centeredMemberId
      if (centeredMemberId && centeredMemberId !== lastCenteredIdRef.current) {
        lastCenteredIdRef.current = centeredMemberId;
        chartRef.current.setCentered(centeredMemberId).render();
      }
      return;
    }
    prevChartDataIdsRef.current = currentDataHash;

    // Update data and re-render
    chartRef.current.data(chartData).render();

    // Center on specified member after data is rendered
    // Use timeout to ensure D3 has finished its render
    if (centeredMemberId && centeredMemberId !== lastCenteredIdRef.current) {
      lastCenteredIdRef.current = centeredMemberId;
      setTimeout(() => {
        if (chartRef.current && centeredMemberId) {
          chartRef.current.setCentered(centeredMemberId).render();
        }
      }, 150);
    }
  }, [chartData, centeredMemberId]);

  // Reset lastCenteredIdRef when centeredMemberId is cleared
  useEffect(() => {
    if (!centeredMemberId) {
      lastCenteredIdRef.current = null;
    }
  }, [centeredMemberId]);

  // Handle search selection - zoom to member
  const handleSearchSelect = (member: OrgChartNode) => {
    trackSearchUsed(searchQuery);
    if (chartRef.current) {
      chartRef.current.setCentered(member.id).render();
    }
  };

  // Handle mobile drawer member selection - zoom to member
  const handleMobileDrawerSelect = (member: OrgChartNode) => {
    if (chartRef.current) {
      chartRef.current.setCentered(member.id).render();
    }
    setIsMobileDrawerOpen(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoomOut();
    }
  };

  const handleFitView = () => {
    if (chartRef.current) {
      chartRef.current.fit();
    }
  };

  // Expand/collapse all
  const handleExpandAll = () => {
    if (chartRef.current && chartData.length > 0) {
      chartRef.current.expandAll();
    }
  };

  const handleCollapseAll = () => {
    if (chartRef.current && chartData.length > 0) {
      chartRef.current.collapseAll();
    }
  };

  // Fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Export as Image (PNG)
  const handleExportImage = () => {
    trackExportPng();
    if (chartRef.current) {
      chartRef.current.exportImg({
        full: true,
        save: true,
        scale: 6, // Higher quality: 6x scale (default is 3)
        backgroundColor: "#ffffff",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header: Search + Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          members={members}
          placeholder="Zoek persoon, functie of afdeling..."
          showAutocomplete={true}
          maxResults={6}
          onSelect={handleSearchSelect}
        />

        {/* Department Filter */}
        <DepartmentFilter
          value={activeDepartment}
          onChange={handleDepartmentChange}
          members={members}
          showCounts={true}
          variant="pills"
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Results Count */}
        <p className="text-sm text-kcvv-gray">
          {searchResults.length === 0 ? (
            "Geen resultaten"
          ) : (
            <>
              <span className="font-semibold text-kcvv-gray-blue">
                {searchResults.length}
              </span>{" "}
              {searchResults.length === 1 ? "lid" : "leden"}
              {searchQuery && (
                <>
                  {" "}
                  gevonden voor &quot;
                  <span className="font-medium">{searchQuery}</span>&quot;
                </>
              )}
            </>
          )}
        </p>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Navigation Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="
              lg:hidden
              px-3 py-2
              flex items-center gap-2
              text-sm font-medium text-white
              bg-kcvv-green hover:bg-kcvv-green-hover
              rounded-lg
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
            "
          >
            <Menu size={18} />
            <span>Navigatie</span>
          </button>

          {/* Expand/Collapse All (Desktop) */}
          <div className="hidden lg:flex gap-2">
            <button
              onClick={handleExpandAll}
              className="
                px-3 py-2
                flex items-center gap-2
                text-xs font-medium text-kcvv-gray-dark
                bg-gray-100 hover:bg-gray-200
                rounded-lg
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
              aria-label="Alles uitklappen"
            >
              <Expand size={16} />
              <span className="hidden sm:inline">Alles uitklappen</span>
            </button>
            <button
              onClick={handleCollapseAll}
              className="
                px-3 py-2
                flex items-center gap-2
                text-xs font-medium text-kcvv-gray-dark
                bg-gray-100 hover:bg-gray-200
                rounded-lg
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
              aria-label="Alles inklappen"
            >
              <Minimize size={16} />
              <span className="hidden sm:inline">Alles inklappen</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportImage}
            className="
              flex
              px-3 py-2
              items-center gap-2
              text-xs font-medium text-kcvv-gray-dark
              bg-gray-100 hover:bg-gray-200
              rounded-lg
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
            "
            aria-label="Exporteren als afbeelding"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exporteren</span>
          </button>

          {/* Fullscreen Toggle (Desktop) */}
          <button
            onClick={handleFullscreenToggle}
            className="
              hidden lg:flex
              px-3 py-2
              items-center gap-2
              text-xs font-medium text-kcvv-gray-dark
              bg-gray-100 hover:bg-gray-200
              rounded-lg
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
            "
            aria-label={
              isFullscreen ? "Volledig scherm verlaten" : "Volledig scherm"
            }
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      {searchResults.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl text-kcvv-gray">🔍</span>
          </div>
          <p className="text-lg font-semibold text-kcvv-gray-blue mb-2">
            {searchQuery
              ? `Geen resultaten voor "${searchQuery}"`
              : "Geen leden in deze afdeling"}
          </p>
          <p className="text-sm text-kcvv-gray max-w-md">
            Probeer een andere zoekopdracht of filter
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Chart */}
          <div
            id="enhanced-org-chart-container"
            ref={chartContainerRef}
            className="
              w-full
              bg-white
              rounded-lg
              border-2 border-gray-200
              overflow-hidden
            "
            style={{
              minHeight: "600px",
              height: isFullscreen ? "100vh" : "600px",
            }}
          />

          {/* Zoom Controls (Fixed Bottom Right) */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={handleZoomIn}
              className="
                w-12 h-12
                flex items-center justify-center
                bg-white hover:bg-gray-50
                text-kcvv-gray-dark
                rounded-lg
                shadow-lg
                border-2 border-gray-200
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
              aria-label="Inzoomen"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={handleZoomOut}
              className="
                w-12 h-12
                flex items-center justify-center
                bg-white hover:bg-gray-50
                text-kcvv-gray-dark
                rounded-lg
                shadow-lg
                border-2 border-gray-200
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
              aria-label="Uitzoomen"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={handleFitView}
              className="
                w-12 h-12
                flex items-center justify-center
                bg-white hover:bg-gray-50
                text-kcvv-gray-dark
                rounded-lg
                shadow-lg
                border-2 border-gray-200
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
              aria-label="Pas aan"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        members={members}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onMemberSelect={handleMobileDrawerSelect}
      />

      {/* Contact Overlay */}
      {contactOverlay && (
        <ContactOverlay
          member={contactOverlay.member}
          position={contactOverlay.position}
          isVisible={true}
          onClose={() => setContactOverlay(null)}
          onViewDetails={onMemberClick}
        />
      )}
    </div>
  );
}
