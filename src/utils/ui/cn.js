/**
 * Joins truthy class names into a single class string.
 * @param {...(string | false | null | undefined)} values Classname candidates.
 * @returns {string} Joined className.
 */
export function cn(...values) {
  return values.filter(Boolean).join(' ');
}
