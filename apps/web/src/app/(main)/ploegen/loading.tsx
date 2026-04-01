/**
 * Teams Landing Page — Loading Skeleton
 * Uses Spinner for this complex multi-section layout (PageHero + featured cards + youth directory)
 */

import { Spinner } from "@/components/design-system/Spinner/Spinner";

export default function TeamsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-kcvv-black">
      <Spinner variant="logo" size="xl" label="Ploegen laden..." />
    </div>
  );
}
