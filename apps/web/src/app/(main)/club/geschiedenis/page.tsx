import type { Metadata } from "next";
import { HistoryContent } from "./HistoryContent";

export const metadata: Metadata = {
  title: "Geschiedenis | KCVV Elewijt",
  description:
    "Tijdslijn van de rijkgevulde geschiedenis van KCVV Elewijt van 1909 tot nu!",
  keywords: [
    "geschiedenis",
    "history",
    "KCVV Elewijt",
    "tijdslijn",
    "Crossing Elewijt",
  ],
  openGraph: {
    title: "Geschiedenis - KCVV Elewijt",
    description:
      "Tijdslijn van de rijkgevulde geschiedenis van KCVV Elewijt van 1909 tot nu!",
    type: "website",
  },
};

export default function HistoryPage() {
  return <HistoryContent />;
}
