import { LinkButton } from "../LinkButton";

export interface SectionCtaProps {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  /**
   * Visual variant. "light" (default) renders dark text on a light background.
   * "dark" renders white text — use on dark sections (kcvv-black, kcvv-green-dark)
   * to keep the heading and body legible.
   */
  variant?: "light" | "dark";
}

export function SectionCta({
  heading,
  body,
  buttonLabel,
  buttonHref,
  variant = "light",
}: SectionCtaProps) {
  const isDark = variant === "dark";
  return (
    <div className="mx-auto max-w-[40rem] px-4 text-center md:px-10">
      <h2
        className={`font-title mb-3 font-extrabold ${
          isDark ? "text-white" : "text-kcvv-black"
        }`}
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        {heading}
      </h2>

      <p
        className={`mb-8 text-sm leading-relaxed ${
          isDark ? "text-white/75" : "text-kcvv-gray"
        }`}
      >
        {body}
      </p>

      <LinkButton href={buttonHref} withArrow>
        {buttonLabel}
      </LinkButton>
    </div>
  );
}
