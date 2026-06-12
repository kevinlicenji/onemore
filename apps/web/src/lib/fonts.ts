import { DM_Sans, Inter, Outfit, Plus_Jakarta_Sans } from 'next/font/google';

/**
 * Primary typeface — geometric, athletic, readable on desktop and mobile.
 */
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

/** Neutral UI font with excellent legibility at small sizes. */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/** Rounded geometric sans for a softer gym aesthetic. */
export const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

/** Athletic display sans with strong character. */
export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

/** Combined CSS variable classes for all selectable fonts. */
export const fontVariableClasses = [
  plusJakarta.variable,
  inter.variable,
  dmSans.variable,
  outfit.variable,
].join(' ');
