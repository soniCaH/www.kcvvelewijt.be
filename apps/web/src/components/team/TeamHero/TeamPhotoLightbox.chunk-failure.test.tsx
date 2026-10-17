/**
 * Same contract as the gallery's (#3480): a tap shows the waiting overlay while
 * the viewer chunk loads, and a chunk that never arrives leaves the hero photo
 * in place instead of throwing into the route's error boundary. Its own file
 * because a module loads once per file and this one never loads.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamPhotoLightbox } from "./TeamPhotoLightbox";

const chunk = vi.hoisted(() => {
  let reject!: (error: Error) => void;
  const promise = new Promise<never>((_, r) => {
    reject = r;
  });
  promise.catch(() => {});
  return { promise, reject };
});
vi.mock("./TeamPhotoViewer", async () => chunk.promise);
vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

describe("TeamPhotoLightbox when the viewer chunk is slow, then fails (#3480)", () => {
  it("shows a waiting overlay after the tap, then keeps the photo button clickable", async () => {
    render(
      <TeamPhotoLightbox
        displayName="A-ploeg"
        teamSlug="a-ploeg"
        fullUrl="/fixtures/ploeg-a-full.jpg"
      >
        <span>foto</span>
      </TeamPhotoLightbox>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByText("Foto laden…")).toBeInTheDocument();

    chunk.reject(new Error("Loading chunk failed"));
    await waitFor(() =>
      expect(screen.queryByText("Foto laden…")).not.toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: "Teamfoto van A-ploeg vergroten" }),
    ).toBeInTheDocument();
  });
});
