"use client";

/**
 * CardHierarchy Component
 *
 * Collapsible card-based organigram view showing hierarchical structure
 * through nested, expandable cards with progressive disclosure.
 *
 * Features:
 * - Expandable card hierarchy (preserves reporting relationships)
 * - Search with auto-expand to matching results
 * - Department filtering
 * - Expand All / Collapse All controls
 * - Progressive disclosure (start partially expanded)
 * - Mobile-friendly touch interactions
 * - Keyboard accessible
 *
 * Strengths:
 * - Shows hierarchical relationships clearly
 * - Progressive disclosure reduces cognitive load
 * - Mobile-native expandable pattern
 * - Clear parent-child connections
 *
 * Weaknesses:
 * - Harder to see "big picture" at once
 * - Deep hierarchies require more clicks
 * - Can lose context when deeply nested
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { OrgChart } from "d3-org-chart";
import { Download } from "lucide-react";
import { SearchBar } from "../shared/SearchBar";
import { DepartmentFilter } from "../shared/DepartmentFilter";
import { HierarchyLevel } from "./HierarchyLevel";
import { renderNode, type NodeData } from "../chart/NodeRenderer";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

export interface CardHierarchyProps {
  members: OrgChartNode[];
  responsibilityPaths?: ResponsibilityPath[];
  onMemberClick?: (member: OrgChartNode) => void;
  initialExpandedDepth?: number;
  maxDepth?: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Renders a collapsible, searchable card-based organizational chart with department filtering and image export.
 *
 * @param members - Array of organization members to display in the hierarchy
 * @param onMemberClick - Optional callback invoked when a member is selected
 * @param initialExpandedDepth - Number of hierarchy levels to auto-expand on initial render
 * @param maxDepth - Maximum hierarchy depth to render
 * @param isLoading - When true, render loading skeletons instead of the chart
 * @param className - Additional CSS class names applied to the root container
 * @returns The JSX element containing the hierarchy UI, controls, and hidden export container
 */
export function CardHierarchy({
  members,
  responsibilityPaths = [],
  onMemberClick,
  initialExpandedDepth = 2,
  maxDepth = 10,
  isLoading = false,
  className = "",
}: CardHierarchyProps) {
  const hierarchyContainerRef = useRef<HTMLDivElement>(null);
  const exportChartContainerRef = useRef<HTMLDivElement>(null);
  const exportChartRef = useRef<OrgChart<NodeData> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeDepartment, setActiveDepartment] = useState<
    "all" | "hoofdbestuur" | "jeugdbestuur"
  >("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Initialize with members up to initialExpandedDepth
    const initialExpanded = new Set<string>();

    const expandToDepth = (
      nodeId: string | null,
      currentDepth: number,
    ): void => {
      if (currentDepth >= initialExpandedDepth) return;

      members
        .filter((m) => m.parentId === nodeId)
        .forEach((child) => {
          initialExpanded.add(child.id);
          expandToDepth(child.id, currentDepth + 1);
        });
    };

    // Find root nodes and expand from there
    const rootNodes = members.filter((m) => !m.parentId);
    rootNodes.forEach((root) => {
      initialExpanded.add(root.id);
      expandToDepth(root.id, 1);
    });

    return initialExpanded;
  });

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
        member.members.some((m) => m.name?.toLowerCase().includes(query)) ||
        member.title.toLowerCase().includes(query) ||
        member.roleCode?.toLowerCase().includes(query) ||
        member.members.some((m) => m.email?.toLowerCase().includes(query)) ||
        member.department?.toLowerCase().includes(query)
      );
    });
  }, [departmentFilteredMembers, searchQuery]);

  // Calculate which IDs should be auto-expanded based on search
  const searchExpandedIds = useMemo(() => {
    if (!searchQuery.trim() || searchResults.length === 0) {
      return new Set<string>();
    }

    const autoExpanded = new Set<string>();

    // For each search result, add all ancestors
    searchResults.forEach((result) => {
      let current: OrgChartNode | undefined = result;

      while (current) {
        autoExpanded.add(current.id);
        current = members.find((m) => m.id === current?.parentId);
      }
    });

    return autoExpanded;
  }, [searchQuery, searchResults, members]);

  // Merge manual expansions with search auto-expansions
  const effectiveExpandedIds = useMemo(() => {
    const merged = new Set(expandedIds);
    searchExpandedIds.forEach((id) => merged.add(id));
    return merged;
  }, [expandedIds, searchExpandedIds]);

  // Get root members (those without parentId or whose parent is filtered out)
  const rootMembers = useMemo(() => {
    const filteredIds = new Set(searchResults.map((m) => m.id));

    return searchResults.filter((member) => {
      // No parent = root
      if (!member.parentId) return true;

      // Parent exists but is filtered out = treat as root
      return !filteredIds.has(member.parentId);
    });
  }, [searchResults]);

  // Handle expand/collapse toggle
  const handleToggle = (memberId: string, isExpanded: boolean) => {
    const newExpanded = new Set(expandedIds);

    if (isExpanded) {
      newExpanded.add(memberId);
    } else {
      newExpanded.delete(memberId);

      // Also collapse all children recursively
      const collapseChildren = (parentId: string) => {
        members
          .filter((m) => m.parentId === parentId)
          .forEach((child) => {
            newExpanded.delete(child.id);
            collapseChildren(child.id);
          });
      };

      collapseChildren(memberId);
    }

    setExpandedIds(newExpanded);
  };

  // Expand All
  const handleExpandAll = () => {
    const allIds = new Set(searchResults.map((m) => m.id));
    setExpandedIds(allIds);
  };

  // Collapse All
  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Handle search selection
  const handleSearchSelect = (member: OrgChartNode) => {
    onMemberClick?.(member);
  };

  // Transform data for d3-org-chart (for export)
  const exportChartData = useMemo<NodeData[]>(() => {
    if (searchResults.length === 0) {
      return [];
    }

    const fullMembersList = members;
    const nodeMap = new Map<string, OrgChartNode>();

    const addNodeWithAncestors = (nodeId: string) => {
      if (nodeMap.has(nodeId)) return;

      const node = fullMembersList.find((m) => m.id === nodeId);
      if (!node) return;

      nodeMap.set(nodeId, node);

      if (node.parentId) {
        addNodeWithAncestors(node.parentId);
      }
    };

    searchResults.forEach((member) => {
      addNodeWithAncestors(member.id);
    });

    return Array.from(nodeMap.values()).map((member) => ({
      ...member,
      _expanded: true,
      children: [],
    }));
  }, [searchResults, members]);

  // Initialize hidden d3-org-chart for export
  useEffect(() => {
    const containerElement = exportChartContainerRef.current;
    if (!containerElement || exportChartData.length === 0) return;

    const chart = new OrgChart<NodeData>()
      .container("#export-org-chart-container")
      .data(exportChartData)
      .nodeWidth(() => 280)
      .nodeHeight(() => 140)
      .childrenMargin(() => 50)
      .compactMarginBetween(() => 35)
      .compactMarginPair(() => 50)
      .neighbourMargin(() => 50)
      .siblingsMargin(() => 50)
      .nodeContent((d) => {
        const hasChildren =
          members.filter((m) => m.parentId === d.data.id).length > 0;
        return renderNode(d.data, hasChildren);
      });

    exportChartRef.current = chart;
    chart.render();

    return () => {
      if (containerElement) {
        containerElement.innerHTML = "";
      }
    };
  }, [exportChartData, members]);

  // Export as Image (PNG) - exports the d3 org chart visualization
  const handleExportImage = () => {
    if (exportChartRef.current) {
      // Expand all nodes before export
      exportChartRef.current.expandAll();

      // Wait for expansion animation to complete, then export
      setTimeout(() => {
        if (exportChartRef.current) {
          exportChartRef.current.exportImg({
            full: true,
            save: true,
            scale: 6,
            backgroundColor: "#ffffff",
          });
        }
      }, 500);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-lg animate-pulse"
              style={{ marginLeft: `${(i % 3) * 16}px` }}
            />
          ))}
        </div>
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
          onChange={setActiveDepartment}
          members={members}
          showCounts={true}
          variant="pills"
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        {/* Results Count */}
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

        {/* Controls: Expand/Collapse + Export */}
        {searchResults.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExpandAll}
              className="
                px-3 py-1.5
                text-xs font-medium text-kcvv-gray-dark
                bg-gray-100 hover:bg-gray-200
                rounded-lg
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
            >
              Alles uitklappen
            </button>
            <button
              onClick={handleCollapseAll}
              className="
                px-3 py-1.5
                text-xs font-medium text-kcvv-gray-dark
                bg-gray-100 hover:bg-gray-200
                rounded-lg
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
            >
              Alles inklappen
            </button>
            <button
              onClick={handleExportImage}
              className="
                px-3 py-1.5
                flex items-center gap-1.5
                text-xs font-medium text-kcvv-gray-dark
                bg-gray-100 hover:bg-gray-200
                rounded-lg
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2
              "
              aria-label="Exporteren als afbeelding"
            >
              <Download size={14} />
              <span>Exporteren</span>
            </button>
          </div>
        )}
      </div>

      {/* Hierarchy — transparent so individual member cards float on the
          section background. The export functionality uses its own
          offscreen white container further down (search for fixed -left-). */}
      <div ref={hierarchyContainerRef}>
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
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
          <HierarchyLevel
            members={rootMembers}
            allMembers={searchResults}
            depth={0}
            maxDepth={maxDepth}
            expandedIds={effectiveExpandedIds}
            onToggle={handleToggle}
            onMemberClick={onMemberClick}
            responsibilityPaths={responsibilityPaths}
          />
        )}
      </div>

      {/* Hidden d3-org-chart container for export */}
      <div
        id="export-org-chart-container"
        ref={exportChartContainerRef}
        className="fixed -left-[9999px] top-0 w-[1200px] h-[800px] bg-white"
        aria-hidden="true"
      />
    </div>
  );
}
