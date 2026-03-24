import { defineQuery } from "groq";

export const PLAYERS_QUERY =
  defineQuery(`*[_type == "player"] | order(lastName asc) {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate, nationality, height, weight,
  "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
  "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "celebrationImageUrl": celebrationImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  bio
}`);

export const PLAYER_BY_PSD_ID_QUERY =
  defineQuery(`*[_type == "player" && psdId == $psdId][0] {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate, nationality, height, weight,
  "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
  "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "celebrationImageUrl": celebrationImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  bio
}`);
