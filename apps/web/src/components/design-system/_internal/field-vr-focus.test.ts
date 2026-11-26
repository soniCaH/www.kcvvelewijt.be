import { describe, expect, it } from "vitest";
import { forceFieldFocusRing } from "./field-vr-focus";

describe("forceFieldFocusRing", () => {
  it("marks every input, textarea and select, and nothing else", () => {
    const container = document.createElement("div");
    container.innerHTML =
      "<input /><textarea></textarea><select></select><button></button>";

    forceFieldFocusRing(container);

    ["input", "textarea", "select"].forEach((tag) => {
      expect(container.querySelector(tag)).toHaveAttribute(
        "data-vr-force-ring",
        "true",
      );
    });
    expect(container.querySelector("button")).not.toHaveAttribute(
      "data-vr-force-ring",
    );
  });
});
