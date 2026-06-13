'use client';

import { pickVariantIndex, resolveGreetingName, type UserProfile } from '@onemore/shared';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export type MotivationContext =
  | 'dashboardActive'
  | 'dashboardEmpty'
  | 'workoutStart'
  | 'onboardingWelcome'
  | 'programs'
  | 'chooseProgram';

const VARIANT_COUNTS: Record<MotivationContext, number> = {
  dashboardActive: 4,
  dashboardEmpty: 3,
  workoutStart: 4,
  onboardingWelcome: 3,
  programs: 3,
  chooseProgram: 3,
};

/**
 * Resolves a motivational line for page headers and subheaders.
 *
 * @param context - Screen-specific copy bucket.
 * @param profile - Authenticated user profile (optional).
 * @returns Localized motivational string.
 */
export function useMotivationalLine(
  context: MotivationContext,
  profile: UserProfile | null | undefined,
): string {
  const t = useTranslations('Motivation');
  const greetingName = profile ? resolveGreetingName(profile) : null;
  const variantCount = VARIANT_COUNTS[context];

  const variantIndex = useMemo(() => {
    const daySeed = new Date().toISOString().slice(0, 10);
    const userSeed = profile?.id ?? 'guest';
    return pickVariantIndex(`${userSeed}:${context}:${daySeed}`, variantCount);
  }, [context, profile?.id, variantCount]);

  const bucket = greetingName ? 'withName' : 'generic';
  const key = `${context}.${bucket}.${String(variantIndex)}` as
    | 'dashboardActive.withName.0'
    | 'dashboardActive.generic.0';

  if (greetingName) {
    return t(key, { name: greetingName });
  }

  return t(key);
}
