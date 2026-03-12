export const YOUTH_TEAMS_NAV_QUERY = `*[_type == "team" && showInNavigation != false && defined(age) && !(age in ["A", "B"])] | order(name asc) {
  _id, name, "slug": slug.current, age
}`;

export type YouthTeamNavItem = {
  _id: string;
  name: string;
  slug: string;
  age: string;
};

export const SENIOR_TEAMS_NAV_QUERY = `*[_type == "team" && showInNavigation != false && age == "A"] | order(name asc) {
  _id, name, "slug": slug.current, age
}`;

export type SeniorTeamNavItem = {
  _id: string;
  name: string;
  slug: string;
  age: string;
};

export const TEAMS_QUERY = `*[_type == "team" && showInNavigation != false] | order(name asc) {
  _id, psdId, name, slug, age, gender, footbelId, leagueId, division, divisionFull,
  tagline, body[]{ ..., "fileUrl": file.asset->url }, contactInfo,
  "teamImageUrl": teamImage.asset->url,
  trainingSchedule,
  players[]-> {
    _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
    "psdImageUrl": psdImage.asset->url, "transparentImageUrl": transparentImage.asset->url
  },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url }
}`;

export const TEAM_BY_SLUG_QUERY = `*[_type == "team" && slug.current == $slug][0] {
  _id, psdId, name, slug, age, gender, footbelId, leagueId, division, divisionFull,
  tagline, body[]{ ..., "fileUrl": file.asset->url }, contactInfo,
  "teamImageUrl": teamImage.asset->url,
  trainingSchedule,
  players[]-> {
    _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
    "psdImageUrl": psdImage.asset->url, "transparentImageUrl": transparentImage.asset->url
  },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url }
}`;
