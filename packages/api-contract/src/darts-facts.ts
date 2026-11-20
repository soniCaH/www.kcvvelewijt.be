/**
 * EK Darts helpers both apps read (#3812). Plain functions over the facts in
 * `apps/web/src/data/darts.json`, so the web form and the worker's mails never
 * hold a second hand-typed copy of the date or the price.
 */

const BRUSSELS_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Brussels",
});

/**
 * The signup closes by itself once the event day is over. Compared as a
 * Brussels calendar day (`YYYY-MM-DD` sorts as text) so the form stays open
 * for the whole of the event date. Always call at request time, never at build.
 */
export const isDartsSignupClosed = (eventIso: string, now: Date): boolean =>
  BRUSSELS_DAY.format(now) > eventIso;

/**
 * "€30" out of the file's `prijs.tekst` ("€ 30 per ploeg"). Falls back to the
 * whole text rather than guess when the file is reworded.
 */
export const dartsPriceAmount = (priceText: string): string => {
  const match = /€\s*(\d+(?:[.,]\d+)?)/.exec(priceText);
  return match ? `€${match[1]}` : priceText;
};
