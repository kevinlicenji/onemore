'use client';

import type {
  OnboardingComplete,
  TrainingEnvironment,
  TrainingGoal,
  TrainingLevel,
} from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useAppearance } from '@/components/appearance/appearance-provider';
import { useAuth } from '@/components/auth-provider';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { OnboardingProgressBar } from '@/components/onboarding-progress-bar';
import {
  flattenMuscleFocusSelections,
  OnboardingMusclePicker,
} from '@/components/onboarding-muscle-picker';
import { OnboardingThemePicker } from '@/components/onboarding-theme-picker';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useMotivationalLine } from '@/hooks/use-motivational-line';
import { completeOnboarding, patchOnboarding } from '@/lib/api-auth';
import { trackOnboardingCompleted, trackOnboardingStepCompleted } from '@/lib/analytics';
import type { ColorThemeId } from '@/lib/appearance/color-themes';
import type { OnboardingMuscleFocusId } from '@onemore/shared';

const GOALS: TrainingGoal[] = ['mass', 'strength', 'fat_loss', 'recomp', 'fitness'];
const LEVELS: TrainingLevel[] = ['beginner', 'intermediate', 'advanced'];
const ENVIRONMENTS: TrainingEnvironment[] = ['gym', 'home'];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const SESSION_MINUTES_OPTIONS = [30, 45, 60, 75, 90] as const;
const MOTIVATION_LEVELS = [1, 2, 3] as const;

const STEP_IDS = [
  'goal',
  'level',
  'availability',
  'sessionDuration',
  'muscleFocus',
  'environment',
  'motivation',
  'theme',
] as const;

type StepId = (typeof STEP_IDS)[number];

interface WizardState {
  trainingGoal?: TrainingGoal;
  trainingLevel?: TrainingLevel;
  trainingDaysPerWeek?: number;
  preferredSessionMinutes?: (typeof SESSION_MINUTES_OPTIONS)[number];
  muscleFocusIds: OnboardingMuscleFocusId[];
  trainingEnvironment?: TrainingEnvironment;
  motivationLevel?: number;
  colorThemeId?: ColorThemeId;
}

function buildCompletePayload(state: WizardState): OnboardingComplete | null {
  if (
    state.trainingGoal === undefined ||
    state.trainingLevel === undefined ||
    state.trainingEnvironment === undefined ||
    state.trainingDaysPerWeek === undefined ||
    state.preferredSessionMinutes === undefined ||
    state.muscleFocusIds.length === 0 ||
    state.motivationLevel === undefined
  ) {
    return null;
  }

  return {
    trainingGoal: state.trainingGoal,
    trainingLevel: state.trainingLevel,
    trainingEnvironment: state.trainingEnvironment,
    trainingDaysPerWeek: state.trainingDaysPerWeek,
    preferredSessionMinutes: state.preferredSessionMinutes,
    preferredMuscleGroups: flattenMuscleFocusSelections(state.muscleFocusIds),
    motivationLevel: state.motivationLevel,
  };
}

function isStepComplete(stepId: StepId, state: WizardState): boolean {
  switch (stepId) {
    case 'goal':
      return state.trainingGoal !== undefined;
    case 'level':
      return state.trainingLevel !== undefined;
    case 'availability':
      return state.trainingDaysPerWeek !== undefined;
    case 'sessionDuration':
      return state.preferredSessionMinutes !== undefined;
    case 'muscleFocus':
      return state.muscleFocusIds.length > 0;
    case 'environment':
      return state.trainingEnvironment !== undefined;
    case 'motivation':
      return state.motivationLevel !== undefined;
    case 'theme':
      return state.colorThemeId !== undefined;
    default:
      return false;
  }
}

/**
 * Mobile-first multi-step onboarding wizard.
 */
export function OnboardingWizard(): React.ReactElement {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const { accessToken, profile, setProfile } = useAuth();
  const welcomeLine = useMotivationalLine('onboardingWelcome', profile);
  const { colorThemeId, setColorThemeId } = useAppearance();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<WizardState>({
    trainingGoal: profile?.trainingGoal ?? undefined,
    trainingLevel: profile?.trainingLevel ?? undefined,
    trainingDaysPerWeek: profile?.trainingDaysPerWeek ?? undefined,
    preferredSessionMinutes:
      profile?.preferredSessionMinutes === 30 ||
      profile?.preferredSessionMinutes === 45 ||
      profile?.preferredSessionMinutes === 60 ||
      profile?.preferredSessionMinutes === 75 ||
      profile?.preferredSessionMinutes === 90
        ? profile.preferredSessionMinutes
        : undefined,
    trainingEnvironment: profile?.trainingEnvironment ?? undefined,
    muscleFocusIds: [],
    motivationLevel: profile?.motivationLevel ?? undefined,
    colorThemeId,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stepId: StepId = STEP_IDS[stepIndex] ?? STEP_IDS[0];
  const canContinue = isStepComplete(stepId, state);
  const progressLabel = useMemo(
    () => t('progress', { current: stepIndex + 1, total: STEP_IDS.length }),
    [stepIndex, t],
  );

  async function persistStep(): Promise<void> {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    switch (stepId) {
      case 'goal':
        await patchOnboarding(accessToken, { trainingGoal: state.trainingGoal });
        break;
      case 'level':
        await patchOnboarding(accessToken, { trainingLevel: state.trainingLevel });
        break;
      case 'availability':
        await patchOnboarding(accessToken, { trainingDaysPerWeek: state.trainingDaysPerWeek });
        break;
      case 'sessionDuration':
        await patchOnboarding(accessToken, {
          preferredSessionMinutes: state.preferredSessionMinutes,
        });
        break;
      case 'muscleFocus':
        await patchOnboarding(accessToken, {
          preferredMuscleGroups: flattenMuscleFocusSelections(state.muscleFocusIds),
        });
        break;
      case 'environment':
        await patchOnboarding(accessToken, { trainingEnvironment: state.trainingEnvironment });
        break;
      case 'motivation':
        await patchOnboarding(accessToken, { motivationLevel: state.motivationLevel });
        break;
      case 'theme':
        if (state.colorThemeId) {
          setColorThemeId(state.colorThemeId);
        }
        break;
    }
  }

  async function handleNext(): Promise<void> {
    if (!canContinue || !accessToken) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await persistStep();
      trackOnboardingStepCompleted(stepId, stepIndex);

      if (stepIndex === STEP_IDS.length - 1) {
        const payload = buildCompletePayload(state);
        if (!payload) {
          return;
        }
        const updated = await completeOnboarding(accessToken, payload);
        setProfile(updated);
        trackOnboardingCompleted(
          payload.motivationLevel,
          payload.trainingGoal,
          payload.trainingLevel,
        );
        router.push(`/${locale}/onboarding/choose-program`);
        return;
      }

      setStepIndex((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  function handleBack(): void {
    setError(null);
    setStepIndex((value) => Math.max(0, value - 1));
  }

  function handleThemeSelect(themeId: ColorThemeId): void {
    setState((prev) => ({ ...prev, colorThemeId: themeId }));
    setColorThemeId(themeId);
  }

  const stepTitle = t(`steps.${stepId}.title`);
  const stepSubtitle = t(`steps.${stepId}.subtitle`);

  return (
    <AdaptivePageShell
      title={stepTitle}
      description={stepSubtitle}
      variant={isDesktop ? 'default' : 'centered'}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="flex flex-col gap-2">
          {stepIndex === 0 ? (
            <p className="text-sm font-medium text-primary">{welcomeLine}</p>
          ) : null}
          <OnboardingProgressBar currentStep={stepIndex + 1} totalSteps={STEP_IDS.length} />
          <p className="text-xs font-medium text-muted-foreground">{progressLabel}</p>
        </div>

        <div className={isDesktop ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-col gap-3'}>
          {stepId === 'goal' &&
            GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                className={`rounded-lg border p-4 text-left transition-colors ${state.trainingGoal === goal ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                onClick={() => {
                  setState((prev) => ({ ...prev, trainingGoal: goal }));
                }}
              >
                <span className="font-medium">{t(`goals.${goal}`)}</span>
              </button>
            ))}

          {stepId === 'level' &&
            LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={`rounded-lg border p-4 text-left transition-colors ${state.trainingLevel === level ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                onClick={() => {
                  setState((prev) => ({ ...prev, trainingLevel: level }));
                }}
              >
                <span className="font-medium">{t(`levels.${level}`)}</span>
              </button>
            ))}

          {stepId === 'availability' &&
            DAYS_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                className={`rounded-lg border p-4 text-left transition-colors ${state.trainingDaysPerWeek === days ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                onClick={() => {
                  setState((prev) => ({ ...prev, trainingDaysPerWeek: days }));
                }}
              >
                <span className="font-medium">{t('daysPerWeek', { count: days })}</span>
              </button>
            ))}

          {stepId === 'sessionDuration' &&
            SESSION_MINUTES_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`rounded-lg border p-4 text-left transition-colors ${state.preferredSessionMinutes === minutes ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                onClick={() => {
                  setState((prev) => ({ ...prev, preferredSessionMinutes: minutes }));
                }}
              >
                <span className="font-medium">{t('sessionMinutes', { count: minutes })}</span>
              </button>
            ))}

          {stepId === 'muscleFocus' && (
            <div className="sm:col-span-2">
              <OnboardingMusclePicker
                selected={state.muscleFocusIds}
                onChange={(muscleFocusIds) => {
                  setState((prev) => ({ ...prev, muscleFocusIds }));
                }}
              />
            </div>
          )}

          {stepId === 'environment' &&
            ENVIRONMENTS.map((environment) => (
              <button
                key={environment}
                type="button"
                className={`rounded-lg border p-4 text-left transition-colors ${state.trainingEnvironment === environment ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                onClick={() => {
                  setState((prev) => ({ ...prev, trainingEnvironment: environment }));
                }}
              >
                <span className="font-medium">{t(`environments.${environment}`)}</span>
              </button>
            ))}

          {stepId === 'motivation' &&
            MOTIVATION_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={`rounded-lg border p-4 text-left transition-colors ${state.motivationLevel === level ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                onClick={() => {
                  setState((prev) => ({ ...prev, motivationLevel: level }));
                }}
              >
                <span className="font-medium">{t(`motivation.${String(level)}.title`)}</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`motivation.${String(level)}.description`)}
                </p>
              </button>
            ))}

          {stepId === 'theme' && (
            <div className="sm:col-span-2">
              <OnboardingThemePicker
                selectedId={state.colorThemeId ?? colorThemeId}
                onSelect={handleThemeSelect}
              />
            </div>
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {isDesktop ? (
          <div className="flex gap-3">
            {stepIndex > 0 ? (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                {t('back')}
              </Button>
            ) : null}
            <Button
              type="button"
              className="flex-1"
              disabled={!canContinue || loading}
              onClick={() => {
                void handleNext();
              }}
            >
              {stepIndex === STEP_IDS.length - 1 ? t('finish') : t('continue')}
            </Button>
          </div>
        ) : (
          <GymMobileActions>
            <Button
              type="button"
              disabled={!canContinue || loading}
              onClick={() => {
                void handleNext();
              }}
            >
              {stepIndex === STEP_IDS.length - 1 ? t('finish') : t('continue')}
            </Button>
            {stepIndex > 0 ? (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                {t('back')}
              </Button>
            ) : null}
          </GymMobileActions>
        )}
      </div>
    </AdaptivePageShell>
  );
}
