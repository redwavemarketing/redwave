/** Join class names, dropping falsy values. Tiny local helper (no classnames dep needed). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
