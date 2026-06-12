import { TARGET_REPS_TO_FAILURE } from '@onemore/shared';

import { buildNumericWheelValues } from './scroll-wheel-snap';

export const METRIC_SETS_MIN = 1;
export const METRIC_SETS_MAX = 20;
export const METRIC_REPS_MIN = 0;
export const METRIC_REPS_MAX = 25;
export const METRIC_WEIGHT_MIN = 0;
export const METRIC_WEIGHT_MAX = 500;
export const METRIC_WEIGHT_STEP = 0.5;
export const METRIC_REST_MIN = 0;
export const METRIC_REST_MAX = 150;
export const METRIC_REST_STEP = 5;

export const WEIGHT_WHEEL_VALUES = buildNumericWheelValues(
  METRIC_WEIGHT_MIN,
  METRIC_WEIGHT_MAX,
  METRIC_WEIGHT_STEP,
);

export const REST_WHEEL_VALUES = buildNumericWheelValues(
  METRIC_REST_MIN,
  METRIC_REST_MAX,
  METRIC_REST_STEP,
);

export const SETS_WHEEL_VALUES = buildNumericWheelValues(
  METRIC_SETS_MIN,
  METRIC_SETS_MAX,
  1,
);

export const REPS_PRESCRIPTION_WHEEL_VALUES: number[] = [
  ...buildNumericWheelValues(METRIC_REPS_MIN, METRIC_REPS_MAX, 1),
  TARGET_REPS_TO_FAILURE,
];
