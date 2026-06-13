import {
  Barlow,
  Bebas_Neue,
  DM_Sans,
  Inter,
  Oswald,
  Outfit,
  Plus_Jakarta_Sans,
  Rubik,
  Space_Grotesk,
} from 'next/font/google';

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

/** Condensed display — bold gym poster feel. */
export const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas-neue',
  display: 'swap',
});

/** Narrow athletic headline font. */
export const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

/** Rounded humanist sans — friendly and distinct. */
export const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
});

/** Semi-condensed industrial sans. */
export const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

/** Technical grotesk with sharp personality. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

/** Combined CSS variable classes for all selectable fonts. */
export const fontVariableClasses = [
  plusJakarta.variable,
  inter.variable,
  dmSans.variable,
  outfit.variable,
  bebasNeue.variable,
  oswald.variable,
  rubik.variable,
  barlow.variable,
  spaceGrotesk.variable,
].join(' ');
