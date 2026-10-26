import { describe, expect, test } from 'vitest';
import { createStore } from '../src/store.js';
import { STORAGE_KEY, defaultData } from '../src/storage.js';
import { createInitialState } from '../src/game/state.js';
import { memoryBackend, throwingBackend } from './helpers.js';

const AT = new Date('2026-10-26T08:30:00.000Z');

function playWholeGame(store) {
  const { actions } = store;
  actions.start();
  for (let day = 1; day <= 5; day++) {
    actions.confirm();
    actions.next();
  }
}

describe('createStore', () => {
  test('starts on a fresh intro and saves it when nothing is stored', () => {
    const backend = memoryBackend();
    const store = createStore({ backend });
    const { game, data, storageOk } = store.getSnapshot();
    expect(game).toEqual(createInitialState());
    expect(data.games).toEqual([]);
    expect(storageOk).toBe(true);
    expect(JSON.parse(backend.map.get(STORAGE_KEY)).current.screen).toBe('intro');
  });

  test('every change is saved, so a reload continues the same day', () => {
    const backend = memoryBackend();
    const { actions } = createStore({ backend });
    actions.start();
    actions.setCommission(30);
    actions.toggleDialogue();
    actions.confirm();
    const reloaded = createStore({ backend }).getSnapshot().game;
    expect(reloaded).toMatchObject({ screen: 'play', round: 1, commission: 30, dialogue: true });
    expect(reloaded.result).not.toBeNull();
  });

  test('finishing a game records it exactly once, with the injected time', () => {
    const backend = memoryBackend();
    const store = createStore({ backend, now: () => AT });
    playWholeGame(store);
    const { game, data } = store.getSnapshot();
    expect(game.screen).toBe('end');
    expect(data.games).toHaveLength(1);
    expect(data.games[0].finishedAt).toBe(AT.toISOString());
    expect(data.best).toEqual(data.games[0]);
    expect(store.actions.next()).toBe(false);
    expect(store.getSnapshot().data.games).toHaveLength(1);
  });

  test('reloading on the summary screen does not record the game again', () => {
    const backend = memoryBackend();
    playWholeGame(createStore({ backend, now: () => AT }));
    const reloaded = createStore({ backend }).getSnapshot();
    expect(reloaded.game.screen).toBe('end');
    expect(reloaded.data.games).toHaveLength(1);
  });

  test('tells subscribers about changes and keeps the same snapshot when nothing changes', () => {
    const store = createStore({ backend: memoryBackend() });
    let calls = 0;
    const unsubscribe = store.subscribe(() => { calls++; });
    const before = store.getSnapshot();
    expect(store.actions.confirm()).toBe(false); // nothing to confirm on the intro
    expect(store.getSnapshot()).toBe(before);
    expect(calls).toBe(0);
    expect(store.actions.start()).toBe(true);
    expect(calls).toBe(1);
    expect(store.getSnapshot()).not.toBe(before);
    unsubscribe();
    store.actions.toggleFloor();
    expect(calls).toBe(1);
  });

  test('clearData removes the key and goes back to a fresh intro', () => {
    const backend = memoryBackend();
    const store = createStore({ backend, now: () => AT });
    playWholeGame(store);
    store.actions.clearData();
    expect(backend.map.has(STORAGE_KEY)).toBe(false);
    expect(store.getSnapshot().data).toEqual(defaultData());
    expect(store.getSnapshot().game).toEqual(createInitialState());
  });

  test('a browser that refuses storage still plays, and says it cannot save', () => {
    const store = createStore({ backend: throwingBackend() });
    expect(store.getSnapshot().storageOk).toBe(false);
    store.actions.start();
    store.actions.confirm();
    expect(store.getSnapshot().game.result).not.toBeNull();
    expect(store.getSnapshot().storageOk).toBe(false);
  });

  test('broken saved data starts a fresh game but keeps valid history', () => {
    const backend = memoryBackend();
    playWholeGame(createStore({ backend, now: () => AT }));
    const raw = JSON.parse(backend.map.get(STORAGE_KEY));
    backend.map.set(STORAGE_KEY, JSON.stringify({ ...raw, current: { ...raw.current, round: 42 } }));
    const { game, data } = createStore({ backend }).getSnapshot();
    expect(game).toEqual(createInitialState());
    expect(data.games).toHaveLength(1);
  });
});
