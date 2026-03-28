/**
 * Dynamic Open Graph Image for Staff Member Pages
 *
 * Generates a custom OG image for each staff member with:
 * - KCVV branding and gradient background
 * - Role label as watermark (instead of jersey number)
 * - Staff member name with first name (semibold) / last name (thin) styling
 * - Role and team information
 * - Green accent bar at bottom
 */

import { ImageResponse } from "next/og";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;

  let firstName = "";
  let lastName = "";
  let roleDisplay = "";
  let roleWatermark = "";
  const teamName = "KCVV Elewijt";

  try {
    const member = await runPromise(
      Effect.gen(function* () {
        const repo = yield* StaffRepository;
        return yield* repo.findByPsdId(slug);
      }),
    );

    if (member) {
      firstName = member.firstName;
      lastName = member.lastName;
      roleDisplay = member.roleDisplay ?? member.roleLabel ?? "";
      // Use abbreviated role as watermark (max ~6 chars, uppercase)
      roleWatermark = (roleDisplay ?? "").slice(0, 6).toUpperCase();
    } else {
      firstName = "KCVV";
      lastName = "Elewijt";
    }
  } catch {
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
      {/* Role watermark */}
      {roleWatermark && (
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 20,
            fontSize: 260,
            fontWeight: 900,
            color: "rgba(75, 155, 72, 0.12)",
            lineHeight: 0.9,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.04em",
          }}
        >
          {roleWatermark}
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

        {/* Role and team */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#6b7280",
            fontSize: 32,
          }}
        >
          {roleDisplay && (
            <>
              <span style={{ fontWeight: 500 }}>{roleDisplay}</span>
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
