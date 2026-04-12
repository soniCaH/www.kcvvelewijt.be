"use client";

/**
 * NodeRenderer Component (Option C: Enhanced d3)
 *
 * Custom node renderer for d3-org-chart using ContactCard design.
 * Generates HTML string for d3-org-chart's nodeContent() method.
 *
 * Supports three node states:
 * - Single (1 member): photo + name + position title card
 * - Vacant (0 members): position title + muted description, no photo, visually distinct
 * - Shared (2+ members): position title header + stacked photo/name chips per member
 */

import type { OrgChartNode } from "@/types/organigram";

// Design-token equivalents used as literal values because d3-org-chart renders
// raw HTML strings where CSS custom properties are not available.
const NODE_ACCENT_COLOR = "#4acf52";
const NODE_ACCENT_GRADIENT_END = "#41b147";
const NODE_TEXT_PRIMARY = "#31404b";
const NODE_TEXT_SECONDARY = "#62656A";
const NODE_TEXT_MUTED = "#9ca3af";
const NODE_BORDER_COLOR = "#edeff4";
const NODE_ACCENT_BG = "rgba(74, 207, 82, 0.1)";
const NODE_MUTED_BG = "rgba(156, 163, 175, 0.1)";

export interface NodeData extends OrgChartNode {
  _expanded?: boolean;
  _children?: NodeData[];
  children?: NodeData[];
}

function expandCollapseIndicator(isExpanded: boolean, size: "lg" | "sm") {
  const dim = size === "lg" ? 32 : 24;
  const bottom = size === "lg" ? 8 : 6;
  const right = size === "lg" ? 8 : 6;
  const fontSize = size === "lg" ? 20 : 16;
  const shadow =
    size === "lg" ? "0 2px 6px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.15)";
  return `
    <div class="expand-indicator" style="
      position: absolute;
      bottom: ${bottom}px;
      right: ${right}px;
      width: ${dim}px;
      height: ${dim}px;
      background: ${NODE_ACCENT_COLOR};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${fontSize}px;
      font-weight: bold;
      box-shadow: ${shadow};
      pointer-events: none;
    ">
      ${isExpanded ? "−" : "+"}
    </div>
  `;
}

function greenAccentBar(borderRadius: string, height: number) {
  return `
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: ${height}px;
      background: linear-gradient(90deg, ${NODE_ACCENT_COLOR} 0%, ${NODE_ACCENT_GRADIENT_END} 100%);
      border-radius: ${borderRadius};
    "></div>
  `;
}

// ─── renderNode (full-size, desktop) ───────────────────────────────

export function renderNode(node: NodeData, hasChildren: boolean): string {
  const isExpanded = node._expanded !== false;
  const memberCount = node.members.length;

  if (memberCount === 0) return renderVacantNode(node, hasChildren, isExpanded);
  if (memberCount === 1) return renderSingleNode(node, hasChildren, isExpanded);
  return renderSharedNode(node, hasChildren, isExpanded);
}

function renderSingleNode(
  node: NodeData,
  hasChildren: boolean,
  isExpanded: boolean,
): string {
  const primaryMember = node.members[0];
  const imageUrl = primaryMember?.imageUrl || "/images/logo-flat.png";
  const displayName = primaryMember?.name ?? node.title;

  return `
    <div class="org-node-enhanced" style="
      background: white;
      border: 2px solid ${NODE_BORDER_COLOR};
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      width: 280px;
      height: 140px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    ">
      ${greenAccentBar("10px 10px 0 0", 4)}

      <div style="display: flex; gap: 12px; height: 100%;">
        <div style="flex-shrink: 0;">
          <img
            src="${imageUrl}"
            alt="${displayName}"
            crossorigin="anonymous"
            style="
              width: 64px;
              height: 64px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid ${NODE_ACCENT_COLOR};
            "
            onerror="this.src='/images/logo-flat.png'"
          />
        </div>

        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        ">
          <div style="
            font-family: 'quasimoda', -apple-system, system-ui, 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: ${NODE_TEXT_PRIMARY};
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${displayName}</div>

          <div style="
            font-family: 'montserrat', sans-serif;
            font-size: 13px;
            color: ${NODE_TEXT_SECONDARY};
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          ">${node.title}</div>

          ${
            node.roleCode
              ? `
            <div style="
              margin-top: 8px;
              display: inline-block;
              align-self: flex-start;
              padding: 2px 8px;
              background: ${NODE_ACCENT_BG};
              color: ${NODE_ACCENT_COLOR};
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              font-family: var(--font-family-mono);
              letter-spacing: 0.5px;
            ">${node.roleCode}</div>
          `
              : ""
          }
        </div>
      </div>

      ${hasChildren ? expandCollapseIndicator(isExpanded, "lg") : ""}
    </div>
  `;
}

function renderVacantNode(
  node: NodeData,
  hasChildren: boolean,
  isExpanded: boolean,
): string {
  return `
    <div class="org-node-enhanced org-node-vacant" style="
      background: #f8f9fb;
      border: 2px dashed #c8cdd4;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      width: 280px;
      height: 140px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      opacity: 0.85;
    ">
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        text-align: center;
      ">
        <div style="
          font-family: 'quasimoda', -apple-system, system-ui, 'Montserrat', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: ${NODE_TEXT_PRIMARY};
          margin-bottom: 4px;
        ">${node.title}</div>

        <div style="
          font-family: 'montserrat', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: ${NODE_TEXT_MUTED};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        ">Vacante functie</div>

        ${
          node.description
            ? `
          <div style="
            font-family: 'montserrat', sans-serif;
            font-size: 12px;
            color: ${NODE_TEXT_MUTED};
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          ">${node.description}</div>
        `
            : ""
        }

        ${
          node.roleCode
            ? `
          <div style="
            margin-top: 8px;
            display: inline-block;
            align-self: center;
            padding: 2px 8px;
            background: ${NODE_MUTED_BG};
            color: ${NODE_TEXT_MUTED};
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            font-family: var(--font-family-mono);
            letter-spacing: 0.5px;
          ">${node.roleCode}</div>
        `
            : ""
        }
      </div>

      ${hasChildren ? expandCollapseIndicator(isExpanded, "lg") : ""}
    </div>
  `;
}

function renderSharedNode(
  node: NodeData,
  hasChildren: boolean,
  isExpanded: boolean,
): string {
  const memberChips = node.members
    .map((m) => {
      const chipImage = m.imageUrl
        ? `<img
            src="${m.imageUrl}"
            alt="${m.name ?? ""}"
            crossorigin="anonymous"
            style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              object-fit: cover;
              border: 1.5px solid ${NODE_ACCENT_COLOR};
              flex-shrink: 0;
            "
            onerror="this.src='/images/logo-flat.png'"
          />`
        : `<div style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: #6b7280;
            flex-shrink: 0;
          ">${(m.name ?? "?")[0].toUpperCase()}</div>`;

      return `
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          ${chipImage}
          <span style="
            font-family: 'quasimoda', -apple-system, system-ui, 'Montserrat', sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: ${NODE_TEXT_PRIMARY};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${m.name ?? ""}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="org-node-enhanced org-node-shared" style="
      background: white;
      border: 2px solid ${NODE_BORDER_COLOR};
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      width: 280px;
      min-height: 140px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    ">
      ${greenAccentBar("10px 10px 0 0", 4)}

      <div style="
        font-family: 'montserrat', sans-serif;
        font-size: 13px;
        color: ${NODE_TEXT_SECONDARY};
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <span>${node.title}</span>
        ${
          node.roleCode
            ? `<span style="
              padding: 1px 6px;
              background: ${NODE_ACCENT_BG};
              color: ${NODE_ACCENT_COLOR};
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              font-family: var(--font-family-mono);
              letter-spacing: 0.5px;
            ">${node.roleCode}</span>`
            : ""
        }
      </div>

      <div style="
        display: flex;
        flex-direction: column;
        gap: 6px;
      ">
        ${memberChips}
      </div>

      ${hasChildren ? expandCollapseIndicator(isExpanded, "lg") : ""}
    </div>
  `;
}

// ─── renderCompactNode (mobile) ────────────────────────────────────

export function renderCompactNode(
  node: NodeData,
  hasChildren: boolean,
): string {
  const isExpanded = node._expanded !== false;
  const memberCount = node.members.length;

  if (memberCount === 0)
    return renderCompactVacantNode(node, hasChildren, isExpanded);
  if (memberCount === 1)
    return renderCompactSingleNode(node, hasChildren, isExpanded);
  return renderCompactSharedNode(node, hasChildren, isExpanded);
}

function renderCompactSingleNode(
  node: NodeData,
  hasChildren: boolean,
  isExpanded: boolean,
): string {
  const primaryMember = node.members[0];
  const imageUrl = primaryMember?.imageUrl || "/images/logo-flat.png";
  const displayName = primaryMember?.name ?? node.title;

  return `
    <div class="org-node-compact" style="
      background: white;
      border: 2px solid ${NODE_BORDER_COLOR};
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      width: 200px;
      height: 100px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    ">
      ${greenAccentBar("6px 6px 0 0", 3)}

      <div style="display: flex; gap: 8px; height: 100%;">
        <div style="flex-shrink: 0;">
          <img
            src="${imageUrl}"
            alt="${displayName}"
            crossorigin="anonymous"
            style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid ${NODE_ACCENT_COLOR};
            "
            onerror="this.src='/images/logo-flat.png'"
          />
        </div>

        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        ">
          <div style="
            font-family: 'quasimoda', -apple-system, system-ui, 'Montserrat', sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: ${NODE_TEXT_PRIMARY};
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${displayName}</div>

          <div style="
            font-family: 'montserrat', sans-serif;
            font-size: 11px;
            color: ${NODE_TEXT_SECONDARY};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${node.title}</div>
        </div>
      </div>

      ${hasChildren ? expandCollapseIndicator(isExpanded, "sm") : ""}
    </div>
  `;
}

function renderCompactVacantNode(
  node: NodeData,
  hasChildren: boolean,
  isExpanded: boolean,
): string {
  return `
    <div class="org-node-compact org-node-vacant" style="
      background: #f8f9fb;
      border: 2px dashed #c8cdd4;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      width: 200px;
      height: 100px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      opacity: 0.85;
    ">
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        text-align: center;
      ">
        <div style="
          font-family: 'quasimoda', -apple-system, system-ui, 'Montserrat', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: ${NODE_TEXT_PRIMARY};
          margin-bottom: 2px;
        ">${node.title}</div>

        <div style="
          font-family: 'montserrat', sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: ${NODE_TEXT_MUTED};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">Vacante functie</div>
      </div>

      ${hasChildren ? expandCollapseIndicator(isExpanded, "sm") : ""}
    </div>
  `;
}

function renderCompactSharedNode(
  node: NodeData,
  hasChildren: boolean,
  isExpanded: boolean,
): string {
  const memberChips = node.members
    .map(
      (m) => `
      <div style="
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="
          font-family: 'quasimoda', -apple-system, system-ui, 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: ${NODE_TEXT_PRIMARY};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        ">${m.name ?? ""}</span>
      </div>
    `,
    )
    .join("");

  return `
    <div class="org-node-compact org-node-shared" style="
      background: white;
      border: 2px solid ${NODE_BORDER_COLOR};
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      width: 200px;
      min-height: 100px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    ">
      ${greenAccentBar("6px 6px 0 0", 3)}

      <div style="
        font-family: 'montserrat', sans-serif;
        font-size: 11px;
        color: ${NODE_TEXT_SECONDARY};
        margin-bottom: 4px;
      ">${node.title}</div>

      <div style="
        display: flex;
        flex-direction: column;
        gap: 3px;
      ">
        ${memberChips}
      </div>

      ${hasChildren ? expandCollapseIndicator(isExpanded, "sm") : ""}
    </div>
  `;
}
