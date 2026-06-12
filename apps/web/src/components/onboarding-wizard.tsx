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

import { useAuth } from '@/components/auth-provider';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { completeOnboarding, patchOnboarding } from '@/lib/api-auth';
import { trackOnboardingCompleted, trackOnboardingStepCompleted } from '@/lib/analytics';

const GOALS: TrainingGoal[] = ['mass', 'strength', 'fat_loss', 'recomp', 'fitness'];
const LEVELS: TrainingLevel[] = ['beginner', 'intermediate', 'advanced'];
const ENVIRONMENTS: TrainingEnvironment[] = ['gym', 'home'];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const MOTIVATION_LEVELS = [1, 2, 3] as const;

const STEP_IDS = ['goal', 'level', 'availability', 'environment', 'motivation'] as const;

type StepId = (typeof STEP_IDS)[number];

interface WizardState {
  trainingGoal?: TrainingGoal;
  trainingLevel?: TrainingLevel;
  trainingDaysPerWeek?: number;
  trainingEnvironment?: TrainingEnvironment;
  motivationLevel?: number;
}

function buildCompletePayload(state: WizardState): OnboardingComplete | null {
  if (
    state.trainingGoal === undefined ||
    state.trainingLevel === undefined ||
    state.trainingEnvironment === undefined ||
    state.trainingDaysPerWeek === undefined ||
    state.motivationLevel === undefined
  ) {
    return null;
  }

  return {
    trainingGoal: state.trainingGoal,
    trainingLevel: state.trainingLevel,
    trainingEnvironment: state.trainingEnvironment,
    trainingDaysPerWeek: state.trainingDaysPerWeek,
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
    case 'environment':
      return state.trainingEnvironment !== undefined;
    case 'motivation':
      return state.motivationLevel !== undefined;
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
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<WizardState>({
    trainingGoal: profile?.trainingGoal ?? undefined,
    trainingLevel: profile?.trainingLevel ?? undefined,
    trainingDaysPerWeek: profile?.trainingDaysPerWeek ?? undefined,
    trainingEnvironment: profile?.trainingEnvironment ?? undefined,
    motivationLevel: profile?.motivationLevel ?? undefined,
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
      case 'environment':
        await patchOnboarding(accessToken, { trainingEnvironment: state.trainingEnvironment });
        break;
      case 'motivation':
        await patchOnboarding(accessToken, { motivationLevel: state.motivationLevel });
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

  const stepTitle = t(`steps.${stepId}.title`);
  const stepSubtitle = `${progressLabel} · ${t(`steps.${stepId}.subtitle`)}`;

  return (
    <AdaptivePageShell
      title={stepTitle}
      description={stepSubtitle}
      variant={isDesktop ? 'default' : 'centered'}
    >
      <div className={isDesktop ? 'grid max-w-3xl gap-3 sm:grid-cols-2' : 'flex flex-col gap-3'}>
        {stepId === 'goal' &&
          GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              className={`rounded-lg border p-4 text-left ${state.trainingGoal === goal ? 'border-primary bg-primary/5' : ''}`}
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
              className={`rounded-lg border p-4 text-left ${state.trainingLevel === level ? 'border-primary bg-primary/5' : ''}`}
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
              className={`rounded-lg border p-4 text-left ${state.trainingDaysPerWeek === days ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => {
                setState((prev) => ({ ...prev, trainingDaysPerWeek: days }));
              }}
            >
              <span className="font-medium">{t('daysPerWeek', { count: days })}</span>
            </button>
          ))}

        {stepId === 'environment' &&
          ENVIRONMENTS.map((environment) => (
            <button
              key={environment}
              type="button"
              className={`rounded-lg border p-4 text-left ${state.trainingEnvironment === environment ? 'border-primary bg-primary/5' : ''}`}
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
              className={`rounded-lg border p-4 text-left ${state.motivationLevel === level ? 'border-primary bg-primary/5' : ''}`}
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
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isDesktop ? (
        <div className="flex max-w-3xl gap-3">
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
    </AdaptivePageShell>
  );
}
