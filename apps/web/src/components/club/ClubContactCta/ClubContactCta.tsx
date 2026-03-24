import Link from "next/link";
import { ArrowRight } from "@/lib/icons";

export function ClubContactCta() {
  return (
    <div className="max-w-inner-lg mx-auto px-4 md:px-10">
      <div className="grid grid-cols-[1fr_auto] items-center gap-8 max-sm:grid-cols-1 max-sm:text-center">
        <div>
          <h2 className="font-title font-extrabold text-kcvv-gray-blue text-xl md:text-4xl mb-2">
            Vragen over de club?
          </h2>
          <p className="text-sm text-kcvv-gray">
            Neem contact op — we helpen je graag verder.
          </p>
        </div>
        <Link
          href="/club/contact"
          className="group inline-flex items-center gap-2 px-8 py-3.5 bg-kcvv-green text-kcvv-black font-bold text-sm uppercase tracking-[0.06em] rounded-sm whitespace-nowrap transition-colors hover:bg-kcvv-green-hover"
        >
          Contacteer ons
          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}
