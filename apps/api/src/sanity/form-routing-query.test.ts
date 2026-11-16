import { describe, it, expect } from "vitest";
import { parse, evaluate } from "groq-js";
import { FORM_ROUTING_QUERY } from "./projection";

const dataset = [
  {
    _id: "cfg",
    _type: "formRoutingConfig",
    speler: "a@b.be",
    spelerContact: { _ref: "n1" },
    trainerContact: { _ref: "n2" },
    jeugdspelerContact: { _ref: "n3" },
  },
  {
    _id: "n1",
    _type: "organigramNode",
    title: "Voorzitter",
    active: true,
    members: [{ _ref: "gone" }, { _ref: "s2" }, { _ref: "s1" }],
  },
  {
    _id: "n2",
    _type: "organigramNode",
    title: "Vacant",
    active: true,
    members: [],
  },
  {
    _id: "n3",
    _type: "organigramNode",
    title: "Inactief",
    active: false,
    members: [{ _ref: "s1" }],
  },
  { _id: "s1", _type: "staffMember", firstName: "An", lastName: "Peeters" },
  {
    _id: "s2",
    _type: "staffMember",
    firstName: "Archived",
    lastName: "X",
    archived: true,
  },
];

describe("FORM_ROUTING_QUERY contacts", () => {
  it("returns the first live holder and treats vacant/inactive/missing boxes as no holder", async () => {
    const result = (await (
      await evaluate(parse(FORM_ROUTING_QUERY), { dataset })
    ).get()) as { speler: string; contacts: Record<string, unknown> };

    expect(result.speler).toBe("a@b.be");
    expect(result.contacts).toEqual({
      speler: {
        functionTitle: "Voorzitter",
        holder: { firstName: "An", lastName: "Peeters" },
      },
      jeugdspeler: { functionTitle: "Inactief", holder: null },
      vrijwilliger: null,
      trainer: { functionTitle: "Vacant", holder: null },
      scheidsrechter: null,
    });
  });
});
