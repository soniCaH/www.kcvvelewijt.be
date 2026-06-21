import {
  EditorialHeading,
  MonoLabel,
  PageContainer,
} from "@/components/design-system";
import type { GalleryCardVM } from "@/lib/repositories/photoGallery.repository";
import { GalleryCardGrid } from "../GalleryCardGrid/GalleryCardGrid";

export interface GallerySectionProps {
  galleries: GalleryCardVM[];
  /** Mono kicker above the heading (e.g. "KCVV Elewijt · Beelden"). */
  kicker?: string;
  /** Section heading. Default "Foto's". */
  title?: string;
}

/**
 * Gallery-cards block embedded on a match or event detail page. Renders all
 * linked galleries (already chronological from the repo) as cards; returns
 * `null` when there are none so the host page auto-hides the section — the
 * "0 → no UI, ≥1 → cards" rule, with no thumb-strip/cards duality.
 */
export const GallerySection = ({
  galleries,
  kicker,
  title = "Foto's",
}: GallerySectionProps) => {
  if (galleries.length === 0) return null;

  return (
    <PageContainer as="section" className="py-12">
      <header className="mb-8">
        {kicker && <MonoLabel tone="ink">{kicker}</MonoLabel>}
        <EditorialHeading
          level={2}
          size="display-md"
          tone="ink"
          className="mt-2"
        >
          {title}
        </EditorialHeading>
      </header>
      <GalleryCardGrid galleries={galleries} />
    </PageContainer>
  );
};
