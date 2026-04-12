/**
 * Sanity CDN URLs for history and ultras page images.
 *
 * These images were uploaded to Sanity as standalone assets (no document schema)
 * to replace local files in public/images/history/ and public/images/ultras/.
 * Approach: 5a from the initial-load-performance PRD — asset hosting only.
 *
 * Transform params follow the established codebase pattern:
 *   ?w=<width>&q=80&fm=webp&fit=max
 */

const SANITY_CDN_BASE =
  "https://cdn.sanity.io/images/vhb33jaz/production" as const;

function sanityImageUrl(
  hash: string,
  dimensions: string,
  ext: string,
  width: number,
): string {
  return `${SANITY_CDN_BASE}/${hash}-${dimensions}.${ext}?w=${width}&q=80&fm=webp&fit=max`;
}

// Timeline images: displayed at max 1024px via fill + sizes="(min-width: 1024px) 1024px, 100vw"
export const HISTORY_52_53 = sanityImageUrl(
  "05a2bb7cfe3a32a2db474a2d4b5143650947dd08",
  "789x593",
  "png",
  1024,
);
export const HISTORY_58_59 = sanityImageUrl(
  "125d9eb0d7b1a390ebdefc5f3f1d3fdd2cdabf28",
  "831x541",
  "png",
  1024,
);
export const HISTORY_63_64 = sanityImageUrl(
  "9428e9865dfe0de41358896e34cf6992f1911e86",
  "720x504",
  "png",
  1024,
);
export const HISTORY_FUSIE = sanityImageUrl(
  "f05aa7810fb8a2d81cdf8a202f65e71a868b19e4",
  "743x527",
  "png",
  1024,
);
export const HISTORY_BVB = sanityImageUrl(
  "ab4f32fd08f693388b637d51d99fbdc2af694a07",
  "943x597",
  "png",
  1024,
);
export const HISTORY_2018 = sanityImageUrl(
  "1886013efd27bd6433ae1b407aa0ab7c4a3e0d5d",
  "3820x1710",
  "jpg",
  1024,
);
export const HISTORY_2022 = sanityImageUrl(
  "bccc9eab07e5b12f9a4ebacdb8e356467a13b67b",
  "1920x869",
  "jpg",
  1024,
);

// Hero image: full-width, w=1600
export const HISTORY_24_25_HERO = sanityImageUrl(
  "bc8c9240d90c828f37a499e661ddd8d1e816924e",
  "2048x1536",
  "jpg",
  1600,
);

// Timeline usage of the same image: w=1024
export const HISTORY_24_25 = sanityImageUrl(
  "bc8c9240d90c828f37a499e661ddd8d1e816924e",
  "2048x1536",
  "jpg",
  1024,
);

// Editorial grid card background: w=900
export const HISTORY_24_25_CARD = sanityImageUrl(
  "bc8c9240d90c828f37a499e661ddd8d1e816924e",
  "2048x1536",
  "jpg",
  900,
);

// Ultras hero: full-width, w=1600
export const ULTRAS_HEADER_HERO = sanityImageUrl(
  "119751c3b9c4251069f6aab4200d411dc6805eab",
  "1949x863",
  "jpg",
  1600,
);

// Editorial grid card background: w=900
export const ULTRAS_HEADER_CARD = sanityImageUrl(
  "119751c3b9c4251069f6aab4200d411dc6805eab",
  "1949x863",
  "jpg",
  900,
);

// Ultras content images: displayed at explicit width=1440
export const ULTRAS_KAMPIOEN = sanityImageUrl(
  "aa767de244a68bc3dcb6163ca81bee0739d94559",
  "4032x3024",
  "jpg",
  1440,
);
export const ULTRAS_SJR = sanityImageUrl(
  "2b1dd05b067ac359c3b3b26bb879cf25f1593f02",
  "1920x1080",
  "jpg",
  1440,
);
