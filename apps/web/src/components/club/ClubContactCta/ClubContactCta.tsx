import Link from "next/link";

export function ClubContactCta() {
  return (
    <div className="max-w-[70rem] mx-auto px-4 md:px-10">
      <div className="grid grid-cols-[1fr_auto] items-center gap-8 max-[640px]:grid-cols-1 max-[640px]:text-center">
        <div>
          <h2
            className="font-title font-extrabold text-white mb-2"
            style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
          >
            Vragen over de club?
          </h2>
          <p className="text-[0.9375rem] text-white/50">
            Neem contact op — we helpen je graag verder.
          </p>
        </div>
        <Link
          href="/club/contact"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-kcvv-green text-kcvv-black font-bold text-sm uppercase tracking-[0.06em] rounded-sm whitespace-nowrap transition-colors hover:bg-kcvv-green-hover"
        >
          Contacteer ons →
        </Link>
      </div>
    </div>
  );
}
