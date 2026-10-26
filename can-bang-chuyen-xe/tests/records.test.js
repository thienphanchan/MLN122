import { describe, expect, test } from 'vitest';
import { MAX_GAMES, addRecord, buildRecord, isBetter, isValidRecord } from '../src/game/records.js';
import { confirm, createInitialState, next, setCommission, start, toggleDialogue, toggleFloor } from '../src/game/state.js';
import { defaultData } from '../src/storage.js';

function finishedHistory(days) {
  let s = start(createInitialState());
  days.forEach(([c, f, d], i) => {
    s = setCommission(s, c);
    if (s.floor !== f) s = toggleFloor(s);
    if (s.dialogue !== d) s = toggleDialogue(s);
    s = confirm(s);
    if (i < days.length - 1) s = next(s);
  });
  return next(s).history;
}

const FIVE_WINS = [[20, false, false], [22, true, true], [22, true, true], [22, true, true], [22, true, true]];
const ONE_WIN = [[20, false, false], [35, false, false], [35, false, false], [35, false, false], [35, false, false]];
const AT = new Date('2026-10-26T08:30:00.000Z');

describe('buildRecord', () => {
  test('keeps the time, the number of good days, every choice and every score', () => {
    const history = finishedHistory(FIVE_WINS);
    const record = buildRecord(history, AT);
    expect(record.finishedAt).toBe('2026-10-26T08:30:00.000Z');
    expect(record.wins).toBe(5);
    expect(record.days).toHaveLength(5);
    expect(record.days[0]).toEqual({ commission: 20, floor: false, dialogue: false, scores: { D: 70, P: 52, K: 72, X: 59 }, allGreen: true });
    expect(record.total).toBe(history.reduce((sum, h) => sum + h.scores.D + h.scores.P + h.scores.K + h.scores.X, 0));
    expect(typeof record.id).toBe('string');
    expect(isValidRecord(record)).toBe(true);
  });
});

describe('isBetter', () => {
  const rec = (wins, total, iso = '2026-10-26T08:00:00.000Z') => ({ wins, total, finishedAt: iso });

  test('anything beats having no best yet', () => {
    expect(isBetter(rec(0, 10), null)).toBe(true);
  });

  test('more good days wins, then the higher total', () => {
    expect(isBetter(rec(4, 900), rec(3, 1500))).toBe(true);
    expect(isBetter(rec(3, 1500), rec(4, 900))).toBe(false);
    expect(isBetter(rec(4, 1200), rec(4, 1100))).toBe(true);
  });

  test('a tie keeps the older result', () => {
    expect(isBetter(rec(4, 1200, '2026-10-27T00:00:00.000Z'), rec(4, 1200))).toBe(false);
  });
});

describe('addRecord', () => {
  test('puts the newest game first and sets the first best', () => {
    const record = buildRecord(finishedHistory(ONE_WIN), AT);
    const data = addRecord(defaultData(), record);
    expect(data.games).toEqual([record]);
    expect(data.best).toEqual(record);
  });

  test('keeps the best when the new game is worse, replaces it when better', () => {
    const good = buildRecord(finishedHistory(FIVE_WINS), AT);
    const bad = buildRecord(finishedHistory(ONE_WIN), new Date('2026-10-26T09:00:00.000Z'));
    const afterBad = addRecord(addRecord(defaultData(), good), bad);
    expect(afterBad.games.map((g) => g.wins)).toEqual([1, 5]);
    expect(afterBad.best).toEqual(good);
    const afterGood = addRecord(addRecord(defaultData(), bad), good);
    expect(afterGood.best).toEqual(good);
  });

  test(`keeps only the latest ${MAX_GAMES} games but never loses the best`, () => {
    const best = buildRecord(finishedHistory(FIVE_WINS), AT);
    let data = addRecord(defaultData(), best);
    for (let i = 0; i < MAX_GAMES + 5; i++) {
      data = addRecord(data, buildRecord(finishedHistory(ONE_WIN), new Date(AT.getTime() + (i + 1) * 60000)));
    }
    expect(MAX_GAMES).toBe(50);
    expect(data.games).toHaveLength(50);
    expect(data.games.some((g) => g.id === best.id)).toBe(false);
    expect(data.best).toEqual(best);
  });

  test('does not change the data it was given', () => {
    const data = defaultData();
    addRecord(data, buildRecord(finishedHistory(ONE_WIN), AT));
    expect(data).toEqual(defaultData());
  });
});

describe('isValidRecord', () => {
  test('rejects records with missing or impossible fields', () => {
    const good = buildRecord(finishedHistory(FIVE_WINS), AT);
    const bad = [
      null,
      {},
      { ...good, wins: 6 },
      { ...good, finishedAt: 'yesterday' },
      { ...good, days: good.days.slice(0, 4) },
      { ...good, days: [{ ...good.days[0], commission: 80 }, ...good.days.slice(1)] },
      { ...good, days: [{ ...good.days[0], scores: { D: 120, P: 0, K: 0, X: 0 } }, ...good.days.slice(1)] },
      { ...good, total: 'a lot' },
    ];
    for (const r of bad) expect(isValidRecord(r), JSON.stringify(r)).toBe(false);
  });

  test('rejects a record whose scores do not match its decisions', () => {
    const good = buildRecord(finishedHistory(ONE_WIN), AT);
    const perfect = { D: 100, P: 100, K: 100, X: 100 };
    const edited = {
      ...good,
      days: good.days.map((d) => ({ ...d, scores: perfect, allGreen: true })),
      wins: 5,
      total: 2000,
    };
    expect(isValidRecord(edited)).toBe(false);
  });
});
