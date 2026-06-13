import type { OnboardingUpdate } from '@onemore/shared';
import type { Prisma } from '@prisma/client';

/**
 * Builds a Prisma patch with only defined onboarding fields.
 *
 * @param input - Partial onboarding payload from the wizard.
 * @returns Safe update data without undefined keys.
 */
export function buildOnboardingPatch(input: OnboardingUpdate): Prisma.UserUpdateInput {
  const data: Prisma.UserUpdateInput = {};

  if (input.trainingGoal !== undefined) {
    data.trainingGoal = input.trainingGoal;
  }
  if (input.trainingLevel !== undefined) {
    data.trainingLevel = input.trainingLevel;
  }
  if (input.trainingEnvironment !== undefined) {
    data.trainingEnvironment = input.trainingEnvironment;
  }
  if (input.trainingDaysPerWeek !== undefined) {
    data.trainingDaysPerWeek = input.trainingDaysPerWeek;
  }
  if (input.preferredSessionMinutes !== undefined) {
    data.preferredSessionMinutes = input.preferredSessionMinutes;
  }
  if (input.preferredMuscleGroups !== undefined) {
    data.preferredMuscleGroups = input.preferredMuscleGroups;
  }
  if (input.motivationLevel !== undefined) {
    data.motivationLevel = input.motivationLevel;
  }

  return data;
}
