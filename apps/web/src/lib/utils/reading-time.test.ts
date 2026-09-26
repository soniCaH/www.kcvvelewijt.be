import { describe, it, expect } from "vitest";
import { computeReadingTime } from "./reading-time";

const block = (text: string) => ({
  _type: "block" as const,
  children: [{ _type: "span" as const, text }],
});

/**
 * Captured verbatim from production on 2026-09-03 — the first pair of
 * `/nieuws/vincent-haegeman-geen-afscheidsinterview`, the article that
 * surfaced #2521:
 *
 * ```
 * *[_type=="article" && slug.current=="vincent-haegeman-geen-afscheidsinterview"][0]
 *   .body[_type=="qaBlock"][0].pairs[0]
 * ```
 *
 * It is copied rather than invented **on purpose**. `AnyQaPair` used to declare
 * `answer` on the pair itself, so a fixture written from the type would have
 * reproduced the bug instead of catching it — the reason the previous version of
 * this test passed against broken code for weeks. The answer lives one level
 * deeper, inside `respondents[]`. If this shape ever stops matching the CMS,
 * that is the bug, not the fixture.
 */
const realQaPair = {
  _type: "qaPair" as const,
  question:
    "Van jeugdspeler tot kapitein van de B-ploeg: heel wat jaren groen-wit in de benen. Hoe voelt dat als je even stilstaat?",
  respondents: [
    {
      _type: "qaPairRespondent" as const,
      respondentKey: "c76e39a80c72",
      answer: [
        block(
          "Toch wel bijzonder. Ik denk dat ik in 2001 of 2002 begonnen ben (daarvoor zat ik bij Weerde, maar we gaan hier niet over de grote rivaal van weleer spreken, sst). Als jeugdspeler woonde ik twee straten verder, maar ook toen ik verhuisde naar Leuven en later Mechelen, leidde de weg steeds terug naar Den Reggel. Telkens met evenveel plezier. Ik heb er héél veel spelers zien passeren, maar van de overgrote meerderheid hou ik enkel positieve herinneringen over.",
        ),
      ],
    },
  ],
};

/**
 * The article's own prose blocks, captured in the same query — the standfirst,
 * the intro and the outro. Verbatim, for the same reason as the pair above.
 */
const realProse = [
  block("Bijna 25 jaar groen-wit, en toch geen echt vaarwel."),
  block(
    "Hij begon in 2001 of 2002 (zelf weet hij het niet helemaal zeker meer) bij de miniemen, werd uiteindelijk kapitein van de B-ploeg en is intussen één van de gezichten van groen-wit. Vincent Haegeman sluit voorlopig zijn hoofdstuk bij de B-ploeg af, maar hoopt volgend seizoen aan te sluiten bij de op te starten zaterdagreserven. Wij legden hem elf vragen voor — al is dit dus géén afscheidsinterview.",
  ),
  block(
    "Bijna 25 jaar Den Reggel in de benen, kapitein van de B-ploeg, penalty-koning, all-star-coach en (tot bewijs van het tegendeel) eersteklas Adele-zanger. Merci voor alles, Vinnie — en hopelijk zien we je volgend seizoen gewoon op zaterdag terug in groen-wit.",
  ),
];

const qaBlock = (pairs: unknown[]) => ({
  _type: "qaBlock" as const,
  pairs: pairs as (typeof realQaPair)[],
});

describe("computeReadingTime", () => {
  it("returns undefined for a null body", () => {
    expect(computeReadingTime(null)).toBeUndefined();
    expect(computeReadingTime(undefined)).toBeUndefined();
  });

  it("returns undefined when the body is shorter than the estimation threshold", () => {
    expect(computeReadingTime([block("Te kort.")])).toBeUndefined();
  });

  it("returns undefined when body array is empty", () => {
    expect(computeReadingTime([])).toBeUndefined();
  });

  it("returns 1 min for content at the lower estimation bound", () => {
    const body = [block(Array.from({ length: 50 }, () => "woord").join(" "))];
    expect(computeReadingTime(body)).toBe("1 min lezen");
  });

  it("returns 4 min for approximately 800 words", () => {
    const body = [block(Array.from({ length: 800 }, () => "woord").join(" "))];
    expect(computeReadingTime(body)).toBe("4 min lezen");
  });

  describe("qaBlock", () => {
    it("counts the answer, which lives inside respondents[] and not on the pair (#2521)", () => {
      // Each real pair is 21 question words + 79 answer words. Three of them:
      // 300 words -> "2 min lezen" with the answers counted, 63 -> "1 min lezen"
      // without. One pair alone cannot prove this — 100 words and 21 words both
      // round to "1 min", so the assertion has to clear a minute boundary.
      const body = [qaBlock(Array.from({ length: 3 }, () => realQaPair))];
      expect(computeReadingTime(body)).toBe("2 min lezen");
    });

    it("scales with the real article's shape — 6 min, not 1 (#2521)", () => {
      // Mirrors the live article: real intro prose, 11 qaPairs, real outro.
      // 119 prose words + 11 x 100 = 1,219 -> "6 min lezen". Counting only the
      // questions gives 119 + 11 x 21 = 350 -> "2 min lezen", and on the real
      // document 285 -> "1 min lezen". Either way the answers are the story.
      //
      // The prose is here to keep the assertion off a rounding knife-edge: 11
      // bare pairs total exactly 1,100 words = 5.5 min, which only reaches 6
      // via Math.round's half-up rule, so deleting one fixture word would flip
      // it to "5 min". With the prose there is 117 words of margin.
      const body = [
        ...realProse,
        qaBlock(Array.from({ length: 11 }, () => realQaPair)),
      ];
      expect(computeReadingTime(body)).toBe("6 min lezen");
    });

    it("counts every respondent when two people answer one question", () => {
      const twoRespondents = {
        ...realQaPair,
        respondents: [
          realQaPair.respondents[0]!,
          {
            _type: "qaPairRespondent" as const,
            respondentKey: "second-speaker",
            answer: [
              block(Array.from({ length: 300 }, () => "antwoord").join(" ")),
            ],
          },
        ],
      };
      // 100 words from the real pair + 300 from the second respondent = 400 -> 2 min.
      expect(computeReadingTime([qaBlock([twoRespondents])])).toBe(
        "2 min lezen",
      );
    });

    it("mixes qaBlock answers with surrounding prose blocks", () => {
      const body = [
        block(Array.from({ length: 100 }, () => "intro").join(" ")),
        qaBlock([realQaPair]),
        block(Array.from({ length: 100 }, () => "outro").join(" ")),
      ];
      // 100 + 100 + 100 = 300 -> "2 min lezen". Drop the answer and it is
      // 100 + 21 + 100 = 221 -> "1 min lezen", so the prose cannot mask a
      // regression in the qaBlock branch.
      expect(computeReadingTime(body)).toBe("2 min lezen");
    });

    it("survives a pair with no respondents and a respondent with no answer", () => {
      const body = [
        block(Array.from({ length: 60 }, () => "woord").join(" ")),
        qaBlock([
          { _type: "qaPair", question: "Vraag zonder antwoord?" },
          {
            _type: "qaPair",
            question: "Vraag met lege respondent?",
            respondents: [{ _type: "qaPairRespondent", respondentKey: "x" }],
          },
        ]),
      ];
      expect(computeReadingTime(body)).toBe("1 min lezen");
    });
  });

  describe("pullQuote (#2517)", () => {
    const pullQuote = (text: string) => ({
      _type: "pullQuote" as const,
      body: [block(text)],
    });

    it("counts the quote text", () => {
      // 150 intro words + 150 quote words = 300 -> "2 min lezen". Without
      // the quote, 150 words alone rounds to "1 min" — the boundary the
      // qaBlock tests above use for the same reason: a single fixture too
      // short to cross a minute can't prove a branch actually ran.
      const body = [
        block(Array.from({ length: 150 }, () => "intro").join(" ")),
        pullQuote(Array.from({ length: 150 }, () => "citaat").join(" ")),
      ];
      expect(computeReadingTime(body)).toBe("2 min lezen");
      expect(computeReadingTime([body[0]!])).toBe("1 min lezen");
    });

    it("mixes a pullQuote with surrounding prose", () => {
      const body = [
        block(Array.from({ length: 200 }, () => "intro").join(" ")),
        pullQuote(Array.from({ length: 200 }, () => "citaat").join(" ")),
        block(Array.from({ length: 200 }, () => "outro").join(" ")),
      ];
      // 600 words with the quote -> "3 min lezen"; 400 without it -> "2 min"
      // — the prose alone cannot mask a regression in the pullQuote branch.
      expect(computeReadingTime(body)).toBe("3 min lezen");
      expect(computeReadingTime([body[0]!, body[2]!])).toBe("2 min lezen");
    });

    it("survives a pullQuote with no body", () => {
      const body = [
        block(Array.from({ length: 60 }, () => "woord").join(" ")),
        { _type: "pullQuote" as const },
      ];
      expect(computeReadingTime(body)).toBe("1 min lezen");
    });
  });
});
