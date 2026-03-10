/**
 * Organigram (Organizational Chart) Types
 *
 * Used for the club organizational structure visualization.
 * These types define the hierarchical structure for d3-org-chart library.
 */

/**
 * A single person/position in the organizational chart
 */
export interface OrgChartNode {
  /** Unique identifier for this node */
  id: string;

  /** Full name of the person */
  name: string;

  /** Job title or position */
  title: string;

  /** Short role code (e.g., "PRES" for President) */
  positionShort?: string;

  /** URL to profile photo */
  imageUrl?: string;

  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** Description of responsibilities */
  responsibilities?: string;

  /** Optional deep-link to a staff profile page (not populated by Sanity; reserved for future use) */
  profileUrl?: string;

  /** Department or section this person belongs to */
  department?: "hoofdbestuur" | "jeugdbestuur" | "algemeen";

  /** Parent node ID (for building the hierarchy) */
  parentId?: string | null;

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
