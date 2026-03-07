/**
 * Mappers
 * Transform data between different layers (domain ↔ presentation)
 */

export {
  mapSanityArticleToHomepageArticle,
  mapSanityArticlesToHomepageArticles,
} from "./article.mapper";
export {
  mapMatchToUpcomingMatch,
  mapMatchesToUpcomingMatches,
} from "./match.mapper";
export type { HomepageArticle } from "./article.mapper";
