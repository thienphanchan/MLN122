import { describe, expect, test } from 'vitest';
import { STORAGE_KEY, clearData, defaultData, loadData, saveData } from '../src/storage.js';
import { MAX_GAMES, buildRecord, addRecord } from '../src/game/records.js';
import { confirm, createInitialState, next, start, toSaved } from '../src/game/state.js';
import { memoryBackend, throwingBackend } from './helpers.js';

function finishedRecord() {
  let s = start(createInitialState());
  for (let i = 0; i < 5; i++) {
    s = confirm(s);
    if (i < 4) s = next(s);
  }
  return buildRecord(next(s).history, new Date('2026-10-26T08:30:00.000Z'));
}

function sampleData() {
  const data = addRecord(defaultData(), finishedRecord());
  return { ...data, current: toSaved(confirm(start(createInitialState()))) };
}

describe('defaultData', () => {
  test('is version 1 with nothing saved', () => {
    expect(STORAGE_KEY).toBe('cbcx:v1');
    expect(defaultData()).toEqual({ version: 1, current: null, games: [], best: null });
  });
});

describe('saveData and loadData', () => {
  test('an empty browser gives the default data', () => {
    expect(loadData(memoryBackend())).toEqual(defaultData());
  });

  test('what is saved is read back the same', () => {
    const backend = memoryBackend();
    const data = sampleData();
    expect(saveData(data, backend)).toBe(true);
    expect(loadData(backend)).toEqual(data);
  });

  test('uses one key holding JSON', () => {
    const backend = memoryBackend();
    saveData(sampleData(), backend);
    expect([...backend.map.keys()]).toEqual(['cbcx:v1']);
    expect(JSON.parse(backend.map.get('cbcx:v1')).version).toBe(1);
  });
});

describe('broken data falls back to the default', () => {
  const cases = {
    'invalid JSON': '{"version":1,',
    'another version': JSON.stringify({ ...defaultData(), version: 2 }),
    'an array': '[]',
    'a number': '42',
    'null': 'null',
    'games that is not a list': JSON.stringify({ ...defaultData(), games: 'lots' }),
    'current that is a string': JSON.stringify({ ...defaultData(), current: 'play' }),
  };
  for (const [name, raw] of Object.entries(cases)) {
    test(name, () => {
      expect(loadData(memoryBackend({ [STORAGE_KEY]: raw }))).toEqual(defaultData());
    });
  }

  test('a broken in-progress game is dropped without losing history or the best result', () => {
    const record = finishedRecord();
    for (const current of ['x', [], 3, undefined]) {
      const stored = { version: 1, games: [record], best: record };
      if (current !== undefined) stored.current = current;
      const data = loadData(memoryBackend({ [STORAGE_KEY]: JSON.stringify(stored) }));
      expect(data, JSON.stringify(current)).toEqual({ version: 1, current: null, games: [record], best: record });
    }
  });

  test('a broken games list is emptied without losing the best result', () => {
    const record = finishedRecord();
    const raw = JSON.stringify({ version: 1, current: null, games: 'lots', best: record });
    expect(loadData(memoryBackend({ [STORAGE_KEY]: raw }))).toEqual({ version: 1, current: null, games: [], best: record });
  });

  test('keeps the valid games and drops the broken ones', () => {
    const record = finishedRecord();
    const raw = JSON.stringify({ ...defaultData(), games: [record, { wins: 9 }, null], best: { nope: true } });
    const data = loadData(memoryBackend({ [STORAGE_KEY]: raw }));
    expect(data.games).toEqual([record]);
    expect(data.best).toBeNull();
  });

  test('keeps the first valid record per ID without losing other games or the best', () => {
    const first = finishedRecord();
    const other = { ...first, id: 'other-game' };
    const duplicate = { ...first, finishedAt: '2026-10-25T08:30:00.000Z' };
    const broken = { ...first, wins: 99 };
    const raw = JSON.stringify({ ...defaultData(), games: [broken, first, other, duplicate], best: first });
    const data = loadData(memoryBackend({ [STORAGE_KEY]: raw }));
    expect(data.games).toEqual([first, other]);
    expect(data.best).toEqual(first);
  });

  test('applies the history limit after rejecting invalid and duplicate records', () => {
    const first = finishedRecord();
    const records = Array.from({ length: MAX_GAMES + 2 }, (_, i) => ({ ...first, id: `game-${i}` }));
    const raw = JSON.stringify({ ...defaultData(), games: [null, records[0], ...records], best: first });
    const data = loadData(memoryBackend({ [STORAGE_KEY]: raw }));
    expect(data.games).toEqual(records.slice(0, MAX_GAMES));
    expect(data.best).toEqual(first);
  });
});

describe('when the browser refuses storage', () => {
  test('loading gives the default data without throwing', () => {
    expect(loadData(throwingBackend())).toEqual(defaultData());
    expect(loadData(null)).toEqual(defaultData());
  });

  test('saving and clearing report false without throwing', () => {
    expect(saveData(sampleData(), throwingBackend())).toBe(false);
    expect(clearData(throwingBackend())).toBe(false);
    expect(saveData(sampleData(), null)).toBe(false);
  });
});

describe('clearData', () => {
  test('removes the key', () => {
    const backend = memoryBackend();
    saveData(sampleData(), backend);
    expect(clearData(backend)).toBe(true);
    expect(backend.map.has(STORAGE_KEY)).toBe(false);
    expect(loadData(backend)).toEqual(defaultData());
  });
});
