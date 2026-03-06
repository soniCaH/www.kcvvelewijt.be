/**
 * Mappers
 * Transform data between different layers (domain ↔ presentation)
 */

export {
  mapArticleToHomepageArticle,
  mapArticlesToHomepageArticles,
  mapSanityArticleToHomepageArticle,
  mapSanityArticlesToHomepageArticles,
} from "./article.mapper";
export {
  mapMatchToUpcomingMatch,
  mapMatchesToUpcomingMatches,
} from "./match.mapper";
export {
  mapSponsorToComponentSponsor,
  mapSponsorsToComponentSponsors,
} from "./sponsor.mapper";
export type { HomepageArticle } from "./article.mapper";
