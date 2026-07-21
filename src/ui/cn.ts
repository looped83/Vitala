/** Join class names, skipping falsy values. Tiny, dependency-free. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
