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

function runFindAll() {
  return runWithRepo(
    Effect.gen(function* () {
      const repo = yield* ResponsibilityRepository;
      return yield* repo.findAll();
    }),
  );
}

type PathRow = RESPONSIBILITY_PATHS_QUERY_RESULT[number];

function makeContact(
  overrides: Partial<NonNullable<PathRow["primaryContact"]>> = {},
): NonNullable<PathRow["primaryContact"]> {
  return {
    contactType: "position",
    teamRole: null,
    teamRoleFallback: null,
    position: "Secretaris",
    roleCode: "SEC",
    members: [
      {
        id: "staffMember-1",
        name: "Jan Janssens",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
      },
    ],
    nodeId: "organigramNode-secretaris",
    role: null,
    email: null,
    phone: null,
    department: null,
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
        description: "Contacteer de secretaris",
        link: "https://kcvv.be/hulp",
        contact: makeContact({
          position: "TVJO",
          roleCode: "TVJO",
          members: [
            {
              id: "staffMember-2",
              name: "Piet Pieters",
              email: "piet@kcvv.be",
              phone: null,
            },
          ],
          nodeId: "organigramNode-tvjo",
        }),
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
    it("maps position contact with members to ResponsibilityPath", async () => {
      const row = makePathRow();
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runFindAll();

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
          contactType: "position",
          position: "Secretaris",
          roleCode: "SEC",
          members: [
            {
              id: "staffMember-1",
              name: "Jan Janssens",
              email: "jan@kcvv.be",
              phone: "+32 123 456 789",
            },
          ],
          nodeId: "organigramNode-secretaris",
        },
        steps: [
          {
            order: 1,
            description: "Contacteer de secretaris",
            link: "https://kcvv.be/hulp",
            contact: {
              contactType: "position",
              position: "TVJO",
              roleCode: "TVJO",
              members: [
                {
                  id: "staffMember-2",
                  name: "Piet Pieters",
                  email: "piet@kcvv.be",
                },
              ],
              nodeId: "organigramNode-tvjo",
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

    it("maps manual contact with inline fields", async () => {
      const row = makePathRow({
        primaryContact: makeContact({
          contactType: "manual",
          position: null,
          roleCode: null,
          members: null,
          nodeId: null,
          role: "Verzekering",
          email: "verzekering@kcvvelewijt.be",
          phone: null,
          department: "algemeen",
        }),
      });
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runFindAll();
      const contact = paths[0].primaryContact;

      expect(contact).toEqual({
        contactType: "manual",
        role: "Verzekering",
        email: "verzekering@kcvvelewijt.be",
        department: "algemeen",
      });
    });

    it("maps team-role contact", async () => {
      const row = makePathRow({
        primaryContact: makeContact({
          contactType: "team-role",
          teamRole: "trainer",
          position: null,
          roleCode: null,
          members: null,
          nodeId: null,
        }),
      });
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runFindAll();
      const contact = paths[0].primaryContact;

      expect(contact).toEqual({
        contactType: "team-role",
        teamRole: "trainer",
      });
    });

    it("missing optional contact fields use fallback values", async () => {
      const row = makePathRow({
        icon: null,
        primaryContact: makeContact({
          contactType: null,
          position: null,
          roleCode: null,
          members: null,
          nodeId: null,
          teamRole: null,
          role: null,
          email: null,
          phone: null,
          department: null,
        }),
        steps: [
          {
            description: "Stap 1",
            link: null,
            contact: makeContact({
              contactType: null,
              position: null,
              roleCode: null,
              members: null,
              nodeId: null,
              teamRole: null,
              role: null,
              email: null,
              phone: null,
              department: null,
            }),
          },
        ],
      });
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runFindAll();
      const path = paths[0];

      expect(path.icon).toBeUndefined();
      expect(path.primaryContact).toEqual({ contactType: "manual" });
      expect(path.steps[0].contact).toEqual({ contactType: "manual" });
    });

    it("relatedPaths resolved to slugs", async () => {
      const row = makePathRow({
        relatedPaths: ["transfer-aanvragen", "verzekering"],
      });
      mockFetch.mockResolvedValueOnce([row]);

      const paths = await runFindAll();

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

      const paths = await runFindAll();

      expect(paths[0].steps[0]).toEqual({
        order: 1,
        description: "Doe iets",
      });
      expect(paths[0].steps[0].contact).toBeUndefined();
      expect(paths[0].steps[0].link).toBeUndefined();
    });
  });
});
