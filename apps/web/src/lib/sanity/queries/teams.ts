import { defineQuery } from "groq";

export const TEAMS_QUERY =
  defineQuery(`*[_type == "team" && showInNavigation != false] | order(name asc) {
  _id, psdId, name, "slug": slug.current, age, gender, footbelId, leagueId, division, divisionFull,
  tagline,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const TEAM_BY_SLUG_QUERY =
  defineQuery(`*[_type == "team" && slug.current == $slug][0] {
  _id, psdId, name, "slug": slug.current, age, gender, footbelId, leagueId, division, divisionFull,
  tagline, body[]{ ..., "fileUrl": file.asset->url }, contactInfo,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  trainingSchedule,
  players[]-> {
    _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
    "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
    "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max"
  },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url + "?w=200&q=80&fm=webp&fit=max" }
}`);

export const TEAMS_LANDING_QUERY =
  defineQuery(`*[_type == "team" && showInNavigation != false && defined(age)] | order(name asc) {
  _id, name, "slug": slug.current, age,
  division, divisionFull, tagline,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  staff[]-> { firstName, lastName, role }
}`);
