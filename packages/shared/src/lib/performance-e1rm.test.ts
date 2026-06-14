import { describe, expect, it } from 'vitest';

import {
  classifyPerformanceFeedback,
  computePerformanceDeltaPercent,
  computePerformanceE1rm,
} from './performance-e1rm.js';

describe('computePerformanceE1rm', () => {
  it('uses Brzycki for reps up to 10', () => {
    expect(computePerformanceE1rm(100, 5)).toBeCloseTo(100 * (36 / 32), 2);
    expect(computePerformanceE1rm(100, 10)).toBeCloseTo(100 * (36 / 27), 2);
  });

  it('uses Epley for reps above 10', () => {
    expect(computePerformanceE1rm(100, 11)).toBeCloseTo(100 * (1 + 11 / 30), 2);
    expect(computePerformanceE1rm(80, 12)).toBeCloseTo(80 * (1 + 12 / 30), 2);
  });

  it('returns null for invalid inputs', () => {
    expect(computePerformanceE1rm(0, 5)).toBeNull();
    expect(computePerformanceE1rm(100, 0)).toBeNull();
  });
});

describe('computePerformanceDeltaPercent', () => {
  it('computes positive delta', () => {
    expect(computePerformanceDeltaPercent(110, 100)).toBeCloseTo(10, 2);
  });

  it('returns null for non-positive baseline', () => {
    expect(computePerformanceDeltaPercent(110, 0)).toBeNull();
  });
});

describe('classifyPerformanceFeedback', () => {
  it('classifies superior performance at +1% or more', () => {
    expect(classifyPerformanceFeedback(1)).toBe('superior');
    expect(classifyPerformanceFeedback(3)).toBe('superior');
  });

  it('classifies on-target band between -2.9% and +0.9%', () => {
    expect(classifyPerformanceFeedback(0)).toBe('on_target');
    expect(classifyPerformanceFeedback(0.9)).toBe('on_target');
    expect(classifyPerformanceFeedback(-2.9)).toBe('on_target');
  });

  it('classifies fatigue at -3% or below', () => {
    expect(classifyPerformanceFeedback(-3)).toBe('fatigue');
    expect(classifyPerformanceFeedback(-8)).toBe('fatigue');
  });
});
