"use client";

import React, {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";
import { wedstrijdZ, type BlockLayout } from "../looks/block-layout";
import {
  BODY_FONT,
  GRAIN_DATA_URL,
  KCVV_LOGO,
  MONO_FONT,
  TOKENS,
} from "../constants";
import {
  overlayGradient,
  resolvePalette,
  toSameOriginImage,
  type SharePalette,
  type ShareOverlay,
  type ShareRegister,
  type ShareSentiment,
} from "./theme";

const SharePaletteContext = createContext<SharePalette>(
  resolvePalette("cream", "neutral"),
);

/**
 * How the image register paints its photo. `"portrait"` — a player photo in
 * the top square, text dropped below it so it never crosses the face.
 * `"backdrop"` — a mood background over the whole canvas, text centred.
 */
export type SharePhotoLayout = "portrait" | "backdrop";

// The layout of the photo the enclosing frame paints, or null without one:
// ShareMid reads it to place its content.
const SharePhotoContext = createContext<SharePhotoLayout | null>(null);

/** Read the resolved palette of the enclosing {@link ShareFrame}. */
export function useSharePalette(): SharePalette {
  return useContext(SharePaletteContext);
}

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

export interface ShareFrameProps {
  /** Canvas width in px (1080 for both Story and Square). */
  width: number;
  /** Canvas height in px (1920 Story / 1080 Square). */
  height: number;
  register: ShareRegister;
  sentiment?: ShareSentiment;
  /** Fullscreen photo URL — required when `register === "image"`. */
  imageUrl?: string;
  /** How the image register paints its photo (default `"portrait"`). */
  photoLayout?: SharePhotoLayout;
  /** Overlay strength for the image register. */
  overlay?: ShareOverlay;
  /** Absolutely-positioned decoration layers rendered behind the content. */
  decor?: React.ReactNode;
  /** Padding for the content column. */
  padding?: string;
  children: React.ReactNode;
}

/**
 * Outer canvas for every share template. Renders the register background
 * (cream sheet / jersey-deep poster / fullscreen newsprint photo), the paper
 * grain, an optional gradient overlay, optional decoration layers, and a
 * flex-column content area whose colour is driven by the resolved palette.
 *
 * Rendered at exact pixel dimensions so `html-to-image` captures at full
 * resolution. Colours are concrete literals (capture-safe — see `constants.ts`).
 */
export function ShareFrame({
  width,
  height,
  register,
  sentiment = "neutral",
  imageUrl,
  photoLayout = "portrait",
  overlay = "calm",
  decor,
  padding = "64px 80px 56px",
  children,
}: ShareFrameProps) {
  const palette = resolvePalette(register, sentiment);
  const surface = register === "dark" ? TOKENS.jerseyDeepDark : TOKENS.cream;

  // Allowlist the photo scheme before it reaches an <img src>: a user-picked
  // file (object URL), a Sanity/CDN https URL, or a same-origin path is fine;
  // reject anything that could smuggle markup (`data:` / `javascript:`).
  // Guards CodeQL js/xss-through-dom and is genuine defence-in-depth for the
  // upload path. Single RegExp test so it reads as one sanitizer guard.
  const photoUrl =
    imageUrl && /^(?:blob:|https?:\/\/|\/)/i.test(imageUrl)
      ? imageUrl
      : undefined;

  return (
    <SharePaletteContext.Provider value={palette}>
      <SharePhotoContext.Provider
        value={register === "image" && photoUrl ? photoLayout : null}
      >
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: "relative",
            overflow: "hidden",
            background: register === "image" ? TOKENS.jerseyDeepDark : surface,
            backgroundImage: register === "image" ? undefined : GRAIN_DATA_URL,
            fontFamily: BODY_FONT,
            color: palette.text,
          }}
        >
          {register === "image" && photoUrl && (
            <>
              <img
                // Route + sanitize at the sink: remote CDN images go through the
                // same-origin Next optimizer (so html-to-image can read them),
                // every path runs through a recognized sanitizer (js/xss-through-dom).
                src={toSameOriginImage(photoUrl, 1080)}
                alt=""
                aria-hidden="true"
                crossOrigin="anonymous"
                // A portrait owns the TOP of the frame and fades into the dark
                // ground; the text sits below it (ShareMid). Full-bleed, a
                // square player portrait put the eyes at ~40% height — right
                // where the score and headline land. A story frame gets a square
                // box (eyes at ~20%), a square frame the top 62%.
                // A backdrop holds no face: it covers the whole canvas, unmasked.
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  objectFit: "cover",
                  filter: "sepia(0.32) saturate(0.85) contrast(1.05)",
                  zIndex: 0,
                  ...(photoLayout === "backdrop"
                    ? { height: "100%", objectPosition: "50% 50%" }
                    : {
                        height: height > width ? `${width}px` : "62%",
                        objectPosition: "50% 15%",
                        maskImage:
                          "linear-gradient(180deg, #000 70%, transparent)",
                        WebkitMaskImage:
                          "linear-gradient(180deg, #000 70%, transparent)",
                      }),
                }}
              />
              {/* paper-grain over the photo */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: GRAIN_DATA_URL,
                  mixBlendMode: "multiply",
                  zIndex: 0,
                }}
              />
              {/* jersey-deep gradient overlay keeps text legible */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: overlayGradient(overlay),
                  zIndex: 1,
                }}
              />
            </>
          )}

          {decor && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                overflow: "hidden",
              }}
            >
              {decor}
            </div>
          )}

          <div
            style={{
              position: "relative",
              zIndex: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              padding,
              color: palette.text,
            }}
          >
            {children}
          </div>
        </div>
      </SharePhotoContext.Provider>
    </SharePaletteContext.Provider>
  );
}

/** Round club crest (KCVV logo) used in the top bar. */
function Crest({ size = 96 }: { size?: number }) {
  return (
    <img
      src={KCVV_LOGO}
      alt="KCVV Elewijt"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Top bar: club crest, and — when the enclosing {@link ShareBadgeContext}
 * carries one — a squad badge (`A`, `U21`, `U13A`, …) opposite it. (No social
 * handle — Instagram/Facebook usernames differ, so a single handle would be
 * inconsistent.) `justifyContent: "space-between"` with only the crest mounted
 * renders identically to the pre-badge single-child row, so an absent badge
 * changes nothing for the 11 templates that never supply one.
 */
export function ShareTop({ crestSize }: { crestSize?: number }) {
  const palette = useSharePalette();
  const badge = useContext(ShareBadgeContext);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <Crest size={crestSize} />
      {badge && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "76px",
            padding: "0 30px",
            fontFamily: MONO_FONT,
            fontSize: "46px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            background: palette.badgeBg,
            color: palette.badgeText,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/**
 * One block id per element the middle zone renders, from its JSX slot: a
 * conditional child that renders nothing keeps its index, so a photo that
 * drops the crest matchup does not shift the ids after it. A fragment's
 * children get `w<slot>.<index>`.
 */
function slotIds(children: React.ReactNode, prefix = "w"): string[] {
  const ids: string[] = [];
  Children.forEach(children, (child, i) => {
    if (!isValidElement(child)) return; // null, false, text: no element of its own
    if (child.type === Fragment) {
      const inner = (child.props as { children?: React.ReactNode }).children;
      ids.push(...slotIds(inner, `${prefix}${i}.`));
    } else {
      ids.push(`${prefix}${i}`);
    }
  });
  return ids;
}

/** Flexible middle zone (the per-event content area). */
export function ShareMid({
  center = false,
  children,
  style,
}: {
  center?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const photoLayout = useContext(SharePhotoContext);
  const blocks = useContext(ShareBlocksContext);
  const ref = useRef<HTMLDivElement>(null);
  const ids = blocks ? slotIds(children) : [];
  // The templates stay as they are: their middle-zone children are tagged
  // here, in the DOM. The standalone `translate` property keeps a child's
  // own `transform` (a rotated card). Each child is a flex item, so its
  // z-index applies without a `position`. Should an element ever render no
  // DOM node, the counts differ and nothing is tagged: never a wrong block.
  useLayoutEffect(() => {
    if (!ref.current) return;
    const els = [...ref.current.children];
    if (!blocks) {
      // The layout went away (a thumbnail of a look no longer active): undo
      // only what this effect tagged, never a child's own style.
      els.forEach((child) => {
        if (!(child instanceof HTMLElement) || !child.dataset.block) return;
        delete child.dataset.block;
        child.style.translate = "";
        child.style.zIndex = "";
      });
      return;
    }
    const tag = els.length === ids.length;
    els.forEach((child, i) => {
      if (!(child instanceof HTMLElement)) return;
      const id = tag ? ids[i] : undefined;
      const at = id ? blocks[id] : undefined;
      if (id) child.dataset.block = id;
      else delete child.dataset.block;
      child.style.translate = at ? `${at.x}px ${at.y}px` : "";
      child.style.zIndex = at && id ? String(wedstrijdZ(blocks, id)) : "";
    });
  });
  return (
    <div
      ref={ref}
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        ...(center
          ? {
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }
          : {}),
        ...style,
        // Over a portrait the face owns the upper half: the content sits at
        // the bottom, on the darkest part of the gradient (overlayGradient).
        // A backdrop keeps the template's own placement.
        ...(photoLayout === "portrait"
          ? { justifyContent: "flex-end", gap: "40px" }
          : {}),
      }}
    >
      {children}
    </div>
  );
}

/**
 * Footer: the kcvvelewijt.be wordmark plus an optional `left` label (the
 * matchup) on its own row above it. Alignment follows the template's content:
 * - `"split"` (default) — label left, wordmark right (for left-aligned cards).
 * - `"center"` — both centred and stacked (for centre-aligned cards).
 */
export function ShareFoot({
  left,
  align = "split",
}: {
  left?: React.ReactNode;
  align?: "split" | "center";
}) {
  const palette = useSharePalette();
  const base: React.CSSProperties = {
    fontFamily: MONO_FONT,
    fontSize: "40px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: palette.text,
  };

  if (!left) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: align === "center" ? "center" : "flex-end",
          flexShrink: 0,
        }}
      >
        <span style={base}>KCVVELEWIJT.BE</span>
      </div>
    );
  }

  if (align === "center") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          alignItems: "center",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            ...base,
            color: palette.muted,
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {left}
        </span>
        <span style={base}>KCVVELEWIJT.BE</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          ...base,
          color: palette.muted,
          alignSelf: "flex-start",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {left}
      </span>
      <span style={{ ...base, alignSelf: "flex-end" }}>KCVVELEWIJT.BE</span>
    </div>
  );
}
