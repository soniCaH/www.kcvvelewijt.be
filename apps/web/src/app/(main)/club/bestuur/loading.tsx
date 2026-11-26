/**
 * Board Page — Loading Skeleton.
 *
 * Thin wrapper over the shared `<BoardPageLoading>` (see
 * `@/components/club/BestuurPage/BoardPageLoading`), which mirrors the
 * `BestuurPage` shell shared by `/club/bestuur`, `/club/angels`, and
 * `/club/jeugdbestuur`. Only the sr-only status label differs per route.
 */

import { BoardPageLoading } from "@/components/club/BestuurPage/BoardPageLoading";

const BoardLoading = () => {
  return <BoardPageLoading label="Bestuur laden…" />;
};

export default BoardLoading;
