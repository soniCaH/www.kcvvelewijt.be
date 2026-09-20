"use client";

import React, { createContext, useContext } from "react";
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

export interface ShareFrameProps {
  /** Canvas width in px (1080 for both Story and Square). */
  width: number;
  /** Canvas height in px (1920 Story / 1080 Square). */
  height: number;
  register: ShareRegister;
  sentiment?: ShareSentiment;
  /** Fullscreen photo URL — required when `register === "image"`. */
  imageUrl?: string;
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              // Route + sanitize at the sink: remote CDN images go through the
              // same-origin Next optimizer (so html-to-image can read them),
              // every path runs through a recognized sanitizer (js/xss-through-dom).
              src={toSameOriginImage(photoUrl, 1080)}
              alt=""
              aria-hidden="true"
              crossOrigin="anonymous"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "sepia(0.32) saturate(0.85) contrast(1.05)",
                zIndex: 0,
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
    </SharePaletteContext.Provider>
  );
}

/** Round club crest (KCVV logo) used in the top bar. */
function Crest({ size = 96 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
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
  return (
    <div
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
