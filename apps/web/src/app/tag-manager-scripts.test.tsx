import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next/script", () => ({
  default: ({ children, id }: { children?: string; id?: string }) => (
    <script data-testid={id}>{children}</script>
  ),
}));

import { TagManagerScripts } from "./tag-manager-scripts";

describe("TagManagerScripts", () => {
  it("renders the consent default and the GTM loader outside preview mode", () => {
    const { container } = render(
      <TagManagerScripts gtmId="GTM-TEST123" preview={false} />,
    );
    expect(
      container.querySelector('[data-testid="gtm-consent-default"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="gtm-init"]')?.textContent,
    ).toContain("GTM-TEST123");
  });

  it("renders no script at all in preview mode", () => {
    const { container } = render(
      <TagManagerScripts gtmId="GTM-TEST123" preview />,
    );
    expect(container.innerHTML).toBe("");
  });
});
