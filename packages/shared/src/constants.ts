/** Supported UI locales from MVP-1. */
export const SUPPORTED_LOCALES = ['it', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'it';

/** API version prefix for REST routes. */
export const API_VERSION_PREFIX = '/api/v1';
