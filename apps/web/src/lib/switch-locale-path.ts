import { SUPPORTED_LOCALES, type SupportedLocale } from '@onemore/shared';

/**
 * Replace the locale segment in an App Router pathname.
 *
 * @param pathname - Current pathname (e.g. `/it/dashboard`).
 * @param nextLocale - Target locale slug.
 * @returns Pathname with the locale segment swapped.
 */
export function switchLocalePath(pathname: string, nextLocale: SupportedLocale): string {
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return `/${nextLocale}`;
  }

  const firstSegment = segments[0];
  if (
    firstSegment !== undefined &&
    (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)
  ) {
    segments[0] = nextLocale;
    return `/${segments.join('/')}`;
  }

  return `/${nextLocale}/${segments.join('/')}`;
}
