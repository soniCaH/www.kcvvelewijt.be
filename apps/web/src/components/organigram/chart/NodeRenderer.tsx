"use client";

/**
 * NodeRenderer Component (Option C: Enhanced d3)
 *
 * Custom node renderer for d3-org-chart using ContactCard design.
 * Generates HTML string for d3-org-chart's nodeContent() method.
 *
 * Features:
 * - KCVV branding (green accent bar, colors)
 * - Profile image with fallback
 * - Name, title, position badge
 * - Expand/collapse indicator
 * - Hover effects via CSS
 */

import type { OrgChartNode } from "@/types/organigram";

export interface NodeData extends OrgChartNode {
  _expanded?: boolean;
  _children?: NodeData[];
  children?: NodeData[];
}

/**
 * Render an enhanced d3-organigram node card as an HTML string.
 *
 * @param node - Node data to render; may include `imageUrl`, `name`, `title`, `roleCode`, and `_expanded` to indicate expansion state
 * @param hasChildren - Whether the node has child nodes; when `true` an expand/collapse indicator is included
 * @returns An HTML string representing the rendered node card
 */
export function renderNode(node: NodeData, hasChildren: boolean): string {
  const imageUrl = node.imageUrl || "/images/logo-flat.png";
  const isExpanded = node._expanded !== false;

  return `
    <div class="org-node-enhanced" style="
      background: white;
      border: 2px solid #edeff4;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      width: 280px;
      height: 140px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    ">
      <!-- Green accent bar -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #4acf52 0%, #41b147 100%);
        border-radius: 10px 10px 0 0;
      "></div>

      <div style="display: flex; gap: 12px; height: 100%;">
        <!-- Profile Image -->
        <div style="flex-shrink: 0;">
          <img
            src="${imageUrl}"
            alt="${node.name}"
            style="
              width: 64px;
              height: 64px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #4acf52;
            "
            onerror="this.src='/images/logo-flat.png'"
          />
        </div>

        <!-- Content -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        ">
          <!-- Name -->
          <div style="
            font-family: 'quasimoda', 'acumin-pro', 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #31404b;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${node.name}</div>

          <!-- Title -->
          <div style="
            font-family: 'montserrat', sans-serif;
            font-size: 13px;
            color: #62656A;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          ">${node.title}</div>

          <!-- Position Badge -->
          ${
            node.roleCode
              ? `
            <div style="
              margin-top: 8px;
              display: inline-block;
              align-self: flex-start;
              padding: 2px 8px;
              background: rgba(74, 207, 82, 0.1);
              color: #4acf52;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              font-family: 'ibm-plex-mono', monospace;
              letter-spacing: 0.5px;
            ">${node.roleCode}</div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Expand/Collapse Indicator -->
      ${
        hasChildren
          ? `
        <div class="expand-indicator" style="
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: #4acf52;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          pointer-events: none;
        ">
          ${isExpanded ? "−" : "+"}
        </div>
      `
          : ""
      }
    </div>
  `;
}

/**
 * Render a compact node card used for mobile or condensed layouts.
 *
 * @param node - Node data to render (name, title, imageUrl, and optional _expanded)
 * @param hasChildren - Whether to display an expand/collapse indicator
 * @returns An HTML string representing the compact node card
 */
export function renderCompactNode(
  node: NodeData,
  hasChildren: boolean,
): string {
  const imageUrl = node.imageUrl || "/images/logo-flat.png";
  const isExpanded = node._expanded !== false;

  return `
    <div class="org-node-compact" style="
      background: white;
      border: 2px solid #edeff4;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      width: 200px;
      height: 100px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    ">
      <!-- Green accent bar -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #4acf52 0%, #41b147 100%);
        border-radius: 6px 6px 0 0;
      "></div>

      <div style="display: flex; gap: 8px; height: 100%;">
        <!-- Profile Image (smaller) -->
        <div style="flex-shrink: 0;">
          <img
            src="${imageUrl}"
            alt="${node.name}"
            style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #4acf52;
            "
            onerror="this.src='/images/logo-flat.png'"
          />
        </div>

        <!-- Content -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        ">
          <!-- Name -->
          <div style="
            font-family: 'quasimoda', 'acumin-pro', 'Montserrat', sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #31404b;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${node.name}</div>

          <!-- Title (single line) -->
          <div style="
            font-family: 'montserrat', sans-serif;
            font-size: 11px;
            color: #62656A;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${node.title}</div>
        </div>
      </div>

      <!-- Expand/Collapse Indicator (smaller) -->
      ${
        hasChildren
          ? `
        <div class="expand-indicator" style="
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          background: #4acf52;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          pointer-events: none;
        ">
          ${isExpanded ? "−" : "+"}
        </div>
      `
          : ""
      }
    </div>
  `;
}
