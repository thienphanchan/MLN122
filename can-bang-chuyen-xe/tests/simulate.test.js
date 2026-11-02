import { describe, expect, test } from 'vitest';
import { EVENTS, ROUNDS } from '../src/game/events.js';
import { OK_THRESHOLD, explain, getWaitingPenalty, isAllGreen, simulate } from '../src/game/simulate.js';
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

  test('can still read the original formula for every historical decision', () => {
    for (let r = 1; r <= ROUNDS; r++) {
      for (const c of COMMISSIONS) {
        for (const [floor, dialogue] of POLICIES) {
          expect(simulate(r, c, floor, dialogue, 1)).toEqual(original.simulate(r, c, floor, dialogue));
        }
      }
    }
  });

  test('no unchanged commission and policies can win all five days', () => {
    for (const c of COMMISSIONS) for (const [floor, dialogue] of POLICIES) {
      const results = Array.from({ length: ROUNDS }, (_, i) => simulate(i + 1, c, floor, dialogue));
      expect(results.every(isAllGreen), `${c}, ${floor}, ${dialogue}`).toBe(false);
    }
  });

  test('each new shock after fuel prices breaks the previous day’s balance', () => {
    for (let day = 2; day < ROUNDS; day++) {
      let solutions = 0;
      for (const c of COMMISSIONS) for (const [floor, dialogue] of POLICIES) {
        if (!isAllGreen(simulate(day, c, floor, dialogue))) continue;
        solutions++;
        expect(isAllGreen(simulate(day + 1, c, floor, dialogue)), `day ${day}, ${c}, ${floor}, ${dialogue}`).toBe(false);
      }
      expect(solutions).toBeGreaterThan(0);
    }
  });

  test('changing the decisions can restore balance after each market shock', () => {
    const choices = [[20, false, false], [22, true, true], [22, false, true], [22, true, true], [16, true, true]];
    const expected = [
      { D: 70, P: 52, K: 72, X: 59, strike: false },
      { D: 70, P: 51, K: 68, X: 81, strike: false },
      { D: 70, P: 52, K: 72, X: 69, strike: false },
      { D: 68, P: 50, K: 67, X: 84, strike: false },
      { D: 100, P: 53, K: 86, X: 99, strike: false },
    ];
    choices.forEach((choice, i) => {
      const scores = simulate(i + 1, ...choice);
      expect(scores).toEqual(expected[i]);
      expect(isAllGreen(scores)).toBe(true);
    });
  });

  test('peak-hour waiting pressure falls as drivers become available and clears at full supply', () => {
    expect(getWaitingPenalty(40)).toBeGreaterThan(getWaitingPenalty(70));
    expect(getWaitingPenalty(70)).toBeGreaterThan(getWaitingPenalty(90));
    expect(getWaitingPenalty(90)).toBeGreaterThan(0);
    expect(getWaitingPenalty(100)).toBe(0);
    for (const c of COMMISSIONS) for (const [floor, dialogue] of POLICIES) {
      const day = simulate(1, c, floor, dialogue);
      const peak = simulate(5, c, floor, dialogue);
      expect(peak.D).toBe(day.D);
      expect(peak.K).toBeLessThanOrEqual(day.K);
      if (day.D === 100) expect(peak).toEqual(day);
      else expect(peak.K).toBeLessThan(day.K);
    }
  });

  test('at peak hours improving driver supply restores customer service and social benefits', () => {
    const unchanged = simulate(5, 22, true, true);
    const adjusted = simulate(5, 16, true, true);
    expect(unchanged.K).toBeLessThan(OK_THRESHOLD);
    expect(adjusted.D).toBeGreaterThan(unchanged.D);
    expect(adjusted.K).toBeGreaterThan(unchanged.K);
    expect(adjusted.X).toBeGreaterThan(unchanged.X);
    expect(isAllGreen(adjusted)).toBe(true);
    expect(explain(5, 16, true, true, adjusted)).toContain('đã được giải tỏa');
  });

  test('retains the previously published fixed waiting pressure for version 2 records', () => {
    expect(simulate(5, 16, true, true, 2)).toEqual({ D: 100, P: 53, K: 54, X: 93, strike: false });
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
          const res = simulate(r, c, floor, dialogue, 1);
          res.allGreen = isAllGreen(res);
          const ref = original.simulate(r, c, floor, dialogue);
          ref.allGreen = res.allGreen;
          expect(explain(r, c, floor, dialogue, res, 1)).toBe(original.explainFor(r, c, floor, dialogue, ref));
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
