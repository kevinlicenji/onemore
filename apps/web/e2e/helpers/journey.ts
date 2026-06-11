import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { E2E_API_URL, E2E_SESSION_STORAGE_KEY } from '../test-env';

export const E2E_PASSWORD = 'zQ8!mKp2vLn9Wx4rE2eTest';

export interface RegisteredUser {
  email: string;
  username: string;
  accessToken: string;
}

/**
 * Register via API then seed sessionStorage before the first app navigation.
 */
export async function registerAthlete(
  page: Page,
  request: APIRequestContext,
): Promise<RegisteredUser> {
  const suffix = String(Date.now());
  const email = `e2e-${suffix}@example.com`;
  const username = `e2e_${suffix.slice(-8)}`;

  const registerResponse = await request.post(`${E2E_API_URL}/api/v1/auth/register`, {
    data: {
      email,
      password: E2E_PASSWORD,
      username,
      locale: 'it',
      birthYear: 1995,
      timezone: 'Europe/Rome',
      consents: { tos: true, privacy: true, fitnessData: true },
    },
  });
  if (!registerResponse.ok()) {
    throw new Error(`Register failed: ${String(registerResponse.status())}`);
  }

  const body = (await registerResponse.json()) as {
    accessToken: string;
    user: {
      id: string;
      email: string;
      username: string | null;
      displayName: string | null;
      locale: string;
    };
  };

  await page.context().addInitScript(
    ({ storageKey, session }) => {
      sessionStorage.setItem(storageKey, JSON.stringify(session));
    },
    {
      storageKey: E2E_SESSION_STORAGE_KEY,
      session: { accessToken: body.accessToken, user: body.user },
    },
  );

  await page.goto('/it/onboarding', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Qual è il tuo obiettivo principale?' }).waitFor({
    timeout: 60_000,
  });

  return { email, username, accessToken: body.accessToken };
}

/**
 * Complete the five-step onboarding wizard in Italian.
 */
export async function completeOnboardingWizard(page: Page): Promise<void> {
  await page.getByRole('heading', { name: 'Qual è il tuo obiettivo principale?' }).waitFor();
  await page.getByRole('button', { name: 'Forza' }).click();
  await page.getByRole('button', { name: 'Continua' }).click();

  await page.getByRole('button', { name: 'Principiante' }).click();
  await page.getByRole('button', { name: 'Continua' }).click();

  await page.getByRole('button', { name: '3 giorni a settimana' }).click();
  await page.getByRole('button', { name: 'Continua' }).click();

  await page.getByRole('button', { name: 'Palestra' }).click();
  await page.getByRole('button', { name: 'Continua' }).click();

  await page.getByRole('button', { name: /Guidato/ }).click();

  const [completeResponse] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/onboarding/complete') &&
        res.request().method() === 'POST' &&
        res.ok(),
    ),
    page.getByRole('button', { name: 'Completa' }).click(),
  ]);
  if (!completeResponse.ok()) {
    throw new Error(`Onboarding complete failed: ${String(completeResponse.status())}`);
  }

  // OnboardingPage redirects completed users to dashboard; wizard may push choose-program first.
  await page.waitForURL(/\/it\/(onboarding\/choose-program|dashboard)$/);
}

/**
 * Apply the beginner full-body gym template.
 */
export async function applyBeginnerTemplate(page: Page): Promise<void> {
  if (page.url().includes('/dashboard')) {
    await page.getByRole('link', { name: 'Scegli o crea un programma' }).click();
  } else {
    await page.getByRole('link', { name: /Usa un template/i }).click();
  }
  await page.waitForURL(/\/it\/programs\/templates$/);
  await page.getByRole('button', { name: 'Beginner Full Body' }).click();
  await page.waitForURL(/\/it\/dashboard$/);
}

/**
 * Start the next programmed workout day.
 */
export async function startProgrammedWorkout(page: Page): Promise<string> {
  await page.getByRole('link', { name: 'Inizia workout' }).first().click();
  await page.waitForURL(/\/it\/workouts\/start$/);

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/workouts/sessions') &&
        res.request().method() === 'POST' &&
        res.ok(),
    ),
    page.getByRole('button', { name: 'Inizia prossimo giorno' }).click(),
  ]);

  const session = (await response.json()) as { id: string };
  await page.waitForURL(new RegExp(`/it/workouts/${session.id}$`));
  await page.getByRole('button', { name: 'Completa serie' }).first().waitFor();
  return session.id;
}

/**
 * Skip all sets on the current exercise.
 */
export async function skipAllSetsOnCurrentExercise(page: Page): Promise<void> {
  const skipButtons = page.getByRole('button', { name: 'Salta' });
  while ((await skipButtons.count()) > 0) {
    await skipButtons.first().click();
  }
}

/**
 * Dismiss PR celebration modal when shown.
 */
export async function dismissPrModalIfVisible(page: Page): Promise<void> {
  const dismiss = page.getByRole('button', { name: 'Continua' });
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
  }
}

/**
 * Skip rest timer overlay when shown.
 */
export async function skipRestTimerIfVisible(page: Page): Promise<void> {
  const skipRest = page.getByRole('button', { name: 'Salta recupero' });
  if (await skipRest.isVisible().catch(() => false)) {
    await skipRest.click();
  }
}

/**
 * Assert primary workout controls meet minimum touch target size.
 */
export async function assertWorkoutTouchTargets(page: Page): Promise<void> {
  const minSize = 44;
  const completeSet = page.getByRole('button', { name: 'Completa serie' }).first();
  const finishWorkout = page.getByRole('button', { name: 'Termina workout' });

  for (const target of [completeSet, finishWorkout]) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(minSize);
      expect(box.width).toBeGreaterThanOrEqual(minSize);
    }
  }
}

/**
 * Fetch workout session detail from the API.
 */
export async function fetchSessionDetail(
  request: APIRequestContext,
  accessToken: string,
  sessionId: string,
): Promise<{ exercises: Array<{ sets: Array<{ isCompleted: boolean }> }> }> {
  const response = await request.get(`${E2E_API_URL}/api/v1/workouts/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok()) {
    throw new Error(`Session fetch failed: ${String(response.status())}`);
  }
  return (await response.json()) as {
    exercises: Array<{ sets: Array<{ isCompleted: boolean }> }>;
  };
}
