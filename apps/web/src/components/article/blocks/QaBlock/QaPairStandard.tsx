import { PortableText, type PortableTextBlock } from "@portabletext/react";

export interface QaPairStandardProps {
  index: number;
  question: string;
  answer: PortableTextBlock[];
}

const formatNumeral = (n: number) => `${n.toString().padStart(2, "0")}.`;

export const QaPairStandard = ({
  index,
  question,
  answer,
}: QaPairStandardProps) => {
  return (
    <div
      className="grid gap-3 md:grid-cols-[4rem_1fr] md:gap-x-16 md:gap-y-0"
      data-testid="qa-pair-standard"
    >
      <div
        aria-hidden="true"
        data-testid="qa-pair-numeral"
        className="font-title text-kcvv-green-bright text-5xl leading-[0.9] font-bold"
      >
        {formatNumeral(index)}
      </div>
      <div>
        <p className="font-title text-kcvv-gray-blue mb-3 text-xl leading-[1.3] font-bold">
          {question}
        </p>
        <div className="text-kcvv-gray-dark text-lg leading-[1.6] [&>p+p]:mt-4">
          <PortableText value={answer} />
        </div>
      </div>
    </div>
  );
};
