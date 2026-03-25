import { defineQuery } from "groq";

export const HOMEPAGE_BANNERS_QUERY = defineQuery(`*[_type == "homePage"][0] {
    "bannerSlotA": bannerSlotA-> {
      _id,
      "imageUrl": image.asset->url,
      alt,
      href
    },
    "bannerSlotB": bannerSlotB-> {
      _id,
      "imageUrl": image.asset->url,
      alt,
      href
    },
    "bannerSlotC": bannerSlotC-> {
      _id,
      "imageUrl": image.asset->url,
      alt,
      href
    }
  }`);
