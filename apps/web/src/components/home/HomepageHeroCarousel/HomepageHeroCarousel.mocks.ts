import type { HomepageHeroArticle } from "./HomepageHeroCarousel";
import { fixtureImage } from "@test-fixtures/images";

// Variant-keyed homepage hero fixtures. Each branch supplies the
// structured data the EditorialHero needs for its kicker + below-H1
// + below-hero artefacts (R1.5, #1749).
export const mockArticles: HomepageHeroArticle[] = [
  {
    slug: "kapitein-jens-promotiekansen",
    variant: "interview",
    thumbLabel: "Interview",
    title: '"Met deze ploeg kunnen we ver geraken."',
    lead: "Aanvoerder Jens De Smet over de promotiekansen, het nieuwe trainingsritme en waarom de groep dit jaar anders aanvoelt.",
    date: "5 mei 2026",
    author: "Tom Janssens",
    coverImage: {
      url: fixtureImage("article-hero-interview", 0),
      alt: "Jens De Smet in gesprek na de wedstrijd",
    },
    subjects: [
      {
        kind: "player",
        playerRef: {
          firstName: "Jens",
          lastName: "De Smet",
          jerseyNumber: 10,
          position: "Middenvelder",
          psdImageUrl: fixtureImage("player-portrait", 0),
        },
      },
    ],
  },
  {
    slug: "kampioen-58-punten-eerste-provinciale",
    variant: "announcement",
    thumbLabel: "Clubnieuws",
    title: "Kampioen! 58 punten en titel in eerste provinciale.",
    lead: "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks. Zaterdag wordt gevierd op het sportpark.",
    date: "3 mei 2026",
    author: "Redactie",
    coverImage: {
      url: fixtureImage("article-hero-generic", 0),
      alt: "Spelers vieren de titel",
    },
    category: "Clubnieuws",
  },
  {
    slug: "transfer-aanwinst-bocar-sarr",
    variant: "transfer",
    thumbLabel: "Transfer",
    title: "Aanvalsversterking voor volgend seizoen.",
    lead: "Bocar Sarr tekent voor twee seizoenen. Hij komt over van het naburige Mechelen B en versterkt de spitsenlinie meteen.",
    date: "30 april 2026",
    author: "Redactie",
    coverImage: {
      url: fixtureImage("article-hero-transfer", 0),
      alt: "Bocar Sarr in trainingstenue",
    },
    feature: {
      direction: "incoming",
      playerName: "Bocar Sarr",
      position: "Aanvaller",
      age: 24,
      otherClubName: "KV Mechelen B",
    },
  },
];

export const mockTwoArticles: HomepageHeroArticle[] = mockArticles.slice(0, 2);
export const mockSingleArticle: HomepageHeroArticle[] = mockArticles.slice(
  0,
  1,
);
