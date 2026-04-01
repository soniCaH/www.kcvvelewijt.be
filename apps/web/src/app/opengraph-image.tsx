/**
 * Default Open Graph Image
 *
 * Generates a fallback OG image (1200x630) for pages that don't define their own.
 * Black-to-dark-green (#008755) gradient background with the club logo centered.
 */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/images/logos/kcvv-logo.png"),
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #000000 0%, #008755 100%)",
      }}
    >
      <img src={logoBase64} alt="" width={280} height={280} />
    </div>,
    { ...size },
  );
}
