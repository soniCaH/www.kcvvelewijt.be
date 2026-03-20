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

const CDN_PARAMS = "&q=80&fm=webp&fit=max";
const TEAM_IMG_SUFFIX = `?w=1200${CDN_PARAMS}`;
const PLAYER_IMG_SUFFIX = `?w=400${CDN_PARAMS}`;
const PLAYER_TRANSPARENT_IMG_SUFFIX = `?w=600${CDN_PARAMS}`;
const SMALL_IMG_SUFFIX = `?w=200${CDN_PARAMS}`;

export const TEAMS_QUERY = `*[_type == "team" && showInNavigation != false] | order(name asc) {
  _id, psdId, name, slug, age, gender, footbelId, leagueId, division, divisionFull,
  tagline, body[]{ ..., "fileUrl": file.asset->url }, contactInfo,
  "teamImageUrl": teamImage.asset->url + "${TEAM_IMG_SUFFIX}",
  trainingSchedule,
  players[]-> {
    _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
    "psdImageUrl": psdImage.asset->url + "${PLAYER_IMG_SUFFIX}", "transparentImageUrl": transparentImage.asset->url + "${PLAYER_TRANSPARENT_IMG_SUFFIX}"
  },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url + "${SMALL_IMG_SUFFIX}" }
}`;

export const TEAM_BY_SLUG_QUERY = `*[_type == "team" && slug.current == $slug][0] {
  _id, psdId, name, slug, age, gender, footbelId, leagueId, division, divisionFull,
  tagline, body[]{ ..., "fileUrl": file.asset->url }, contactInfo,
  "teamImageUrl": teamImage.asset->url + "${TEAM_IMG_SUFFIX}",
  trainingSchedule,
  players[]-> {
    _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
    "psdImageUrl": psdImage.asset->url + "${PLAYER_IMG_SUFFIX}", "transparentImageUrl": transparentImage.asset->url + "${PLAYER_TRANSPARENT_IMG_SUFFIX}"
  },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url + "${SMALL_IMG_SUFFIX}" }
}`;
