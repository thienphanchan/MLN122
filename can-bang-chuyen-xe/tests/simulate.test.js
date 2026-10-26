import { describe, expect, test } from 'vitest';
import { EVENTS, ROUNDS } from '../src/game/events.js';
import { OK_THRESHOLD, explain, isAllGreen, simulate } from '../src/game/simulate.js';
import * as original from './fixtures/original.js';

const COMMISSIONS = Array.from({ length: 26 }, (_, i) => 15 + i); // 15..40
const POLICIES = [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
];
const minBar = ({ D, P, K, X }) => Math.min(D, P, K, X);

describe('simulate', () => {
  test('day 1 at 20% with no policy keeps all four bars at 50 or above', () => {
    const result = simulate(1, 20, false, false);
    expect(result).toEqual({ D: 70, P: 52, K: 72, X: 59, strike: false });
    expect(minBar(result)).toBeGreaterThanOrEqual(OK_THRESHOLD);
    expect(isAllGreen(result)).toBe(true);
  });

  test('day 2 passes only with both policies, at 19-26%', () => {
    for (const c of COMMISSIONS) {
      for (const [floor, dialogue] of POLICIES) {
        const expected = floor && dialogue && c >= 19 && c <= 26;
        expect(isAllGreen(simulate(2, c, floor, dialogue)), `c=${c} floor=${floor} dialogue=${dialogue}`).toBe(expected);
      }
    }
  });

  test('day 4 without dialogue at high commission leaves a bar under 50', () => {
    for (let c = 32; c <= 40; c++) {
      for (const floor of [false, true]) {
        expect(minBar(simulate(4, c, floor, false)), `c=${c} floor=${floor}`).toBeLessThan(OK_THRESHOLD);
      }
    }
    expect(simulate(4, 35, false, false).strike).toBe(true);
  });

  test('matches the original formula for every day, commission and policy', () => {
    for (let r = 1; r <= ROUNDS; r++) {
      for (const c of COMMISSIONS) {
        for (const [floor, dialogue] of POLICIES) {
          expect(simulate(r, c, floor, dialogue)).toEqual(original.simulate(r, c, floor, dialogue));
        }
      }
    }
  });

  test('scores are integers between 0 and 100', () => {
    for (let r = 1; r <= ROUNDS; r++) {
      for (const c of COMMISSIONS) {
        for (const [floor, dialogue] of POLICIES) {
          const { D, P, K, X } = simulate(r, c, floor, dialogue);
          for (const v of [D, P, K, X]) {
            expect(Number.isInteger(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });
});

describe('isAllGreen', () => {
  test('needs every bar at 50 or above', () => {
    expect(isAllGreen({ D: 50, P: 50, K: 50, X: 50 })).toBe(true);
    expect(isAllGreen({ D: 50, P: 49, K: 90, X: 90 })).toBe(false);
  });
});

describe('explain', () => {
  test('matches the original explanation for every day, commission and policy', () => {
    for (let r = 1; r <= ROUNDS; r++) {
      for (const c of COMMISSIONS) {
        for (const [floor, dialogue] of POLICIES) {
          const res = simulate(r, c, floor, dialogue);
          res.allGreen = isAllGreen(res);
          const ref = original.simulate(r, c, floor, dialogue);
          ref.allGreen = res.allGreen;
          expect(explain(r, c, floor, dialogue, res)).toBe(original.explainFor(r, c, floor, dialogue, ref));
        }
      }
    }
  });

  test('names the mass log-off when drivers strike on day 4', () => {
    const res = simulate(4, 35, false, false);
    res.allGreen = isAllGreen(res);
    expect(explain(4, 35, false, false, res)).toContain('tài xế tắt app hàng loạt');
  });
});

describe('EVENTS', () => {
  test('are the five original events, word for word', () => {
    expect(ROUNDS).toBe(5);
    expect(EVENTS).toEqual(original.EVENTS);
  });
});
