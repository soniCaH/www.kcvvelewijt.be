import { notFound } from "next/navigation";
import { fetchStaffMemberOrNull } from "./page";

interface StaffLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc — this route mirrors it exactly.
 */
export default async function StaffLayout({
  children,
  params,
}: StaffLayoutProps) {
  const { slug } = await params;
  const member = await fetchStaffMemberOrNull(slug);
  if (!member) notFound();
  return children;
}
