/** First letters of the first two words, upper-cased: "Gallery Admin" → "GA", "Cher" → "C". */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toUpperCase();
}
