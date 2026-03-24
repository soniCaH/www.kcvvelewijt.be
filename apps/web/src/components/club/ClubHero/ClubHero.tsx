import Image from "next/image";

export function ClubHero() {
  return (
    <div className="relative">
      {/* Background layers */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-club.jpg"
          alt=""
          fill
          className="object-cover object-[center_30%]"
          style={{ filter: "brightness(0.25) saturate(0.7)" }}
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(30, 32, 36, 0.2) 0%, rgba(30, 32, 36, 0.4) 40%, rgba(0, 135, 85, 0.25) 70%, rgba(30, 32, 36, 0.85) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[60vh] flex items-end">
        <div className="max-w-[70rem] mx-auto px-4 md:px-10 py-10 md:py-16 w-full">
          <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white/50 mb-6">
            <span className="block w-5 h-0.5 bg-kcvv-green" />
            Onze club
          </div>
          <h1
            className="font-title font-black text-white uppercase leading-[0.9] mb-6"
            style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
          >
            De plezantste
            <br />
            <span className="text-kcvv-green">compagnie</span>
          </h1>
          <p className="text-[1.0625rem] text-white/60 leading-[1.7] max-w-[32rem]">
            Al meer dan 75 jaar de thuishaven voor voetballiefhebbers in
            Elewijt. Van de allerkleinsten tot het eerste elftal — bij KCVV is
            iedereen welkom.
          </p>
        </div>
      </div>

      {/* Built-in diagonal */}
      <div
        className="relative w-full"
        style={{ height: "clamp(3rem, 8vw, 7rem)" }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <polygon
            points="0,0 100,0 100,100"
            fill="transparent"
            shapeRendering="crispEdges"
          />
          <polygon
            points="0,0 0,100 100,100"
            fill="var(--color-gray-100)"
            shapeRendering="crispEdges"
          />
        </svg>
      </div>
    </div>
  );
}
