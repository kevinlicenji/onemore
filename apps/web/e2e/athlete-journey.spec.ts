import { expect, test } from '@playwright/test';

import {
  applyBeginnerTemplate,
  assertWorkoutTouchTargets,
  completeOnboardingWizard,
  dismissPrModalIfVisible,
  fetchSessionDetail,
  registerAthlete,
  skipRestTimerIfVisible,
  startProgrammedWorkout,
} from './helpers/journey';

test.describe('athlete journey: register → onboarding → workout → sync', () => {
  test('completes MVP-1 happy path and syncs offline set mutation', async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = await registerAthlete(page, request);
    await completeOnboardingWizard(page);
    await applyBeginnerTemplate(page);

    const sessionId = await startProgrammedWorkout(page);
    await assertWorkoutTouchTargets(page);

    const completeButtons = page.getByRole('button', { name: 'Completa serie' });
    await completeButtons.first().click();
    await dismissPrModalIfVisible(page);
    await skipRestTimerIfVisible(page);

    await page.context().setOffline(true);
    await completeButtons.nth(1).click();
    await expect(completeButtons).toHaveCount(1);

    const syncResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/sync/batch') &&
        response.request().method() === 'POST' &&
        response.ok(),
    );
    await page.context().setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await syncResponse;

    const synced = await fetchSessionDetail(request, user.accessToken, sessionId);
    const completedSets = synced.exercises.flatMap((exercise) =>
      exercise.sets.filter((set) => set.isCompleted),
    );
    expect(completedSets.length).toBeGreaterThanOrEqual(2);

    await page.getByRole('button', { name: 'Termina workout' }).click();
    await page.waitForURL(/\/it\/dashboard$/);

    await page.getByRole('link', { name: 'Storico workout' }).click();
    await page.waitForURL(/\/it\/history$/);
    await expect(page.getByText('Day A').first()).toBeVisible();
  });
});
