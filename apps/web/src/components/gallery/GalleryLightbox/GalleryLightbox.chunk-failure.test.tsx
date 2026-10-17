/**
 * The viewer is a lazy chunk (#3480). While it loads, a tap gets the waiting
 * overlay; if it never arrives (deploy skew, flaky network) the gallery grid
 * must stay on screen rather than throw into the route's error boundary. Its
 * own file because a module loads once per file and this one never loads.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GalleryLightbox } from "./GalleryLightbox";

const chunk = vi.hoisted(() => {
  let reject!: (error: Error) => void;
  const promise = new Promise<never>((_, r) => {
    reject = r;
  });
  promise.catch(() => {});
  return { promise, reject };
});
vi.mock("./GalleryViewer", async () => chunk.promise);

const IMAGES = [
  { url: "https://cdn.sanity.io/images/p/d/a.jpg" },
  { url: "https://cdn.sanity.io/images/p/d/b.jpg" },
];

describe("GalleryLightbox when the viewer chunk is slow, then fails (#3480)", () => {
  it("shows a waiting overlay after the tap, then keeps the thumbnails clickable", async () => {
    render(<GalleryLightbox gallerySlug="zemst-derby" images={IMAGES} />);

    fireEvent.click(screen.getByRole("button", { name: /Foto 2 van 2/ }));
    expect(await screen.findByText("Foto laden…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    chunk.reject(new Error("Loading chunk failed"));
    await waitFor(() =>
      expect(screen.queryByText("Foto laden…")).not.toBeInTheDocument(),
    );

    // The grid survived, and a second tap does not throw.
    const thumbs = screen.getAllByRole("button", { name: /vergroten/ });
    expect(thumbs).toHaveLength(2);
    fireEvent.click(thumbs[0]!);
    expect(screen.getAllByRole("button", { name: /vergroten/ })).toHaveLength(
      2,
    );
  });
});
