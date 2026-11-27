import { useEffect, useState } from "react";

export interface TeamGuess {
  /** The query the BFF answered — compare it with the current one before use. */
  query: string;
  /** One of the allowed ages. */
  age: string;
}

/**
 * The `/hulp` team card's AI fallback (#3559): asks `POST
 * /api/search/team-guess` which of `ages` a query means. It adds no debounce
 * of its own: it runs on the query HubSearch has already debounced (200 ms,
 * the people lane's). Pass `null` to ask nothing; each new query aborts the last.
 * Any failure, a 429 or a "none" leaves no guess — the card simply stays away.
 */
export const useTeamGuess = (
  query: string | null,
  ages: readonly string[],
): TeamGuess | null => {
  const [guess, setGuess] = useState<TeamGuess | null>(null);
  const agesKey = ages.join(",");

  useEffect(() => {
    if (!query || !agesKey) return;
    const controller = new AbortController();
    // The decoder chunk (effect + schemas) loads next to the request, not
    // after it; a failed load lands in the catch below.
    Promise.all([
      fetch("/api/search/team-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, ages: agesKey.split(",") }),
        signal: controller.signal,
      }),
      import("@/lib/search/search-decoders"),
    ])
      .then(async ([res, { decodeTeamGuess }]) => {
        if (!res.ok) return null;
        const decoded = decodeTeamGuess(await res.json());
        if (!decoded) {
          console.warn(
            "[useTeamGuess] team guess response does not match the contract",
          );
        }
        return decoded;
      })
      .then((guess) => {
        if (guess?.age) setGuess({ query, age: guess.age });
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError")
          console.warn("[useTeamGuess] team guess failed:", err);
      });
    return () => controller.abort();
  }, [query, agesKey]);

  return guess;
};
