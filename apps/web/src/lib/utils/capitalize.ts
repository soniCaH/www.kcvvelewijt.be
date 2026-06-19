/** Capitalise the first letter of a string; returns the input unchanged when empty. */
export function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
