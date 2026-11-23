import { createContext } from "react";
import type { BlockLayout } from "../looks/block-layout";

// A plain module, not exports of the 'use client' <ShareFrame>: a context is a value, and a
// client file exports components and types only (#3839).
/**
 * Squad badge text (e.g. `"A"`, `"U21"`, `"U13A"`) for the enclosing render.
 * Defaults to no badge. `SharePage` provides this around the element returned
 * by its template renderer; `ShareTop` is the single seam that reads it, so
 * every one of the 11 templates picks up the badge without a threaded prop.
 * A template rendered standalone (Storybook, a unit test) shows no badge
 * unless it is wrapped in this provider.
 */
export const ShareBadgeContext = createContext<string | undefined>(undefined);

/**
 * The block layout of the story being composed in `/share` (#3537). With
 * one, {@link ShareMid} makes each of its direct children a movable block;
 * without one (Storybook, VR, unit tests) it renders exactly as before.
 */
export const ShareBlocksContext = createContext<BlockLayout | null>(null);
