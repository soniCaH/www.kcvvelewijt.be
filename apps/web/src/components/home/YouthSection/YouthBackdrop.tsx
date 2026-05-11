import Image from "next/image";

export const YouthBackdrop = () => (
  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="absolute -inset-4">
      <Image
        src="/images/youth-trainers.jpg"
        alt=""
        fill
        className="object-cover object-top blur-[2px]"
        sizes="100vw"
      />
    </div>
    {/* Composed jersey-deep overlay (Round 8c.B). The token bakes in a
        135deg axis for desktop; the locked spec calls for a vertical
        flip on mobile — deferred (token doesn't expose direction; tracked
        as a follow-up on the gradient-token API). */}
    <div
      className="absolute inset-0"
      style={{ backgroundImage: "var(--gradient-jersey-deep-overlay)" }}
    />
    {/* Halftone print texture (Round 8c.D). Cream dots @ 5% on an 8x8 grid,
        screen blend so they layer on top of the gradient without competing. */}
    <div
      className="absolute inset-0 mix-blend-screen"
      style={{
        backgroundImage: "var(--pattern-halftone-dots)",
        backgroundSize: "8px 8px",
      }}
    />
  </div>
);
