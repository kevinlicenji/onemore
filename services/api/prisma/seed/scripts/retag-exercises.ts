/**
 * One-off / maintenance script: assign curated muscle tags to catalog exercises.
 * Run: pnpm --filter api exec tsx prisma/seed/scripts/retag-exercises.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MuscleGroup } from '@onemore/shared';

interface ExerciseRow {
  slug: string;
  names: { en: string; it?: string };
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  isBodyweight: boolean;
  wgerId?: number;
}

type Tags = MuscleGroup[];

/** Curated muscle tags per exercise slug (max 3). */
const EXERCISE_MUSCLE_TAGS: Record<string, Tags> = {
  'assisted-dip-machine': ['triceps', 'chest'],
  'backward-arm-circles': ['shoulders'],
  'biceps-curl': ['biceps'],
  'biceps-curl-machine': ['biceps'],
  'dumbbells-on-scott-machine': ['biceps'],
  'floor-dips': ['triceps'],
  'forward-arm-circles': ['shoulders'],
  'hammer-curl': ['biceps', 'forearms'],
  'pike-push-ups': ['shoulders', 'triceps'],
  'preacher-curl-machine': ['biceps'],
  'push-up-rotations': ['chest', 'core'],
  'sloper-hanging': ['forearms', 'back'],
  'smith-machine-close-grip-bench-press': ['triceps'],
  'tricep-extension-machine': ['triceps'],
  'tricep-pushdown': ['triceps'],
  'triceps-on-machine': ['triceps'],
  'assisted-pull-up-machine': ['back', 'biceps'],
  'back-extension-machine': ['lower_back', 'glutes'],
  'back-neck-stretch': ['traps'],
  'barbell-row': ['back'],
  'cable-row': ['back'],
  'child-s-pose': ['back'],
  'chin-tuck': ['traps'],
  'chin-up': ['back', 'biceps'],
  'chin-ups': ['back', 'biceps'],
  'front-lever-tuck': ['back', 'core'],
  'front-neck-stretch': ['traps'],
  'lat-pulldown': ['back'],
  'lat-pulldown-machine': ['back'],
  'leverage-machine-iso-row': ['back'],
  'muscle-up': ['back', 'biceps'],
  'pull-up': ['back', 'shoulders'],
  'pull-ups-on-machine': ['back', 'shoulders'],
  'pullover-machine': ['back', 'chest'],
  'resistance-band-row': ['back'],
  'seated-row-machine': ['back'],
  superman: ['lower_back', 'glutes'],
  'wall-slides': ['shoulders'],
  'bag-training': ['shoulders', 'core'],
  burpee: ['full_body'],
  cycling: ['cardio'],
  elliptical: ['cardio'],
  'high-knees': ['cardio'],
  'jump-rope-basic-jumps': ['cardio'],
  'mountain-climber': ['core', 'cardio'],
  'rowing-machine': ['back', 'cardio'],
  'ski-machine': ['cardio'],
  'stair-climber': ['cardio'],
  'stationary-bike': ['cardio'],
  'suspended-crossess': ['chest'],
  'treadmill-run': ['cardio'],
  '4-count-burpees': ['full_body'],
  'bench-press': ['chest'],
  'chest-press-machine': ['chest'],
  'flat-machine-press': ['chest'],
  'high-incline-smith-machine-press': ['chest', 'shoulders'],
  'incline-chest-press-machine': ['chest'],
  'incline-dumbbell-press': ['chest'],
  'incline-smith-press': ['chest'],
  'inverted-rows': ['back'],
  'leverage-machine-chest-press': ['chest'],
  'machine-chest-fly': ['chest'],
  'machine-chest-press': ['chest'],
  'machine-chest-press-exercise': ['chest'],
  'mountain-climbers': ['core', 'cardio'],
  'no-push-up-burpees': ['full_body'],
  'pec-deck': ['chest'],
  'pec-deck-machine': ['chest'],
  'push-up': ['chest'],
  'resistance-band-press': ['chest'],
  'smith-machine-bench-press': ['chest'],
  'smith-machine-slight-incline-press': ['chest'],
  'ab-crunch-machine': ['core'],
  'biceps-with-trx': ['biceps'],
  'box-squat': ['quadriceps', 'glutes'],
  clamshell: ['glutes'],
  'commando-pull-ups': ['back', 'core'],
  'crunches-on-machine': ['core'],
  'dead-bug': ['core'],
  'front-lever': ['back', 'core'],
  'hollow-hold': ['core'],
  'horizontal-traction-isometry': ['back', 'chest'],
  'ice-scream-maker': ['core'],
  'knee-raises': ['core'],
  'leg-raise': ['core'],
  'leg-raises-pull-up-bar': ['core'],
  'medicine-ball-booklet-crunch': ['core'],
  'one-armed-push-ups': ['chest'],
  'pallof-press': ['core'],
  plank: ['core'],
  'rotary-torso-machine': ['core'],
  'side-bends-on-machine': ['core'],
  'side-plank': ['core'],
  'torso-rotation-machine': ['core'],
  'trx-rows': ['back'],
  vpushup: ['chest', 'shoulders'],
  'walking-bridge': ['glutes', 'core'],
  'calf-press-using-leg-press-machine': ['calves'],
  'calf-raises-left-leg': ['calves'],
  'calf-raises-on-hackenschmitt-machine': ['calves'],
  'calf-raises-one-legged': ['calves'],
  'calf-raises-right-leg': ['calves'],
  'leg-curl-with-elastic': ['hamstrings'],
  'standing-calf-raises': ['calves'],
  'tibialis-raises': ['calves'],
  'alternate-back-lunges': ['quadriceps', 'glutes'],
  'barbell-hack-squats': ['quadriceps', 'glutes'],
  'bulgarian-split-squat': ['quadriceps', 'glutes'],
  'bulgarian-split-squats-left': ['quadriceps', 'glutes'],
  'bulgarian-split-squats-right': ['quadriceps', 'glutes'],
  'calf-raise': ['calves'],
  'calf-raise-machine': ['calves'],
  'calf-raise-using-hack-squat-machine': ['calves'],
  'front-squat': ['quadriceps', 'glutes'],
  'glute-bridge': ['glutes'],
  'glute-kickback-machine': ['glutes'],
  'hack-squat-machine': ['quadriceps', 'glutes'],
  'hack-squats': ['quadriceps', 'glutes'],
  'hip-abductor-machine': ['abductors'],
  'hip-adductor-machine': ['adductors'],
  'jump-squat': ['quadriceps', 'glutes'],
  'kneeling-kickbacks': ['glutes'],
  'leg-curl': ['hamstrings'],
  'leg-extension': ['quadriceps'],
  'leg-press': ['quadriceps', 'glutes'],
  'leg-press-on-hackenschmidt-machine': ['quadriceps', 'glutes'],
  'leg-press-toe-press': ['calves'],
  'leg-presses-narrow': ['quadriceps', 'glutes'],
  'leg-presses-wide': ['quadriceps', 'glutes'],
  lunges: ['quadriceps', 'glutes'],
  'machine-hip-abduction': ['abductors'],
  'pause-hack-squats': ['quadriceps', 'glutes'],
  'resistance-band-squat': ['quadriceps', 'glutes'],
  'reverse-lunge': ['quadriceps', 'glutes'],
  'romanian-deadlift': ['hamstrings', 'glutes'],
  'seated-calf-raise-machine': ['calves'],
  'seated-leg-curl-machine': ['hamstrings'],
  'shinbox-ir-stretch': ['glutes'],
  'side-split-squats-left': ['adductors', 'quadriceps'],
  'side-split-squats-right': ['adductors', 'quadriceps'],
  'smith-machine-split-squat': ['quadriceps', 'glutes'],
  'smith-machine-squat': ['quadriceps', 'glutes'],
  'split-squat': ['quadriceps', 'glutes'],
  'split-squats-left': ['quadriceps', 'glutes'],
  squat: ['quadriceps', 'glutes'],
  'face-pull': ['shoulders', 'back'],
  'head-turns': ['traps'],
  'lateral-raise': ['shoulders'],
  'lateral-raise-machine': ['shoulders'],
  'machine-lateral-wise': ['shoulders'],
  'machine-side-lateral-raises': ['shoulders'],
  'overhead-press': ['shoulders'],
  'pec-deck-rear-delt-fly': ['shoulders'],
  'pike-push-up': ['shoulders'],
  'resistance-band-pull-apart': ['shoulders'],
  'reverse-fly-machine': ['shoulders'],
  'shoulder-press-machine': ['shoulders'],
  'shoulder-press-on-machine': ['shoulders'],
  'smith-machine-shoulder-press': ['shoulders'],
  'smith-press': ['shoulders'],
};

const seedDir = dirname(fileURLToPath(import.meta.url));
const exercisesPath = join(seedDir, '../data/exercises.json');

function main(): void {
  const exercises = JSON.parse(readFileSync(exercisesPath, 'utf8')) as ExerciseRow[];
  const missing: string[] = [];

  const updated = exercises.map((row) => {
    const tags = EXERCISE_MUSCLE_TAGS[row.slug];
    if (!tags || tags.length === 0) {
      missing.push(row.slug);
      return row;
    }
    return {
      ...row,
      primaryMuscles: tags,
      secondaryMuscles: [],
    };
  });

  if (missing.length > 0) {
    console.error('Missing muscle tags for:', missing.join(', '));
    process.exitCode = 1;
    return;
  }

  writeFileSync(exercisesPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  console.log(`Retagged ${String(updated.length)} exercises in exercises.json`);
}

main();
