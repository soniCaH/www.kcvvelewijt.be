export const PLAYERS_QUERY = `*[_type == "player"] | order(lastName asc) {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate, nationality, height, weight,
  psdImageUrl,
  "transparentImageUrl": transparentImage.asset->url,
  "celebrationImageUrl": celebrationImage.asset->url,
  bio
}`;

export const PLAYER_BY_PSD_ID_QUERY = `*[_type == "player" && psdId == $psdId][0] {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate, nationality, height, weight,
  psdImageUrl,
  "transparentImageUrl": transparentImage.asset->url,
  "celebrationImageUrl": celebrationImage.asset->url,
  bio
}`;
