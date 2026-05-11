import type { HomepageHeroArticle } from "./HomepageHeroCarousel";
import { fixtureImage } from "@test-fixtures/images";

export const mockArticles: HomepageHeroArticle[] = [
  {
    slug: "kapitein-jens-promotiekansen",
    variant: "interview",
    thumbLabel: "Interview",
    title: '"Met deze ploeg kunnen we ver geraken."',
    lead: "Aanvoerder Jens De Smet over de promotiekansen, het nieuwe trainingsritme en waarom de groep dit jaar anders aanvoelt.",
    kicker: [
      { label: "Interview", variant: "pill-jersey" },
      { label: "5 mei 2026" },
      { label: "6 min lezen" },
    ],
    author: "Tom Janssens",
    coverImage: {
      url: fixtureImage("article-hero-interview", 0),
      alt: "Jens De Smet in gesprek na de wedstrijd",
    },
  },
  {
    slug: "kampioen-58-punten-eerste-provinciale",
    variant: "announcement",
    thumbLabel: "Clubnieuws",
    title: "Kampioen! 58 punten en titel in eerste provinciale.",
    lead: "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks. Zaterdag wordt gevierd op het sportpark.",
    kicker: [
      { label: "Clubnieuws", variant: "pill-jersey" },
      { label: "3 mei 2026" },
      { label: "3 min lezen" },
    ],
    author: "Redactie",
    coverImage: {
      url: fixtureImage("article-hero-generic", 0),
      alt: "Spelers vieren de titel",
    },
  },
  {
    slug: "transfer-aanwinst-bocar-sarr",
    variant: "transfer",
    thumbLabel: "Transfer",
    title: "Aanvalsversterking voor volgend seizoen.",
    lead: "Bocar Sarr tekent voor twee seizoenen. Hij komt over van het naburige Mechelen B en versterkt de spitsenlinie meteen.",
    kicker: [
      { label: "Transfer", variant: "pill-jersey" },
      { label: "30 april 2026" },
      { label: "2 min lezen" },
    ],
    author: "Redactie",
    coverImage: {
      url: fixtureImage("article-hero-transfer", 0),
      alt: "Bocar Sarr in trainingstenue",
    },
  },
];

export const mockTwoArticles: HomepageHeroArticle[] = mockArticles.slice(0, 2);
export const mockSingleArticle: HomepageHeroArticle[] = mockArticles.slice(
  0,
  1,
);
