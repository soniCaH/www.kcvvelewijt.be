import { LinkButton } from "../LinkButton";

export interface SectionCtaProps {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
}

export function SectionCta({
  heading,
  body,
  buttonLabel,
  buttonHref,
}: SectionCtaProps) {
  return (
    <div className="max-w-[40rem] mx-auto px-4 md:px-10 text-center">
      <h2
        className="font-title font-extrabold text-kcvv-black mb-3"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        {heading}
      </h2>

      <p className="text-sm text-kcvv-gray mb-8 leading-relaxed">{body}</p>

      <LinkButton href={buttonHref} withArrow>
        {buttonLabel}
      </LinkButton>
    </div>
  );
}
