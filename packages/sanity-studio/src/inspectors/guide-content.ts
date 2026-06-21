import type {GuideEntry} from './guide-model'

/**
 * Per-document-type editor guidance. Add an entry here to opt a document type
 * into the GuidedSidebar inspector; types without an entry are left with
 * Sanity's default document pane.
 *
 * Each entry helps the editor get the document into the right configuration
 * and spot: `intro` (what it is / why it matters), `placement` (where it shows
 * up on the site), and optional `tips` (config guidance for the non-obvious
 * bits). Keep the copy in plain Dutch, matching the `responsibility` reference.
 */
export const guideContent: Record<string, GuideEntry> = {
  responsibility: {
    intro:
      'Een info-pad beantwoordt één concrete vraag van een bezoeker (bijv. "Hoe sluit ik mijn kind aan?") en leidt hem in enkele stappen naar het juiste antwoord en aanspreekpunt.',
    placement:
      'Bezoekers vinden dit via de zoekfunctie op de site en op de detailpagina `/info/{slug}`, plus via "Zie ook"-links onderaan verwante info-paden.',
    tips: [
      'Doelgroep en categorie bepalen wie dit te zien krijgt en hoe het gegroepeerd wordt — kies ze zorgvuldig.',
      'Voeg royaal keywords (synoniemen) toe zodat bezoekers het ook vinden met andere woorden dan in de vraag.',
      'Kies bij Contact een vaste organigram-positie (blijft up-to-date bij rolwissels), een dynamische teamrol, of handmatige gegevens.',
    ],
  },
  article: {
    intro:
      'Een artikel is nieuws op de site: een interview, transfer, aankondiging of wedstrijdvoor-/nabeschouwing. Het gekozen type bepaalt de vorm en welke velden verschijnen.',
    placement:
      'Verschijnt in de nieuwssectie, bij de recentste artikels op de homepage, en op de detailpagina `/nieuws/{slug}`.',
    tips: [
      'Kies eerst het type — Interview toont portretten + Q&A, Transfer/Event vragen een fact-blok, Match preview/recap koppelt aan een wedstrijd.',
      'Match preview/recap hebben een numeriek PSD-wedstrijd-id nodig (kopieer het uit de /wedstrijd/[id] URL).',
    ],
  },
  sponsor: {
    intro:
      'Een sponsor is een partner die de club steunt. De tier bepaalt hoe prominent de sponsor op de site getoond wordt.',
    placement:
      'Hoofdsponsors en sponsors komen op de homepage; alle actieve sponsors (incl. sympathisanten) staan op de sponsorpagina. Het logo toont standaard in grijswaarden en kleurt in bij hover.',
    tips: [
      'Upload het logo bij voorkeur met transparante achtergrond (PNG of SVG).',
      'Zet "Featured" enkel aan om een sponsor in de spotlight-sectie uit te lichten — spaarzaam gebruiken.',
      'Zet "Active" uit om een sponsor tijdelijk te verbergen (bijv. aflopend contract) zonder hem te verwijderen.',
    ],
  },
  page: {
    intro:
      'Een pagina is een vrije infopagina (bijv. praktische info of clubgeschiedenis) — voor inhoud die niet in nieuws, ploegen of evenementen past.',
    placement:
      "Bereikbaar op `/{slug}` en linkbaar vanuit menu's of andere pagina's. Ze verschijnt niet automatisch in een overzicht.",
    tips: [
      'Wijzig de slug niet meer na publicatie — bestaande links breken anders.',
      'Laat de SEO-velden leeg om automatisch terug te vallen op titel en het begin van de tekst.',
    ],
  },
  banner: {
    intro:
      'Een banner is een brede promo-afbeelding (bijv. een webshop- of sponsoractie) die je in een bannerslot op de homepage plaatst.',
    placement:
      'Verschijnt enkel wanneer je hem koppelt aan een bannerslot (A/B/C) in het Homepage-document. Een niet-gekoppelde banner wordt nergens getoond.',
    tips: [
      'Gebruik een brede, liggende afbeelding (~6:1) zodat ze niet ongelukkig bijgesneden wordt.',
      'Alt-tekst is verplicht voor toegankelijkheid en zoekmachines.',
      'Vul een kliklink in om de hele banner klikbaar te maken; laat leeg voor een statische banner.',
    ],
  },
  homePage: {
    intro:
      'De homepage-configuratie stuurt enkele optionele blokken op de homepage aan. Het is een singleton — er is één exemplaar dat je aanpast, niet opnieuw aanmaakt.',
    placement:
      'Bepaalt de drie bannerslots (onder het wedstrijdenblok, de nieuws- en de jeugdsectie) en het placeholder-wedstrijdenblok op de homepage.',
    tips: [
      'Een bannerslot verwijst naar een Banner-document — maak eerst de Banner aan en koppel ze hier.',
      'Laat een slot leeg om hem over te slaan; de homepage schuift dan gewoon door.',
      'De placeholder verschijnt enkel wanneer er geen aankomende wedstrijden zijn.',
    ],
  },
}
