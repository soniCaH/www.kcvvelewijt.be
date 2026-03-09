/**
 * Dynamic Open Graph Image for Team Pages
 *
 * Generates a custom OG image for each team with:
 * - KCVV branding and gradient background
 * - Age group badge as watermark
 * - Team name with KCVV styling
 * - Division/tagline information
 * - Blue accent bar at bottom (for youth teams)
 */

import { ImageResponse } from "next/og";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { getSanityAgeGroup, getSanityTeamTagline } from "./utils";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate an Open Graph PNG image for a team identified by the provided slug.
 *
 * @param params - A promise that resolves to an object containing the `slug` string
 * @returns An ImageResponse containing a 1200x630 PNG with team name, age group badge, and KCVV branding
 */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;

  // Fetch team data
  let teamName = "KCVV Elewijt";
  let ageGroup: string | undefined;
  let tagline: string | undefined;

  try {
    const team = await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getTeamBySlug(slug);
      }),
    );

    if (team) {
      teamName = team.name;
      ageGroup = getSanityAgeGroup(team);
      tagline = getSanityTeamTagline(team);
    }
  } catch {
    // Use fallback values if team not found
    teamName = "KCVV Elewijt";
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
      {/* Age group watermark */}
      {ageGroup && (
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 40,
            fontSize: 400,
            fontWeight: 900,
            color: "rgba(59, 130, 246, 0.12)",
            lineHeight: 0.8,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {ageGroup}
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
        {/* Age group badge */}
        {ageGroup && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "8px 24px",
                fontSize: 28,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {ageGroup}
            </div>
          </div>
        )}

        {/* Team name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#2b4162",
            textTransform: "uppercase",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 24,
            maxWidth: "80%",
          }}
        >
          {teamName}
        </div>

        {/* Tagline/Division */}
        {tagline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "#6b7280",
              fontSize: 32,
            }}
          >
            <span>{tagline}</span>
          </div>
        )}
      </div>

      {/* Blue accent bar at bottom (for youth teams) */}
      <div
        style={{
          height: 12,
          width: "100%",
          background: ageGroup
            ? "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)"
            : "linear-gradient(90deg, #4acf52 0%, #4B9B48 100%)",
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
          color: ageGroup ? "#3b82f6" : "#4acf52",
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
