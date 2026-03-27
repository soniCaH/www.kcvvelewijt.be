import type { Metadata } from "next";
import { SharePage } from "@/components/share/SharePage/SharePage";

export const metadata: Metadata = {
  title: "Story Generator | KCVV Elewijt",
  robots: { index: false, follow: false },
};

export default function ShareRoute() {
  return <SharePage />;
}
