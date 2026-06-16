import { describe, expect, it } from 'vitest';

import { computeE1rm } from '../pr/e1rm.js';
import {
  classifyPerformanceFeedback,
  computePerformanceDeltaPercent,
  computePerformanceE1rm,
} from './performance-e1rm.js';

describe('computePerformanceE1rm', () => {
  it('matches canonical computeE1rm (Epley ≤10, Brzycki 11–15)', () => {
    expect(computePerformanceE1rm(100, 5)).toBe(computeE1rm(100, 5));
    expect(computePerformanceE1rm(100, 10)).toBe(computeE1rm(100, 10));
    expect(computePerformanceE1rm(100, 11)).toBe(computeE1rm(100, 11));
    expect(computePerformanceE1rm(80, 12)).toBe(computeE1rm(80, 12));
  });

  it('returns null for invalid inputs', () => {
    expect(computePerformanceE1rm(0, 5)).toBeNull();
    expect(computePerformanceE1rm(100, 0)).toBeNull();
    expect(computePerformanceE1rm(100, 16)).toBeNull();
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
