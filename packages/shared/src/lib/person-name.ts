/**
 * Builds a display name from first and last name parts.
 *
 * @param firstName - Given name.
 * @param lastName - Family name.
 * @returns Combined display name or null when both are empty.
 */
export function formatDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | null {
  const parts = [firstName?.trim(), lastName?.trim()].filter((part): part is string =>
    Boolean(part),
  );
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Resolves the name used in short motivational greetings.
 *
 * @param profile - User profile fields.
 * @returns First name for copy personalization, or null.
 */
export function resolveGreetingName(profile: {
  firstName: string | null;
  displayName: string | null;
}): string | null {
  const trimmedFirst = profile.firstName?.trim();
  if (trimmedFirst) {
    return trimmedFirst;
  }

  const display = profile.displayName?.trim();
  if (!display) {
    return null;
  }

  const [firstWord] = display.split(/\s+/);
  return firstWord ?? null;
}

/**
 * Picks a stable variant index from a string seed (e.g. user id + context).
 *
 * @param seed - Deterministic seed string.
 * @param count - Number of variants available.
 * @returns Index in `[0, count)`.
 */
export function pickVariantIndex(seed: string, count: number): number {
  if (count <= 0) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % count;
}
