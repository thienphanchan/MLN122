// Kho trạng thái của app: giữ ván đang chơi và dữ liệu đã lưu, ghi localStorage sau mỗi thay đổi.
// Không phụ thuộc React; giao diện đọc nó qua useSyncExternalStore.
import { addRecord, buildRecord } from './game/records.js';
import * as game from './game/state.js';
import { clearData, defaultData, loadData, saveData } from './storage.js';

export function createStore({ backend, now = () => new Date() }) {
  let data = loadData(backend);
  let current = game.restoreState(data.current) ?? game.createInitialState();
  let storageOk = persist();
  let snapshot = { game: current, data, storageOk };
  const listeners = new Set();

  function persist() {
    data = { ...data, current: game.toSaved(current) };
    return saveData(data, backend);
  }

  function emit() {
    snapshot = { game: current, data, storageOk };
    listeners.forEach((listener) => listener());
  }

  // Áp một bước chuyển của game; trả false khi bước đó không làm gì.
  function apply(transition, ...args) {
    const next = transition(current, ...args);
    if (next === current) return false;
    if (current.screen === 'play' && next.screen === 'end') {
      data = addRecord(data, buildRecord(next.history, now()));
    }
    current = next;
    storageOk = persist();
    emit();
    return true;
  }

  const actions = {
    start: () => apply(game.start),
    setCommission: (value) => apply(game.setCommission, value),
    toggleFloor: () => apply(game.toggleFloor),
    toggleDialogue: () => apply(game.toggleDialogue),
    confirm: () => apply(game.confirm),
    next: () => apply(game.next),
    restart: () => apply(game.restart),
    // Đọc lại localStorage khi một tab khác vừa ghi, để tab này không ghi đè mất dữ liệu đó.
    reload: () => {
      data = loadData(backend);
      current = game.restoreState(data.current) ?? game.createInitialState();
      emit();
      return true;
    },
    clearData: () => {
      clearData(backend);
      data = defaultData();
      current = game.createInitialState();
      emit();
      return true;
    },
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    actions,
  };
}
