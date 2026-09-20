/**
 * Word lid — Loading Skeleton.
 *
 * `/club/word-lid` is fully static (`page.tsx`'s own docblock: "The page is
 * static") — no data fetch, no CMS read, so per #2432 §2 this reuses the
 * real composition unshimmered rather than drawing bars for content that
 * never varies: `<PageHero>` (kicker, headline, lead and up-link are all
 * fixed copy) and `<MembershipForm>` (its own fields have no server data
 * dependency; the one `fetch` it owns runs on submit, not on mount).
 *
 * Exists because this route previously had no `loading.tsx` of its own and
 * so inherited `/club/loading.tsx` — the `/club` INDEX's skeleton, wrong
 * opening entirely, and missing this route's own up-link (review round 2,
 * #2570).
 */

import Link from "next/link";
import { PageContainer, LoadingAnnouncement } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { MembershipForm } from "@/components/club/MembershipForm/MembershipForm";

export default function WordLidLoading() {
  return (
    <div className="bg-cream pb-12 lg:pb-16">
      <LoadingAnnouncement label="Word lid laden…" />

      <PageContainer width="prose">
        <PageHero
          register="minimal"
          kicker="Sluit je aan"
          headline="Doe mee"
          accent="mee"
          lead="Speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter — vul het formulier in en we nemen binnenkort contact met je op. Dit is een aanvraag: sommige ploegen zitten vol, dus een plekje is niet altijd gegarandeerd."
          upLink={{ href: "/club", label: "De club" }}
        >
          <p className="text-body-md mt-4">
            <Link href="/club/praktische-informatie" className="prose-link">
              Praktische info →
            </Link>
          </p>
        </PageHero>

        <MembershipForm />
      </PageContainer>
    </div>
  );
}
