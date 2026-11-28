import { defineField, defineType } from "sanity";
import { validateMatchbalMatchId } from "./validation/matchbal";

/**
 * The matchday sponsor of one Match (#3913, #3917): the Sponsor that offered
 * the match ball. The Match page names it under the score box, before and
 * after kick-off. One document per Match; the Studio refuses a second one.
 */
export const matchbal = defineType({
  name: "matchbal",
  title: "Matchbal",
  type: "document",
  fields: [
    defineField({
      name: "matchId",
      title: "Wedstrijd-id",
      type: "string",
      description:
        "PSD-wedstrijd-id. Kopieer het uit de link van de wedstrijdpagina: kcvvelewijt.be/wedstrijd/3414 geeft 3414.",
      validation: (r) =>
        r
          .required()
          .error(
            "Verplicht. Zonder wedstrijd-id weet de site niet bij welke wedstrijd de Matchbal hoort.",
          )
          .custom(validateMatchbalMatchId),
    }),
    defineField({
      name: "sponsor",
      title: "Sponsor",
      type: "reference",
      to: [{ type: "sponsor" }],
      description:
        "De sponsor die de matchbal aanbiedt. De wedstrijdpagina toont zijn naam en logo.",
      validation: (r) =>
        r
          .required()
          .error("Verplicht. Zonder sponsor toont de wedstrijdpagina niets."),
    }),
  ],
  preview: {
    select: {
      matchId: "matchId",
      sponsor: "sponsor.name",
      media: "sponsor.logo",
    },
    prepare: ({ matchId, sponsor, media }) => ({
      title: sponsor ?? "Matchbal zonder sponsor",
      subtitle: matchId ? `Wedstrijd ${matchId}` : "Geen wedstrijd-id",
      media,
    }),
  },
});
