"use client";

import { useEffect } from "react";
import { openStructureRow } from "./open-row";

/**
 * Opens the row a shared `?member=<nodeId>` link points at, once, on arrival.
 * Renders nothing. The rows are server-rendered, so they are in the DOM by the
 * time this effect runs. An id that matches no row does nothing.
 */
export function RowDeepLink() {
  useEffect(() => {
    const nodeId = new URLSearchParams(window.location.search).get("member");
    if (nodeId) openStructureRow(nodeId);
  }, []);
  return null;
}
