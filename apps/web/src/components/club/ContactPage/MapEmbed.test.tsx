import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapEmbed } from "./MapEmbed";

describe("MapEmbed", () => {
  it("renders a lazy OpenStreetMap iframe pinned on the club ground", () => {
    render(<MapEmbed />);
    const iframe = screen.getByTitle(
      "Locatie KCVV Elewijt - Driesstraat 32, 1982 Elewijt",
    );
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("50.9705214%2C4.5012206"),
    );
    expect(iframe).toHaveAttribute("loading", "lazy");
  });
});
