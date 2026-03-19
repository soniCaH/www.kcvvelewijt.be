/**
 * Dynamic Open Graph Image for Player Pages
 *
 * Generates a custom OG image for each player with:
 * - KCVV branding and gradient background
 * - Large jersey number as watermark
 * - Player name with first name (semibold) / last name (thin) styling
 * - Position and team information
 * - Green accent bar at bottom
 */

import { ImageResponse } from "next/og";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate an Open Graph PNG for a player identified by the provided slug.
 *
 * @param params - Object with a `slug` string identifying the player
 * @returns An ImageResponse with a 1200×630 PNG showing the player's name, optional jersey-number watermark, position and team, a green bottom accent bar, and KCVV branding
 */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;

  // Fetch player data
  let firstName = "";
  let lastName = "";
  let position = "";
  let teamName = "KCVV Elewijt";
  let number: number | undefined;

  try {
    const player = await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getPlayerByPsdId(slug);
      }),
    );

    if (player) {
      firstName = player.firstName ?? "";
      lastName = player.lastName ?? "";
      position = player.keeper
        ? "Keeper"
        : (player.position ?? player.positionPsd ?? "");
      number = player.jerseyNumber ?? undefined;
      teamName = "KCVV Elewijt";
    }
  } catch {
    // Use fallback values if player not found
    firstName = "KCVV";
    lastName = "Elewijt";
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #edeff4 0%, #ffffff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Jersey number watermark */}
      {number !== undefined && (
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 40,
            fontSize: 400,
            fontWeight: 900,
            color: "rgba(75, 155, 72, 0.15)",
            lineHeight: 0.8,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {number}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* First name - semibold */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 600,
            color: "#2b4162",
            textTransform: "uppercase",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {firstName}
        </div>

        {/* Last name - thin */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 300,
            color: "#2b4162",
            textTransform: "uppercase",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          {lastName}
        </div>

        {/* Position and team */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#6b7280",
            fontSize: 32,
          }}
        >
          {position && (
            <>
              <span style={{ fontWeight: 500 }}>{position}</span>
              <span style={{ color: "#4acf52" }}>•</span>
            </>
          )}
          <span>{teamName}</span>
        </div>
      </div>

      {/* Green accent bar at bottom */}
      <div
        style={{
          height: 12,
          width: "100%",
          background: "linear-gradient(90deg, #4acf52 0%, #4B9B48 100%)",
        }}
      />

      {/* KCVV logo/text in corner */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 60,
          fontSize: 24,
          fontWeight: 600,
          color: "#4acf52",
        }}
      >
        KCVV ELEWIJT
      </div>
    </div>,
    {
      ...size,
    },
  );
}
