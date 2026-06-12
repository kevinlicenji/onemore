import { expect, test } from '@playwright/test';

import {
  applyBeginnerTemplate,
  assertWorkoutTouchTargets,
  completeActiveSet,
  completeOnboardingWizard,
  completeSetButtons,
  dismissPrModalIfVisible,
  fetchSessionDetail,
  registerAthlete,
  skipRestTimerIfVisible,
  startProgrammedWorkout,
  waitForActiveCompleteSet,
} from './helpers/journey';

test.describe('athlete journey: register → onboarding → workout → sync', () => {
  test('completes MVP-1 happy path and syncs offline set mutation', async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = await registerAthlete(page, request);
    await completeOnboardingWizard(page);
    await applyBeginnerTemplate(page);

    const sessionId = await startProgrammedWorkout(page);
    await assertWorkoutTouchTargets(page);

    const completeButtons = completeSetButtons(page);

    // First set online; desktop shows one active complete button at a time.
    await completeActiveSet(page);

    await page.context().setOffline(true);
    await waitForActiveCompleteSet(page);
    await completeButtons.first().click();
    await dismissPrModalIfVisible(page);
    await skipRestTimerIfVisible(page);
    await expect(completeButtons).toHaveCount(1);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/sync/batch') &&
          response.request().method() === 'POST' &&
          response.ok(),
      ),
      page.context().setOffline(false),
    ]);

    const synced = await fetchSessionDetail(request, user.accessToken, sessionId);
    const completedSets = synced.exercises.flatMap((exercise) =>
      exercise.sets.filter((set) => set.isCompleted),
    );
    expect(completedSets.length).toBeGreaterThanOrEqual(2);

    await page.getByRole('button', { name: 'Termina workout' }).click();
    await page.waitForURL(/\/it\/dashboard$/);

    await page.getByRole('link', { name: 'Storico' }).click();
    await page.waitForURL(/\/it\/history$/);
    await expect(page.getByText('Day A').first()).toBeVisible();
  });
});
