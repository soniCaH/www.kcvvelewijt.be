import { Suspense } from "react";
import {
  MatchStripClient,
  MatchStripSkeleton,
} from "@/components/layout/MatchStrip";
import { getFirstTeamNextMatch } from "@/lib/server/match-data";

async function MatchStripLoader() {
  const nextMatch = await getFirstTeamNextMatch();
  return <MatchStripClient match={nextMatch} />;
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense fallback={<MatchStripSkeleton />}>
        <MatchStripLoader />
      </Suspense>
      {children}
    </>
  );
}
