/**
 * Organigram (Organizational Chart) Types
 *
 * Used for the club organizational structure visualization.
 * These types define the hierarchical structure for d3-org-chart library.
 */

/**
 * A single member (person) linked to an organigram node.
 */
export interface OrgChartMember {
  /** Sanity _id of the staffMember document, or a synthetic value for generated nodes (e.g. "club") */
  id: string;

  /** Full name of the person; undefined when whitespace-only or absent */
  name?: string;

  /** URL to profile photo */
  imageUrl?: string;

  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** Canonical URL to the staff profile page (/staf/{psdId}) */
  href?: string;
}

/**
 * A single position/role in the organizational chart.
 * One node can be linked to zero (vacant), one, or multiple (shared) staff members.
 */
export interface OrgChartNode {
  /** Unique identifier — organigramNode._id for Sanity-backed nodes, or a synthetic value for generated root nodes (e.g. "club") */
  id: string;

  /** Position title — organigramNode.title for Sanity-backed nodes, or a synthetic label for generated root nodes */
  title: string;

  /** Short role code badge (e.g., "PRES" for President) */
  roleCode?: string;

  /** Description of the position's responsibilities */
  description?: string;

  /** Department or section this position belongs to */
  department?: "hoofdbestuur" | "jeugdbestuur" | "algemeen";

  /** Parent node ID (for building the hierarchy) */
  parentId?: string | null;

  /**
   * Staff members holding this position.
   * - 0 members: vacant position
   * - 1 member: standard single-person role
   * - 2+ members: shared/co-held role
   */
  members: OrgChartMember[];

  /** Array of child node IDs (computed) */
  _children?: OrgChartNode[];

  /** Whether this node is currently expanded (UI state) */
  _expanded?: boolean;

  /** Additional data for custom rendering */
  _directSubordinates?: number;
  _totalSubordinates?: number;
}

/**
 * Complete organizational structure
 */
export interface OrganizationStructure {
  /** Root node (e.g., "KCVV Elewijt") */
  root: OrgChartNode;

  /** All nodes in flat array (easier for searching) */
  nodes: OrgChartNode[];

  /** Metadata */
  lastUpdated?: string;
  version?: string;
}

/**
 * Configuration for the org chart display
 */
export interface OrgChartConfig {
  /** Initial zoom level (0.0 - 1.0) */
  initialZoom?: number;

  /** Expand all nodes on initial load */
  expandAll?: boolean;

  /** Expand nodes up to this depth */
  expandToDepth?: number;

  /** Filter to show only specific department */
  departmentFilter?: "all" | "hoofdbestuur" | "jeugdbestuur";

  /** Enable compact mobile view */
  compactMode?: boolean;

  /** Custom colors */
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
}

/**
 * Member details modal data
 */
export interface MemberDetails {
  node: OrgChartNode;
  directReports: OrgChartNode[];
  supervisor?: OrgChartNode;
}
