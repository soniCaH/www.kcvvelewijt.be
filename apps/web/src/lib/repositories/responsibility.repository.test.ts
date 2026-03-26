import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { RESPONSIBILITY_PATHS_QUERY_RESULT } from "../sanity/sanity.types";
import type { ResponsibilityPath } from "@/types/responsibility";

vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  ResponsibilityRepository,
  ResponsibilityRepositoryLive,
} from "./responsibility.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(
  effect: Effect.Effect<A, never, ResponsibilityRepository>,
) {
  return Effect.runPromise(
    Effect.provide(effect, ResponsibilityRepositoryLive),
  );
}

type PathRow = RESPONSIBILITY_PATHS_QUERY_RESULT[number];

function makeContact(
  overrides: Partial<NonNullable<PathRow["primaryContact"]>> = {},
): NonNullable<PathRow["primaryContact"]> {
  return {
    role: "Voorzitter",
    email: "jan@kcvv.be",
    phone: "+32 123 456 789",
    department: "hoofdbestuur",
    name: "Jan Janssens",
    memberId: "staff-1",
    ...overrides,
  };
}

function makePathRow(overrides: Partial<PathRow> = {}): PathRow {
  return {
    id: "blessure-melden",
    role: ["speler", "ouder"],
    question: "Hoe meld ik een blessure?",
    keywords: ["blessure", "dokter"],
    summary: "Neem contact op met de trainer",
    category: "medisch",
    icon: "medical",
    primaryContact: makeContact(),
    steps: [
      {
        description: "Contacteer je trainer",
        link: "https://kcvv.be/hulp",
        contact: makeContact({ role: "Trainer", name: "Piet Pieters" }),
      },
      {
        description: "Neem contact op met het bestuur",
        link: null,
        contact: null,
      },
    ],
    relatedPaths: ["transfer-aanvragen", "verzekering"],
    ...overrides,
  };
}

describe("ResponsibilityRepository", () => {
  describe("findAll", () => {
    it("maps full nested shape to ResponsibilityPathVM[]", async () => {
      const row = makePathRow();
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ResponsibilityRepository;
          return yield* repo.findAll();
        }),
      );

      expect(paths).toHaveLength(1);
      const path = paths[0];

      expect(path).toEqual<ResponsibilityPath>({
        id: "blessure-melden",
        role: ["speler", "ouder"],
        question: "Hoe meld ik een blessure?",
        keywords: ["blessure", "dokter"],
        summary: "Neem contact op met de trainer",
        category: "medisch",
        icon: "medical",
        primaryContact: {
          role: "Voorzitter",
          name: "Jan Janssens",
          email: "jan@kcvv.be",
          phone: "+32 123 456 789",
          department: "hoofdbestuur",
          memberId: "staff-1",
        },
        steps: [
          {
            order: 1,
            description: "Contacteer je trainer",
            link: "https://kcvv.be/hulp",
            contact: {
              role: "Trainer",
              name: "Piet Pieters",
              email: "jan@kcvv.be",
              phone: "+32 123 456 789",
              department: "hoofdbestuur",
              memberId: "staff-1",
            },
          },
          {
            order: 2,
            description: "Neem contact op met het bestuur",
          },
        ],
        relatedPaths: ["transfer-aanvragen", "verzekering"],
      });
    });

    it("missing optional contact fields use fallback values", async () => {
      const row = makePathRow({
        icon: null,
        primaryContact: makeContact({
          role: null,
          name: null,
          email: null,
          phone: null,
          department: null,
          memberId: null,
        }),
        steps: [
          {
            description: "Stap 1",
            link: null,
            contact: makeContact({
              role: null,
              name: null,
              email: null,
              phone: null,
              department: null,
              memberId: null,
            }),
          },
        ],
      });
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ResponsibilityRepository;
          return yield* repo.findAll();
        }),
      );

      const path = paths[0];

      // icon should be absent when null
      expect(path.icon).toBeUndefined();

      // role defaults to empty string, other null fields are omitted
      expect(path.primaryContact).toEqual({ role: "" });
      expect(path.steps[0].contact).toEqual({ role: "" });
    });

    it("relatedPaths resolved to slugs", async () => {
      const row = makePathRow({
        relatedPaths: ["transfer-aanvragen", "verzekering"],
      });
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ResponsibilityRepository;
          return yield* repo.findAll();
        }),
      );

      // relatedPaths should be passed through as-is from GROQ result
      expect(paths[0].relatedPaths).toEqual([
        "transfer-aanvragen",
        "verzekering",
      ]);
    });

    it("step without contact omits contact field", async () => {
      const row = makePathRow({
        steps: [{ description: "Doe iets", link: null, contact: null }],
      });
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ResponsibilityRepository;
          return yield* repo.findAll();
        }),
      );

      expect(paths[0].steps[0]).toEqual({
        order: 1,
        description: "Doe iets",
      });
      expect(paths[0].steps[0].contact).toBeUndefined();
      expect(paths[0].steps[0].link).toBeUndefined();
    });
  });
});
