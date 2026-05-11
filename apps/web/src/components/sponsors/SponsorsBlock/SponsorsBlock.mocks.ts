import type { Sponsor } from "../Sponsors";
import { fixtureImage } from "@test-fixtures/images";

const tile = (i: number) => fixtureImage("sponsor-logo", i);

export const mockHoofdsponsors: Sponsor[] = [
  {
    id: "h-1",
    name: "Bakkerij Peeters",
    logo: tile(0),
    url: "https://example.com/peeters",
    tier: "hoofdsponsor",
  },
  {
    id: "h-2",
    name: "Garage Vermeulen",
    logo: tile(1),
    url: "https://example.com/vermeulen",
    tier: "hoofdsponsor",
  },
  {
    id: "h-3",
    name: "Tuinaanleg De Smet",
    logo: tile(2),
    url: "https://example.com/desmet",
    tier: "hoofdsponsor",
  },
];

export const mockSponsorsTier: Sponsor[] = [
  {
    id: "s-1",
    name: "Apotheek Janssens",
    logo: tile(3),
    url: "https://example.com/janssens",
    tier: "sponsor",
  },
  {
    id: "s-2",
    name: "Cafe De Kroon",
    logo: tile(4),
    url: "https://example.com/kroon",
    tier: "sponsor",
  },
  {
    id: "s-3",
    name: "Drukkerij Vermeiren",
    logo: tile(5),
    url: "https://example.com/vermeiren",
    tier: "sponsor",
  },
  {
    id: "s-4",
    name: "Elektro Maes",
    logo: tile(6),
    url: "https://example.com/maes",
    tier: "sponsor",
  },
  {
    id: "s-5",
    name: "Frituur Het Plein",
    logo: tile(7),
    url: "https://example.com/plein",
    tier: "sponsor",
  },
  {
    id: "s-6",
    name: "Hoveniersbedrijf Claes",
    logo: tile(8),
    url: "https://example.com/claes",
    tier: "sponsor",
  },
  {
    id: "s-7",
    name: "Interieur Vandersmissen",
    logo: tile(9),
    url: "https://example.com/vandersmissen",
    tier: "sponsor",
  },
  {
    id: "s-8",
    name: "Kapsalon Marie",
    logo: tile(10),
    url: "https://example.com/marie",
    tier: "sponsor",
  },
  {
    id: "s-9",
    name: "Loodgieter Verbeeck",
    logo: tile(11),
    url: "https://example.com/verbeeck",
    tier: "sponsor",
  },
  {
    id: "s-10",
    name: "Meubelmakerij Goossens",
    logo: tile(0),
    url: "https://example.com/goossens",
    tier: "sponsor",
  },
];

export const mockSponsorsMixed: Sponsor[] = [
  ...mockHoofdsponsors,
  ...mockSponsorsTier,
];

export const mockSponsorsMissingLogos: Sponsor[] = [
  mockHoofdsponsors[0]!,
  { ...mockHoofdsponsors[1]!, logo: "" },
  mockHoofdsponsors[2]!,
  mockSponsorsTier[0]!,
  { ...mockSponsorsTier[1]!, logo: "" },
  mockSponsorsTier[2]!,
  mockSponsorsTier[3]!,
  { ...mockSponsorsTier[4]!, logo: "" },
];
