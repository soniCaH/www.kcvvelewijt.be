import { MatchStrip } from "@/components/layout/MatchStrip";
import { getFirstTeamNextMatch } from "@/lib/server/match-data";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nextMatch = await getFirstTeamNextMatch();

  return (
    <>
      <MatchStrip match={nextMatch} />
      {children}
    </>
  );
}
