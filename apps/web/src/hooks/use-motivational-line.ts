'use client';

import type { DifficultyLevel } from '@onemore/shared';
import { pickVariantIndex, resolveGreetingName, type UserProfile } from '@onemore/shared';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export type MotivationContext =
  | 'dashboardActive'
  | 'dashboardEmpty'
  | 'workoutStart'
  | 'onboardingWelcome'
  | 'programs'
  | 'chooseProgram'
  | 'rest';

const VARIANT_COUNTS: Record<MotivationContext, number> = {
  dashboardActive: 4,
  dashboardEmpty: 3,
  workoutStart: 4,
  onboardingWelcome: 3,
  programs: 3,
  chooseProgram: 3,
  rest: 3,
};

interface UseMotivationalLineOptions {
  difficultyLevel?: DifficultyLevel;
}

/**
 * Resolves a motivational line for page headers, rest screens, and subheaders.
 *
 * @param context - Screen-specific copy bucket.
 * @param profile - Authenticated user profile (optional).
 * @param options - Optional difficulty tier for tone selection.
 * @returns Localized motivational string.
 */
export function useMotivationalLine(
  context: MotivationContext,
  profile: UserProfile | null | undefined,
  options?: UseMotivationalLineOptions,
): string {
  const t = useTranslations('Motivation');
  const greetingName = profile ? resolveGreetingName(profile) : null;
  const variantCount = VARIANT_COUNTS[context];
  const difficultyLevel = options?.difficultyLevel;

  const variantIndex = useMemo(() => {
    const daySeed = new Date().toISOString().slice(0, 10);
    const userSeed = profile?.id ?? 'guest';
    const difficultySeed = difficultyLevel ? `:d${String(difficultyLevel)}` : '';
    return pickVariantIndex(`${userSeed}:${context}${difficultySeed}:${daySeed}`, variantCount);
  }, [context, difficultyLevel, profile?.id, variantCount]);

  const bucket = greetingName ? 'withName' : 'generic';
  const difficultyBucket =
    difficultyLevel !== undefined ? (`d${String(difficultyLevel)}` as 'd1' | 'd2' | 'd3') : null;

  if (difficultyBucket) {
    const key = `${context}.${difficultyBucket}.${bucket}.${String(variantIndex)}` as
      | 'programs.d1.withName.0'
      | 'rest.d2.generic.0';
    if (greetingName) {
      return t(key, { name: greetingName });
    }
    return t(key);
  }

  const key = `${context}.${bucket}.${String(variantIndex)}` as
    | 'dashboardActive.withName.0'
    | 'dashboardActive.generic.0';

  if (greetingName) {
    return t(key, { name: greetingName });
  }

  return t(key);
}
