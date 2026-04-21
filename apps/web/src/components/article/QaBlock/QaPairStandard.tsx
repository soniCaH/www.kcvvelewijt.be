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
      // Baseline-align the numeral to the question per design §6.1 so the
      // "01." descender line sits on the same baseline as the question text.
      className="grid gap-3 md:grid-cols-[4rem_1fr] md:gap-x-16 md:gap-y-0 md:items-baseline"
      data-testid="qa-pair-standard"
    >
      <div
        aria-hidden="true"
        data-testid="qa-pair-numeral"
        className="font-title font-bold text-5xl leading-[0.9] text-kcvv-green-bright"
      >
        {formatNumeral(index)}
      </div>
      <div>
        <p className="font-title font-bold text-xl leading-[1.3] text-kcvv-gray-blue mb-3">
          {question}
        </p>
        <div className="text-lg leading-[1.6] text-kcvv-gray-dark [&>p+p]:mt-4">
          <PortableText value={answer} />
        </div>
      </div>
    </div>
  );
};
