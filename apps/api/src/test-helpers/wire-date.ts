/**
 * The BFF wire form of a REAL instant: Brussels wall-clock stored in UTC fields
 * (#2601, #3491). Built from Intl on purpose, not from the code under test.
 */
export const wireDate = (realMs: number): Date =>
  new Date(
    `${new Date(realMs)
      .toLocaleString("sv-SE", { timeZone: "Europe/Brussels" })
      .replace(" ", "T")}.${String(realMs % 1000).padStart(3, "0")}Z`,
  );
